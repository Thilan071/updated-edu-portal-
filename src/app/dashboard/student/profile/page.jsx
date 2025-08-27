"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Upload, User } from "lucide-react";

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        // Change this to your actual endpoint that returns the current user.
        const res = await fetch("/api/me");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load profile");
        setMe(data?.user || data);
      } catch (e) {
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

  if (loading) return <p className="text-white/80">Loading profile…</p>;
  if (err) return <p className="text-red-400">Error: {err}</p>;
  if (!me) return <p className="text-white/80">No profile data.</p>;

  return (
    <div className="text-white">
      <h1 className="text-2xl font-semibold mb-6">My Profile</h1>
      
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
          <div className="text-lg">{[me.firstName, me.lastName].filter(Boolean).join(" ") || "—"}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-sm opacity-70">Email</div>
          <div className="text-lg">{me.email || "—"}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-sm opacity-70">Telephone</div>
          <div className="text-lg">{me.telephone || "—"}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-4 bg-white/5 md:col-span-2">
          <div className="text-sm opacity-70">Address</div>
          <div className="text-lg">
            {typeof me.address === "string"
              ? me.address
              : [me?.address?.street, me?.address?.city, me?.address?.zip].filter(Boolean).join(", ") || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
