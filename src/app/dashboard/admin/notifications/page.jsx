'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Send, Clock, Users, RefreshCw } from 'lucide-react';

export default function NotificationHubPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({
    targetGroup: 'students',
    module: '',
    batch: '',
    repeatStatus: '',
    riskLevel: '',
    message: '',
    scheduleDate: '',
  });

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/notifications?admin=true', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        } else {
          throw new Error(data.error || 'Failed to fetch notifications');
        }
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    const notificationDate = date instanceof Date ? date : new Date(date);
    return notificationDate.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSend = async (e) => {
    e?.preventDefault?.();

    // Basic validation
    if (!form.message.trim()) {
      setError('Message is required');
      return;
    }

    if (!session?.user) {
      setError('User session not found');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Prepare target filters
      const targetFilters = {};
      if (form.batch) targetFilters.batch = form.batch;
      if (form.module) targetFilters.module = form.module;
      if (form.repeatStatus) targetFilters.repeatStatus = form.repeatStatus;
      if (form.riskLevel) targetFilters.riskLevel = form.riskLevel;

      const notificationData = {
        message: form.message.trim(),
        targetGroup: form.targetGroup,
        targetFilters,
        scheduleDate: form.scheduleDate || null
      };

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(notificationData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Reset form
          setForm({
            targetGroup: 'students',
            module: '',
            batch: '',
            repeatStatus: '',
            riskLevel: '',
            message: '',
            scheduleDate: '',
          });
          
          // Refresh notifications list
          await fetchNotifications();
          
          // Show success message
          alert(`✅ ${result.message}`);
        } else {
          throw new Error(result.error || 'Failed to send notification');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      setError(`Failed to send notification: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const getRecipientDisplay = (notification) => {
    if (!notification.targetFilters || Object.keys(notification.targetFilters).length === 0) {
      return `All ${notification.targetGroup}`;
    }
    
    const filters = [];
    if (notification.targetFilters.batch) filters.push(`Batch: ${notification.targetFilters.batch}`);
    if (notification.targetFilters.module) filters.push(`Module: ${notification.targetFilters.module}`);
    if (notification.targetFilters.repeatStatus) filters.push(`Status: ${notification.targetFilters.repeatStatus}`);
    if (notification.targetFilters.riskLevel) filters.push(`Risk: ${notification.targetFilters.riskLevel}`);
    
    return filters.length > 0 ? filters.join(', ') : `All ${notification.targetGroup}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Send className="w-4 h-4 text-green-400" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const card = 'bg-white/5 border border-white/10 rounded-2xl backdrop-blur-lg';
  const input =
    'w-full rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/60 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400/40 focus:border-blue-400';
  const label = 'block text-sm text-white/80 mb-1';
  const button =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-all duration-200';
  const btnPrimary = `${button} bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed`;
  const btnGhost = `${button} bg-white/10 hover:bg-white/20 text-white`;

  return (
    <>
      <style jsx>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .notification-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }
        
        .glass-effect {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
        }
        
        .notification-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 50px 0 rgba(0, 0, 0, 0.5);
        }
      `}</style>
      
      <div className="p-6 space-y-6 text-white">
        {/* Header */}
        <div className={`flex items-center justify-between ${
          isMounted ? 'notification-animated' : 'opacity-0'
        }`}>
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Notification Hub</h1>
              <p className="text-white/70">Send and manage notifications to students and educators.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className={btnGhost}
              title="Refresh notifications"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-100 ml-4"
            >
              ×
            </button>
          </div>
        )}
        {/* Notification Form */}
        <section className={`${card} p-6 space-y-4 glass-effect ${
          isMounted ? 'notification-animated' : 'opacity-0'
        }`} style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-semibold flex items-center">
            <Send className="w-5 h-5 mr-2 text-blue-400" />
            Send Notification
          </h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Target Group *</label>
                <select
                  className={input}
                  name="targetGroup"
                  value={form.targetGroup}
                  onChange={handleChange}
                  required
                >
                  <option value="students">Students</option>
                  <option value="educators">Educators</option>
                  <option value="all">All Users</option>
                </select>
              </div>
              <div>
                <label className={label}>Module (Optional)</label>
                <input
                  className={input}
                  placeholder="e.g., DBMS, OOP, Computer Networks"
                  name="module"
                  value={form.module}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={label}>Batch (Optional)</label>
                <input
                  className={input}
                  placeholder="e.g., Y1.S1.B2, Batch 23"
                  name="batch"
                  value={form.batch}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={label}>Repeat Status (Optional)</label>
                <select
                  className={input}
                  name="repeatStatus"
                  value={form.repeatStatus}
                  onChange={handleChange}
                >
                  <option value="">All Students</option>
                  <option value="repeat">Repeat Students</option>
                  <option value="fresh">Fresh Students</option>
                </select>
              </div>
              <div>
                <label className={label}>Risk Level (Optional)</label>
                <select
                  className={input}
                  name="riskLevel"
                  value={form.riskLevel}
                  onChange={handleChange}
                >
                  <option value="">All Risk Levels</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </select>
              </div>
              <div>
                <label className={label}>Schedule Date (Optional)</label>
                <input
                  className={input}
                  type="datetime-local"
                  name="scheduleDate"
                  value={form.scheduleDate}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <div>
              <label className={label}>Message *</label>
              <textarea
                rows={4}
                className={input}
                placeholder="Enter your notification message here..."
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                maxLength={500}
              />
              <div className="text-xs text-white/60 mt-1">
                {form.message.length}/500 characters
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className={btnGhost}
                onClick={() =>
                  setForm({
                    targetGroup: 'students',
                    module: '',
                    batch: '',
                    repeatStatus: '',
                    riskLevel: '',
                    message: '',
                    scheduleDate: '',
                  })
                }
                disabled={sending}
              >
                Clear
              </button>
              <button 
                type="submit" 
                className={btnPrimary} 
                disabled={!form.message.trim() || sending}
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {form.scheduleDate ? 'Schedule Notification' : 'Send Now'}
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Divider */}
        <div className="h-px bg-white/10" />

        {/* Sent Notifications */}
        <section className={`${card} p-6 glass-effect ${
          isMounted ? 'notification-animated' : 'opacity-0'
        }`} style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" />
              Sent Notifications
            </h2>
            <span className="text-sm text-white/60">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/60">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No notifications sent yet.</p>
              <p className="text-white/40 text-sm mt-1">Create your first notification above!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 notification-card ${
                    isMounted ? 'notification-animated' : 'opacity-0'
                  }`}
                  style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(notification.status)}
                        <span className="text-sm font-medium text-white/80">
                          {notification.status === 'scheduled' ? 'Scheduled' : 'Sent'}
                        </span>
                        <span className="text-xs text-white/50">•</span>
                        <span className="text-xs text-white/50">
                          {formatDate(notification.createdAt)}
                        </span>
                        {notification.recipientCount && (
                          <>
                            <span className="text-xs text-white/50">•</span>
                            <span className="text-xs text-white/50">
                              {notification.recipientCount} recipient{notification.recipientCount !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <p className="text-white mb-2 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span className="px-2 py-1 bg-blue-500/20 rounded">
                          {notification.targetGroup}
                        </span>
                        <span>→</span>
                        <span>{getRecipientDisplay(notification)}</span>
                      </div>
                      
                      {notification.scheduleDate && new Date(notification.scheduleDate) > new Date() && (
                        <div className="mt-2 text-xs text-yellow-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Scheduled for: {formatDate(notification.scheduleDate)}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-white/40 ml-4">
                      by {notification.createdByName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
