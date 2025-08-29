'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  RefreshCw, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Target, 
  BarChart2, 
  FileText, 
  Eye,
  UserCheck,
  School,
  Clock,
  Activity
} from 'lucide-react';
import { participationAPI, moduleAPI, adminAPI } from '@/lib/apiClient';

// Color schemes for charts
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
const STATUS_COLORS = {
  good: '#10b981',
  warning: '#f59e0b', 
  critical: '#ef4444'
};

// Helper function for status badges
function StatusBadge({ status, percentage }) {
  const colors = {
    good: 'bg-green-500/20 text-green-300 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    critical: 'bg-red-500/20 text-red-300 border-red-500/30'
  };
  
  const icons = {
    good: <CheckCircle size={14} />,
    warning: <AlertTriangle size={14} />,
    critical: <AlertTriangle size={14} />
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${colors[status]}`}>
      {icons[status]}
      {percentage}%
    </span>
  );
}

export default function AdminParticipationPage() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  
  // Data states
  const [participationData, setParticipationData] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [modules, setModules] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedView, setSelectedView] = useState('system-overview'); // system-overview, detailed, trends, risk-analysis
  const [selectedTimeRange, setSelectedTimeRange] = useState('30'); // days

  useEffect(() => {
    setIsMounted(true);
    if (session?.user) {
      fetchAllData();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchAnalytics();
    }
  }, [selectedModule, selectedTimeRange, session]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch modules and participation data first
      const [modulesResponse, participationResponse] = await Promise.all([
        moduleAPI.getAll(),
        participationAPI.getAll({ moduleId: selectedModule })
      ]);
      
      setModules(modulesResponse.modules || []);
      setParticipationData(participationResponse.participation || []);
      
      // Try to fetch system stats but don't fail if it's not available
      try {
        const statsResponse = await adminAPI.getSystemStats();
        setSystemStats(statsResponse.stats || null);
        console.log('✅ System stats loaded:', statsResponse.stats);
      } catch (statsError) {
        console.warn('⚠️ System stats not available, using fallback calculations:', statsError.message);
        setSystemStats(null);
      }
      
      console.log('✅ Admin participation data loaded:', participationResponse.participation?.length || 0, 'records');
      
    } catch (err) {
      console.error('❌ Error fetching admin participation data:', err);
      setError(err.message || 'Failed to load participation data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      
      const analyticsResponse = await participationAPI.getAnalytics({ 
        moduleId: selectedModule,
        timeRange: selectedTimeRange
      });
      
      setAnalytics(analyticsResponse.analytics);
      console.log('📊 Admin analytics loaded successfully');
      
    } catch (err) {
      console.error('❌ Error fetching admin analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleModuleChange = (moduleId) => {
    setSelectedModule(moduleId);
    fetchAllData();
  };

  const handleTimeRangeChange = (timeRange) => {
    setSelectedTimeRange(timeRange);
  };

  const handleRefresh = () => {
    fetchAllData();
    fetchAnalytics();
  };

  const downloadComprehensiveReport = () => {
    if (participationData.length === 0) return;
    
    const csvData = participationData.map(p => ({
      student_id: p.studentId,
      student_name: p.studentName,
      module: p.moduleName,
      total_sessions: p.totalSessions,
      attended_sessions: p.attendedSessions,
      missed_sessions: p.missedSessions,
      attendance_percentage: p.attendancePercentage,
      avg_participation_score: p.averageParticipationScore,
      status: p.status,
      last_updated: p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString() : 'Never'
    }));
    
    const headers = [
      'student_id', 'student_name', 'module', 'total_sessions', 
      'attended_sessions', 'missed_sessions', 'attendance_percentage', 
      'avg_participation_score', 'status', 'last_updated'
    ];
    const csvContent = [headers.join(','), ...csvData.map(row => headers.map(header => row[header]).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_participation_report_${selectedModule}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRiskReport = () => {
    if (!analytics?.riskAnalysis) return;
    
    const riskStudents = participationData.filter(p => p.status === 'critical' || p.status === 'warning');
    const csvData = riskStudents.map(p => ({
      student_name: p.studentName,
      module: p.moduleName,
      attendance_percentage: p.attendancePercentage,
      status: p.status,
      risk_level: p.status === 'critical' ? 'HIGH' : 'MEDIUM',
      recommended_action: p.status === 'critical' ? 'Immediate intervention required' : 'Monitor closely'
    }));
    
    const headers = ['student_name', 'module', 'attendance_percentage', 'status', 'risk_level', 'recommended_action'];
    const csvContent = [headers.join(','), ...csvData.map(row => headers.map(header => row[header]).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk_analysis_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter participation data based on selected module
  const filteredParticipation = selectedModule === 'all' 
    ? participationData 
    : participationData.filter(p => p.moduleId === selectedModule);

  // Calculate admin-specific metrics using system stats when available
  const adminMetrics = {
    totalStudents: systemStats?.overview?.totalStudents || participationData.length,
    totalModules: systemStats?.overview?.totalModules || modules.length,
    criticalStudents: systemStats?.participation?.criticalRiskStudents || participationData.filter(p => p.status === 'critical').length,
    warningStudents: systemStats?.participation?.warningLevelStudents || participationData.filter(p => p.status === 'warning').length,
    averageAttendance: systemStats?.participation?.averageAttendanceRate || (participationData.length > 0 
      ? Math.round(participationData.reduce((sum, p) => sum + p.attendancePercentage, 0) / participationData.length) 
      : 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg text-gray-300">Loading participation oversight data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">❌ Error Loading Data</div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        .glass-effect-dark {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
        }
      `}</style>
      <div className="main-font text-white">
        <header
          className={`mb-6 ${isMounted ? 'animated-entry' : 'opacity-0'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold header-font flex items-center">
                <Eye className="w-10 h-10 mr-3 text-blue-400" />
                Participation Oversight
              </h1>
              <p className="text-lg text-gray-300">System-wide attendance monitoring and risk management.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleRefresh}
                className="glass-effect-dark px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={downloadComprehensiveReport}
                className="glass-effect-dark px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                disabled={participationData.length === 0}
              >
                <Download size={16} />
                Full Report
              </button>
              <button
                onClick={downloadRiskReport}
                className="glass-effect-dark px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                disabled={!analytics?.riskAnalysis}
              >
                <AlertTriangle size={16} />
                Risk Report
              </button>
            </div>
          </div>
        </header>

        {/* Admin Controls Section */}
        <div className={`mb-6 ${isMounted ? 'card-animated' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
          <div className="glass-effect-dark rounded-2xl p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedModule}
                    onChange={(e) => handleModuleChange(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="all">All Modules</option>
                    {modules.map(module => (
                      <option key={module.id} value={module.id}>{module.title || module.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => handleTimeRangeChange(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">View:</span>
                  <div className="flex rounded-lg border border-white/20 overflow-hidden">
                    {['system-overview', 'detailed', 'trends', 'risk-analysis'].map((view) => (
                      <button
                        key={view}
                        onClick={() => setSelectedView(view)}
                        className={`px-3 py-1 text-sm transition-colors ${
                          selectedView === view 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {view.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Monitoring {filteredParticipation.length} student records
                {systemStats ? (
                  <span className="ml-2 text-green-400">• Using live system data</span>
                ) : (
                  <span className="ml-2 text-yellow-400">• Using fallback calculations</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Overview Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6 ${isMounted ? 'card-animated' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          <div className="glass-effect-dark rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-white">{adminMetrics.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Modules</p>
                <p className="text-2xl font-bold text-white">{adminMetrics.totalModules}</p>
              </div>
              <School className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Average</p>
                <p className="text-2xl font-bold text-green-400">{adminMetrics.averageAttendance}%</p>
              </div>
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">At Risk</p>
                <p className="text-2xl font-bold text-yellow-400">{adminMetrics.warningStudents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Critical</p>
                <p className="text-2xl font-bold text-red-400">{adminMetrics.criticalStudents}</p>
              </div>
              <UserCheck className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Main Content Based on Selected View */}
        {selectedView === 'system-overview' && (
          <div className="space-y-6">
            {/* System-wide Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Module Performance Comparison */}
              {analytics?.moduleComparison && (
                <div className={`glass-effect-dark rounded-2xl p-6 ${isMounted ? 'card-animated' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-blue-400" />
                    Module Performance Overview
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={analytics.moduleComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="module" 
                        stroke="#9ca3af" 
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="attendanceRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgParticipation" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* System Status Distribution */}
              {analytics?.attendanceOverview?.statusDistribution && (
                <div className={`glass-effect-dark rounded-2xl p-6 ${isMounted ? 'card-animated' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    System-wide Status Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={analytics.attendanceOverview.statusDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {analytics.attendanceOverview.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Participation Distribution */}
            {analytics?.participationDistribution && (
              <div className={`glass-effect-dark rounded-2xl p-6 ${isMounted ? 'card-animated' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Attendance Distribution Ranges
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.participationDistribution} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="label" type="category" stroke="#9ca3af" width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {selectedView === 'trends' && analytics?.attendanceTrends && (
          <div className="space-y-6">
            {/* Attendance Trends */}
            <div className={`glass-effect-dark rounded-2xl p-6 ${isMounted ? 'card-animated' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                System-wide Attendance Trends
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics.attendanceTrends}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendanceRate"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#attendanceGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Session Analysis */}
            {analytics?.sessionAnalysis && (
              <div className={`glass-effect-dark rounded-2xl p-6 ${isMounted ? 'card-animated' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  Session-by-Session Analysis
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.sessionAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="session" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="attendanceRate" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {selectedView === 'risk-analysis' && analytics?.riskAnalysis && (
          <div className="space-y-6">
            {/* Risk Analysis Dashboard */}
            <div className={`glass-effect-dark rounded-2xl p-6 ${isMounted ? 'card-animated' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Comprehensive Risk Analysis
              </h3>
              
              {/* Risk Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-300 text-sm">Critical Risk</p>
                      <p className="text-2xl font-bold text-red-400">{analytics.riskAnalysis.riskPercentages.criticalAttendance}%</p>
                      <p className="text-xs text-red-300 mt-1">{analytics.riskAnalysis.riskFactors.criticalAttendance} students</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-300 text-sm">Warning Level</p>
                      <p className="text-2xl font-bold text-yellow-400">{analytics.riskAnalysis.riskPercentages.warningAttendance}%</p>
                      <p className="text-xs text-yellow-300 mt-1">{analytics.riskAnalysis.riskFactors.warningAttendance} students</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm">Low Participation</p>
                      <p className="text-2xl font-bold text-blue-400">{analytics.riskAnalysis.riskPercentages.lowParticipation}%</p>
                      <p className="text-xs text-blue-300 mt-1">{analytics.riskAnalysis.riskFactors.lowParticipation} students</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm">Consistent Absence</p>
                      <p className="text-2xl font-bold text-purple-400">{analytics.riskAnalysis.riskPercentages.consistentAbsence}%</p>
                      <p className="text-xs text-purple-300 mt-1">{analytics.riskAnalysis.riskFactors.consistentAbsence} students</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              {analytics.riskAnalysis.recommendedActions?.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    Immediate Action Items
                  </h4>
                  <div className="space-y-3">
                    {analytics.riskAnalysis.recommendedActions.map((action, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        action.priority === 'high' ? 'bg-red-500/10 border-red-500/30' :
                        action.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-blue-500/10 border-blue-500/30'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            action.priority === 'high' ? 'bg-red-400' :
                            action.priority === 'medium' ? 'bg-yellow-400' :
                            'bg-blue-400'
                          }`}></div>
                          <div className="flex-1">
                            <p className={`font-medium ${
                              action.priority === 'high' ? 'text-red-300' :
                              action.priority === 'medium' ? 'text-yellow-300' :
                              'text-blue-300'
                            }`}>
                              {action.action}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">{action.suggestion}</p>
                            <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                              action.priority === 'high' ? 'bg-red-600 text-red-100' :
                              action.priority === 'medium' ? 'bg-yellow-600 text-yellow-100' :
                              'bg-blue-600 text-blue-100'
                            }`}>
                              {action.priority.toUpperCase()} PRIORITY
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed View - Comprehensive Data Table */}
        {selectedView === 'detailed' && (
          <div className={`glass-effect-dark rounded-2xl p-6 ${isMounted ? 'card-animated' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Detailed Participation Records
            </h3>
            {filteredParticipation.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No participation data found for the selected filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-200 border-collapse">
                  <thead className="bg-white/10 text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Student ID</th>
                      <th className="px-4 py-3 font-semibold">Student Name</th>
                      <th className="px-4 py-3 font-semibold">Module</th>
                      <th className="px-4 py-3 font-semibold">Total Sessions</th>
                      <th className="px-4 py-3 font-semibold">Attended</th>
                      <th className="px-4 py-3 font-semibold">Missed</th>
                      <th className="px-4 py-3 font-semibold">Attendance %</th>
                      <th className="px-4 py-3 font-semibold">Avg Score</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Risk Level</th>
                      <th className="px-4 py-3 font-semibold">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipation.map((entry, idx) => {
                      const riskLevel = entry.attendancePercentage < 50 ? 'HIGH' : 
                                       entry.attendancePercentage < 75 ? 'MEDIUM' : 'LOW';
                      const riskColor = riskLevel === 'HIGH' ? 'text-red-400' : 
                                       riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400';
                      
                      return (
                        <tr key={entry.id || idx} className={`border-t border-white/10 ${idx % 2 === 0 ? '' : 'bg-white/5'} hover:bg-white/10 transition-colors`}>
                          <td className="px-4 py-3 font-mono text-xs">{entry.studentId || 'N/A'}</td>
                          <td className="px-4 py-3 font-medium">{entry.studentName || 'Unknown Student'}</td>
                          <td className="px-4 py-3">{entry.moduleName || 'Unknown Module'}</td>
                          <td className="px-4 py-3 text-center">{entry.totalSessions || 0}</td>
                          <td className="px-4 py-3 text-center text-green-400">{entry.attendedSessions || 0}</td>
                          <td className="px-4 py-3 text-center text-red-400">{entry.missedSessions || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={entry.status} percentage={entry.attendancePercentage || 0} />
                          </td>
                          <td className="px-4 py-3 text-center">{entry.averageParticipationScore?.toFixed(1) || '0.0'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              entry.status === 'good' ? 'bg-green-500/20 text-green-300' :
                              entry.status === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {entry.status || 'unknown'}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-center font-medium ${riskColor}`}>
                            {riskLevel}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {entry.lastUpdated ? new Date(entry.lastUpdated).toLocaleDateString() : 'Never'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
