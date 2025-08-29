"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, MessageSquare, User, Calendar, AlertCircle, Megaphone, UserCheck } from "lucide-react";

export default function LectureFeedbackAlerts() {
  const { data: session } = useSession();
  const [feedbackAlerts, setFeedbackAlerts] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'feedback'
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    await Promise.all([
      fetchLectureFeedback(),
      fetchAdminNotifications()
    ]);
  };

  const fetchAdminNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userType=student&userId=${session.user.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAdminNotifications(data.notifications || []);
        } else {
          console.error('Failed to fetch notifications:', data.error);
        }
      } else {
        console.error('Server error fetching notifications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    }
  };

  const fetchLectureFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch educator feedback for this student
      const response = await fetch(`/api/educator/module-feedback?studentId=${session.user.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Transform feedback into alert format
          const alerts = data.feedbacks.map(feedback => ({
            id: feedback.id,
            moduleTitle: feedback.moduleTitle || 'Unknown Module',
            feedback: feedback.feedback,
            educatorName: feedback.educatorName || 'Unknown Educator',
            createdAt: feedback.createdAt,
            updatedAt: feedback.updatedAt,
            isRepeatModule: feedback.isRepeatModule || false,
            isNew: isNewFeedback(feedback.createdAt) // Check if feedback is within last 7 days
          }));
          
          // Sort by creation date (newest first)
          alerts.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return bTime - aTime;
          });
          
          setFeedbackAlerts(alerts);
        } else {
          throw new Error(data.error || 'Failed to fetch feedback');
        }
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching lecture feedback:', error);
      setError('Failed to load lecture feedback. Please try again.');
      setFeedbackAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if feedback is new (within last 7 days)
  const isNewFeedback = (createdAt) => {
    if (!createdAt) return false;
    const feedbackDate = createdAt?.toDate?.() || new Date(createdAt);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return feedbackDate > sevenDaysAgo;
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    const feedbackDate = date?.toDate?.() || new Date(date);
    return feedbackDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notificationId,
          userId: session.user.id
        })
      });
      
      if (response.ok) {
        // Update local state to mark as read
        setAdminNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Dismiss notification (mark as read and remove from view)
  const dismissNotification = async (notificationId) => {
    await markNotificationAsRead(notificationId);
    setAdminNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Dismiss feedback alert (mark as read)
  const dismissAlert = async (alertId) => {
    try {
      // Remove from local state immediately for better UX
      setFeedbackAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      // You could add an API call here to mark feedback as read if needed
      console.log(`Dismissing feedback alert: ${alertId}`);
    } catch (error) {
      console.error('Error dismissing alert:', error);
      // Revert the change if API call fails
      await fetchLectureFeedback();
    }
  };

  return (
    <>
      <style jsx>{`
        /* Importing new fonts */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;500;600&display=swap');

        /* Animation for individual alert cards */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alert-card-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        /* Updated: Glass-effect for white background with slight transparency */
        .glass-effect {
          background-color: rgba(255, 255, 255, 0.8); /* Predominantly white, slight transparency */
          backdrop-filter: blur(8px) saturate(180%); /* Reduced blur slightly for white */
          -webkit-backdrop-filter: blur(8px) saturate(180%); /* Safari support */
          border: 1px solid rgba(0, 0, 0, 0.08); /* Subtle border for definition */
          box-shadow: 0 5px 25px 0 rgba(0, 0, 0, 0.15); /* Lighter, but present shadow */
          transition: all 0.3s ease-in-out; /* Smooth transition for glass effect properties */
        }

        /* Updated: Hover effect for glass cards */
        .glass-effect:hover {
          background-color: rgba(255, 255, 255, 0.9); /* More opaque on hover */
          border-color: rgba(0, 0, 0, 0.15); /* Slightly darker border on hover */
          box-shadow: 0 8px 30px 0 rgba(0, 0, 0, 0.25); /* More pronounced shadow on hover */
        }

        /* Updated Fonts */
        .main-font {
            font-family: 'Lato', sans-serif; /* Body text font */
        }
        .header-font {
            font-family: 'Montserrat', sans-serif; /* Headers font */
        }

        /* Basic fade-in for the main component heading */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animated-entry {
          animation: fadeIn 0.8s ease-out forwards;
        }

        /* New: Divider animation */
        @keyframes drawLine {
          from { width: 0%; }
          to { width: 100%; }
        }

        .animated-divider {
            animation: drawLine 1s ease-out forwards;
            animation-delay: 0.5s; /* Delay after heading appears */
        }

        /* Button hover effect */
        .btn-hover-effect:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4); /* Cyan glow */
        }

        /* Alert Dismiss Button specific hover */
        .dismiss-btn:hover {
            transform: scale(1.05);
            background-color: rgba(0, 0, 0, 0.05); /* Subtle dark background on hover */
            color: #ef4444; /* Red text on hover */
        }
      `}</style>
      <div className="main-font">
        <div className="flex items-center mb-4">
          <Bell className="w-8 h-8 mr-3 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-800 header-font animated-entry">
            Alerts
          </h1>
        </div>
        
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Megaphone className="w-4 h-4" />
              <span>Announcements</span>
              {adminNotifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {adminNotifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'feedback'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>Educator Feedback</span>
              {feedbackAlerts.filter(f => f.isNew).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {feedbackAlerts.filter(f => f.isNew).length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'notifications' ? (
          /* Admin Notifications */
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading announcements...</p>
              </div>
            ) : adminNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Announcements</h3>
                <p className="text-gray-500">You're all caught up! No new announcements from administration.</p>
              </div>
            ) : (
              adminNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`glass-effect p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-[1.01] ${
                    isMounted ? 'alert-card-animated' : 'opacity-0 scale-95'
                  } ${
                    !notification.isRead ? 'border-l-4 border-blue-500' : 'border-l-4 border-gray-300'
                  }`}
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Megaphone className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Admin Announcement</span>
                        {!notification.isRead && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            NEW
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          • {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>From: {notification.createdByName}</span>
                        
                        {notification.targetGroup !== 'all' && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                              Target: {notification.targetGroup}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600 ml-4 p-1 rounded-full hover:bg-gray-100 dismiss-btn transition-all duration-200"
                      title="Dismiss notification"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Educator Feedback */
          <div className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <p>{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 ml-2 underline text-sm"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading feedback...</p>
              </div>
            ) : feedbackAlerts.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Feedback</h3>
                <p className="text-gray-500">You're all caught up! No new educator feedback available.</p>
              </div>
            ) : (
              /* Feedback Alerts List */
              feedbackAlerts.map((alert, index) => (
                <div
                  key={alert.id}
                  className={`glass-effect p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-[1.01] ${
                    isMounted ? 'alert-card-animated' : 'opacity-0 scale-95'
                  }`}
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        <span className="text-lg font-semibold text-gray-800">{alert.moduleTitle}</span>
                        {alert.isNew && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            NEW
                          </span>
                        )}
                        {alert.isRepeatModule && (
                          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                            REPEAT MODULE
                          </span>
                        )}
                      </div>
                      
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {alert.feedback}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>From: {alert.educatorName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(alert.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-400 hover:text-gray-600 ml-4 p-2 rounded-full hover:bg-gray-100 dismiss-btn transition-all duration-200"
                      title="Dismiss alert"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
