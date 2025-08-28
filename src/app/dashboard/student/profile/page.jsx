"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Upload, User, Edit3, Save, X } from "lucide-react";

// Profile page with update functionality
export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editData, setEditData] = useState({});
  const fileInputRef = useRef(null);

  // Helper function to format date for input field
  const getFormattedDateForInput = (date) => {
    if (!date) return '';
    try {
      // Handle Firestore Timestamp
      if (date && typeof date.toDate === 'function') {
        return date.toDate().toISOString().split('T')[0];
      }
      // Handle Date object
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      // Handle string date
      if (typeof date === 'string') {
        return new Date(date).toISOString().split('T')[0];
      }
      return '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Helper function to format date for display
  const getFormattedDateForDisplay = (date) => {
    if (!date) return '—';
    try {
      // Handle Firestore Timestamp
      if (date && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      // Handle Date object
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      // Handle string date
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString();
      }
      return '—';
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return '—';
    }
  };

  useEffect(() => {
    (async () => {
      try {
        // Change this to your actual endpoint that returns the current user.
        const res = await fetch("/api/me");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load profile");
        const userData = data?.user || data;
        setMe(userData);
        // Initialize edit data with current user data
        setEditData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          telephone: userData.telephone || '',
          address: typeof userData.address === "string" ? userData.address : 
                   [userData?.address?.street, userData?.address?.city, userData?.address?.zip].filter(Boolean).join(", ") || '',
          dob: getFormattedDateForInput(userData.dob)
        });
      } catch (e) {
        console.error('Profile loading error:', e);
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      // Update the local state with new image URL
      setMe(prev => ({ ...prev, photoUrl: data.imageUrl }));
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset edit data to original values
      setEditData({
        firstName: me.firstName || '',
        lastName: me.lastName || '',
        telephone: me.telephone || '',
        address: typeof me.address === "string" ? me.address : 
                 [me?.address?.street, me?.address?.city, me?.address?.zip].filter(Boolean).join(", ") || '',
        dob: getFormattedDateForInput(me.dob)
      });
      setSaveError("");
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError("");

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update the local state with new data
      setMe(data.user);
      setIsEditing(false);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white/80">Loading profile…</p>;
  if (err) return <p className="text-red-400">Error: {err}</p>;
  if (!me) return <p className="text-white/80">No profile data.</p>;

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-lg transition-colors"
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleEditToggle}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 rounded-lg transition-colors"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleEditToggle}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {saveError}
        </div>
      )}
      
      {/* Profile Image Section */}
      <div className="mb-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 bg-white/5">
              {me.photoUrl ? (
                <img 
                  src={me.photoUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={48} className="text-white/40" />
                </div>
              )}
            </div>
            
            {/* Upload overlay */}
            <div 
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={triggerFileInput}
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : (
                <Camera size={24} className="text-white" />
              )}
            </div>
          </div>
          
          <button
            onClick={triggerFileInput}
            disabled={uploading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg transition-colors"
          >
            <Upload size={16} />
            <span>{uploading ? 'Uploading...' : 'Change Photo'}</span>
          </button>
          
          {uploadError && (
            <p className="text-red-400 text-sm">{uploadError}</p>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>
      
      {/* Profile Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-sm opacity-70">Student ID</div>
          <div className="text-lg">{me.studentId || "—"}</div>
        </div>
        
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-sm opacity-70">Name</div>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="text"
                value={editData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="First Name"
                className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
              />
              <input
                type="text"
                value={editData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Last Name"
                className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
              />
            </div>
          ) : (
            <div className="text-lg">{[me.firstName, me.lastName].filter(Boolean).join(" ") || "—"}</div>
          )}
        </div>
        
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-sm opacity-70">Email</div>
          <div className="text-lg">{me.email || "—"}</div>
          {isEditing && (
            <div className="text-xs text-yellow-400 mt-1">Email cannot be changed</div>
          )}
        </div>
        
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-sm opacity-70">Telephone</div>
          {isEditing ? (
            <input
              type="tel"
              value={editData.telephone}
              onChange={(e) => handleInputChange('telephone', e.target.value)}
              placeholder="Enter phone number"
              className="mt-1 w-full bg-white/10 border border-white/20 rounded px-3 py-1 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
            />
          ) : (
            <div className="text-lg">{me.telephone || "—"}</div>
          )}
        </div>
        
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-sm opacity-70">Date of Birth</div>
          {isEditing ? (
            <input
              type="date"
              value={editData.dob}
              onChange={(e) => handleInputChange('dob', e.target.value)}
              className="mt-1 w-full bg-white/10 border border-white/20 rounded px-3 py-1 text-white focus:outline-none focus:border-blue-400"
            />
          ) : (
            <div className="text-lg">
              {getFormattedDateForDisplay(me.dob)}
            </div>
          )}
        </div>
        
        <div className="rounded-xl border border-white/10 p-4 bg-white/5 md:col-span-2">
          <div className="text-sm opacity-70">Address</div>
          {isEditing ? (
            <textarea
              value={editData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your address"
              rows="3"
              className="mt-1 w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 resize-none"
            />
          ) : (
            <div className="text-lg">
              {typeof me.address === "string"
                ? me.address
                : [me?.address?.street, me?.address?.city, me?.address?.zip].filter(Boolean).join(", ") || "—"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
