"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, MessageSquare, User, Calendar, AlertCircle } from "lucide-react";

export default function LectureFeedbackAlerts() {
  const { data: session } = useSession();
  const [feedbackAlerts, setFeedbackAlerts] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user?.id) {
      fetchLectureFeedback();
    }
  }, [session]);

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
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading feedback alerts...</span>
          </div>
        )}

        {/* Feedback Alerts */}
        {!loading && (
          <div className="space-y-6">
            {feedbackAlerts.length > 0 ? (
              feedbackAlerts.map((alert, idx) => (
                <div
                  key={alert.id}
                  className={`glass-effect p-6 rounded-xl shadow-lg
                    transform hover:scale-[1.01] transition-all duration-300
                    ${isMounted ? 'alert-card-animated' : 'opacity-0 scale-95'}
                    ${alert.isNew ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
                  style={{
                    animationDelay: `${0.2 + idx * 0.08}s`,
                    borderLeft: `8px solid ${alert.isRepeatModule ? '#EF4444' : '#3B82F6'}`
                  }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-1 mb-4 sm:mb-0">
                      <div className="flex items-center mb-2">
                        <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-800">{alert.moduleTitle}</h2>
                        {alert.isNew && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            NEW
                          </span>
                        )}
                        {alert.isRepeatModule && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            REPEAT MODULE
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <User className="w-4 h-4 mr-1" />
                        <span className="mr-4">From: {alert.educatorName}</span>
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(alert.createdAt)}</span>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-400">
                        <p className="text-gray-700 leading-relaxed">{alert.feedback}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center sm:items-end space-y-3 sm:ml-6">
                      <button
                        onClick={() => {
                          // Navigate to module details or open feedback modal
                          console.log(`Viewing details for ${alert.moduleTitle} feedback`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-200 ease-in-out btn-hover-effect focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        View Module
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-gray-600 border border-gray-300 px-3 py-1 rounded-full text-sm transition-all duration-200 ease-in-out dismiss-btn hover:text-red-500"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`glass-effect p-6 rounded-xl shadow-lg text-center
                  transform ${isMounted ? 'alert-card-animated' : 'opacity-0 scale-95'}`}
                  style={{ animationDelay: '0.1s' }}>
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Lecture Feedback</h3>
                <p className="text-gray-500">
                  You don't have any lecture feedback alerts at the moment.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Feedback from your educators will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
