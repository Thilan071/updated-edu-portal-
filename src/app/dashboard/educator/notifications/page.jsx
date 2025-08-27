'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, AlertTriangle, CheckCircle, RefreshCw, Plus } from 'lucide-react';
import apiClient from '@/lib/apiClient';

// Map type → icon + styles to fit the dark theme
const getTypeStyle = (type) => {
  switch (type) {
    case 'info':
      return { icon: <Bell className="w-6 h-6 text-blue-400" />, border: 'border-blue-400/30' };
    case 'warning':
      return { icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />, border: 'border-yellow-400/30' };
    case 'success':
      return { icon: <CheckCircle className="w-6 h-6 text-green-400" />, border: 'border-green-400/30' };
    default:
      return { icon: <Bell className="w-6 h-6 text-gray-400" />, border: 'border-white/10' };
  }
};

// Optional: group by date heading
const groupByDate = (items) =>
  items.reduce((acc, n) => {
    (acc[n.date] = acc[n.date] || []).push(n);
    return acc;
  }, {});

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all'
  });

  const grouped = groupByDate([...notifications].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)));

  useEffect(() => {
    setIsMounted(true);
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // For now, we'll use placeholder data since there's no notifications API endpoint
      // In a real implementation, you would call: await apiClient.notificationAPI.getAll();
      const placeholderNotifications = [
        { 
          id: 1, 
          type: 'info', 
          title: 'Assignment Reminder', 
          message: 'Submit your Database Systems assignment by Friday, 18th Aug.', 
          createdAt: '2025-01-13T10:00:00Z',
          targetAudience: 'all'
        },
        { 
          id: 2, 
          type: 'warning', 
          title: 'Low Attendance Alert', 
          message: 'Some students attendance has dropped below 75%. Please monitor closely.', 
          createdAt: '2025-01-12T14:30:00Z',
          targetAudience: 'educators'
        },
        { 
          id: 3, 
          type: 'success', 
          title: 'Module Completion', 
          message: 'AI Module has been successfully completed by 85% of students!', 
          createdAt: '2025-01-10T09:15:00Z',
          targetAudience: 'educators'
        },
        { 
          id: 4, 
          type: 'info', 
          title: 'Upcoming Assessment', 
          message: 'Web Development assessment scheduled for next week.', 
          createdAt: '2025-01-09T16:45:00Z',
          targetAudience: 'all'
        },
      ];
      setNotifications(placeholderNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    if (!session?.user) return;

    try {
      // In a real implementation, you would call the API:
      // await apiClient.notificationAPI.create({
      //   ...newNotification,
      //   createdBy: session.user.id,
      //   createdAt: new Date().toISOString()
      // });
      
      // For now, add to local state
      const notification = {
        id: Date.now(),
        ...newNotification,
        createdAt: new Date().toISOString(),
        createdBy: session.user.id
      };
      
      setNotifications(prev => [notification, ...prev]);
      setNewNotification({ title: '', message: '', type: 'info', targetAudience: 'all' });
      setShowCreateForm(false);
      alert('Notification sent successfully!');
    } catch (err) {
      console.error('Error creating notification:', err);
      alert('Failed to send notification. Please try again.');
    }
  };

  return (
    <>
      <style jsx>{`
        /* Animations consistent with the overall design */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        /* Glassmorphism effect consistent with layout.jsx */
        .glass-effect-dark {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
        }

        .glass-effect-dark:hover {
          background-color: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-5px) scale(1.01);
          box-shadow: 0 15px 50px 0 rgba(0, 0, 0, 0.5);
        }
      `}</style>
      <div className="main-font text-white">
        <header
          className={`mb-6 ${isMounted ? 'animated-entry' : 'opacity-0'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold header-font">Notifications Management</h1>
              <p className="text-lg text-gray-300">Send and manage notifications to students.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchNotifications}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={16} />
                Send Notification
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchNotifications}
              className="text-blue-400 hover:text-blue-300"
            >
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No notifications found. Send your first notification!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(grouped).map((date, index) => {
              const displayDate = new Date(date).toLocaleDateString();
              const isToday = new Date(date).toDateString() === new Date().toDateString();
              
              return (
                <section key={date} className="space-y-4">
                  <h3
                    className={`text-sm font-semibold text-gray-300 animated-entry`}
                    style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  >
                    {isToday ? 'Today' : displayDate}
                  </h3>
                  {grouped[date].map((note, noteIndex) => {
                    const style = getTypeStyle(note.type);
                    return (
                      <div
                        key={note.id}
                        className={`flex items-start p-4 rounded-xl shadow-sm glass-effect-dark border hover:bg-white/10
                          ${style.border} card-animated`}
                        style={{ animationDelay: `${0.2 + index * 0.1 + noteIndex * 0.05}s` }}
                      >
                        <div className="mr-4 mt-1">{style.icon}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-lg">{note.title}</h4>
                            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                              {note.targetAudience}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">{note.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(note.createdAt || note.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>
        )}

        {/* Create Notification Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">Send Notification</h2>
              
              <form onSubmit={handleCreateNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    placeholder="Notification title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Message</label>
                  <textarea
                    required
                    value={newNotification.message}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    placeholder="Notification message"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Type</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Target Audience</label>
                  <select
                    value={newNotification.targetAudience}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="all">All Students</option>
                    <option value="year1">Year 1 Students</option>
                    <option value="year2">Year 2 Students</option>
                    <option value="year3">Year 3 Students</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
