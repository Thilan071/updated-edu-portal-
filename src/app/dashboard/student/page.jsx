'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  Target, 
  Award, 
  Clock, 
  CheckCircle,
  AlertCircle,
  BarChart3,
  GraduationCap,
  FileText
} from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function StudentDash() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAccountStatus, setShowAccountStatus] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (!session?.user) {
      router.push('/'); // Redirect to home if not authenticated
      return;
    }
    
    if (session.user.role !== 'student') {
      router.push('/'); // Redirect to home if not student
      return;
    }
    
    // Fetch dashboard data when session is ready
    fetchDashboardData();
  }, [session, status, router]);

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = async () => {
    if (!session?.user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch student enrollments
      const enrollmentsResponse = await apiClient.studentAPI.getEnrollments();
      const enrollments = enrollmentsResponse.enrollments || [];
      
      // Fetch student progress/grades
      let grades = [];
      try {
        const gradesResponse = await apiClient.progressAPI.getStudentProgress(session.user.id);
        grades = gradesResponse.progress || [];
        
        // Filter grades to only include those with actual marks
        grades = grades.filter(g => g.marks !== undefined && g.marks !== null && g.marks > 0);
      } catch (gradesError) {
        console.log('Grades not available yet:', gradesError);
      }
      
      // Calculate stats from actual data
      const totalModules = enrollments.reduce((acc, enrollment) => {
        return acc + (enrollment.modules?.length || 0);
      }, 0);
      const enrolledPrograms = enrollments.length;
      const completedAssessments = grades.filter(g => g.status === 'completed').length;
      const averageGrade = grades.length > 0 
        ? Math.round(grades.reduce((sum, g) => sum + (g.marks || g.score || 0), 0) / grades.length)
        : 0;
      
      const processedData = {
        statsCards: [
          {
            title: "Enrolled Programs",
            value: enrolledPrograms.toString(),
            icon: <GraduationCap className="w-6 h-6" />,
            color: "from-blue-500 to-cyan-500",
            textColor: "text-blue-100"
          },
          {
            title: "Total Modules",
            value: totalModules.toString(),
            icon: <BookOpen className="w-6 h-6" />,
            color: "from-indigo-500 to-purple-500",
            textColor: "text-indigo-100"
          },
          {
            title: "Completed Assessments",
            value: completedAssessments.toString(),
            icon: <CheckCircle className="w-6 h-6" />,
            color: "from-green-500 to-emerald-500",
            textColor: "text-green-100"
          },
          {
            title: "Average GPA",
            value: `${averageGrade}%`,
            icon: <TrendingUp className="w-6 h-6" />,
            color: "from-purple-500 to-pink-500",
            textColor: "text-purple-100"
          }
        ],
        recentActivities: [
          { title: "Dashboard loaded successfully", time: "Just now", type: "success" }
        ],
        enrollments: enrollments
      };
      
      setDashboardData(processedData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      // Minimal fallback data
      const fallbackData = {
        statsCards: [
          {
            title: "Enrolled Programs",
            value: "0",
            icon: <GraduationCap className="w-6 h-6" />,
            color: "from-blue-500 to-cyan-500",
            textColor: "text-blue-100"
          },
          {
            title: "Total Modules",
            value: "0",
            icon: <BookOpen className="w-6 h-6" />,
            color: "from-indigo-500 to-purple-500",
            textColor: "text-indigo-100"
          },
          {
            title: "Completed Assessments",
            value: "0",
            icon: <CheckCircle className="w-6 h-6" />,
            color: "from-green-500 to-emerald-500",
            textColor: "text-green-100"
          },
          {
            title: "Average GPA",
            value: "0%",
            icon: <TrendingUp className="w-6 h-6" />,
            color: "from-purple-500 to-pink-500",
            textColor: "text-purple-100"
          },
          {
            title: "Study Streak",
            value: "0 days",
            icon: <Target className="w-6 h-6" />,
            color: "from-orange-500 to-red-500",
            textColor: "text-orange-100"
          }
        ],
        recentActivities: [],
        enrollments: []
      };
      setDashboardData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while session is loading or redirecting
  if (status === 'loading' || !session?.user || session.user.role !== 'student') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching dashboard data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">Error: {error}</div>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Use data from API or fallback to default structure
  const statsCards = dashboardData?.statsCards || [
    {
      title: "Enrolled Modules",
      value: "6",
      icon: <BookOpen className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      textColor: "text-blue-100"
    },
    {
      title: "Completed Assessments",
      value: "12",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      textColor: "text-green-100"
    },
    {
      title: "Average GPA",
      value: "85%",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      textColor: "text-purple-100"
    },
    {
      title: "Study Streak",
      value: "7 days",
      icon: <Target className="w-6 h-6" />,
      color: "from-orange-500 to-red-500",
      textColor: "text-orange-100"
    }
  ];

  const recentActivities = dashboardData?.recentActivities || [
    { title: "Completed OOP Assignment", time: "2 hours ago", type: "success" },
    { title: "Database Quiz Due Tomorrow", time: "1 day", type: "warning" },
    { title: "New Module: Web Development", time: "3 days ago", type: "info" },
    { title: "Achieved 90% in Math Test", time: "1 week ago", type: "success" }
  ];

  const enrollments = dashboardData?.enrollments || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 bg-white/5">
            {(session.user.profileImage || session.user.photoUrl) ? (
              <img 
                src={session.user.profileImage || session.user.photoUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log('Profile image failed to load:', session.user.profileImage || session.user.photoUrl);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                onLoad={() => console.log('Profile image loaded successfully:', session.user.profileImage || session.user.photoUrl)}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center ${(session.user.profileImage || session.user.photoUrl) ? 'hidden' : 'flex'}`}>
              <User size={32} className="text-white/40" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 header-font">
              {getTimeBasedGreeting()}, {session.user.name || 'Student'}!
            </h1>
            <p className="text-white/80 text-lg">
              Ready to continue your learning journey?
            </p>
          </div>
        </div>
      </motion.div>

      {/* Status Card */}
      {showAccountStatus && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`p-6 rounded-2xl glass-effect border border-white/20 ${
            session.user.status === 'approved' 
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' 
              : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-green-500/30">
                <CheckCircle className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Account Status: <span className="capitalize text-green-300 font-bold">
                    Approved ✓
                  </span>
                </h3>
                {session.user.studentId && (
                  <p className="text-white/80">Student ID: <span className="font-mono font-bold">{session.user.studentId}</span></p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowAccountStatus(false)}
                className="text-white/60 hover:text-white transition-colors p-1"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-white/5">
                {(session.user.profileImage || session.user.photoUrl) ? (
                  <img 
                    src={session.user.profileImage || session.user.photoUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Status card profile image failed to load:', session.user.profileImage || session.user.photoUrl);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    onLoad={() => console.log('Status card profile image loaded successfully:', session.user.profileImage || session.user.photoUrl)}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${(session.user.profileImage || session.user.photoUrl) ? 'hidden' : 'flex'}`}>
                  <User className="w-12 h-12 text-white/60 p-2" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.title}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl glass-effect border border-white/20 p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-10`}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                  <div className={card.textColor}>
                    {card.icon}
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{card.value}</h3>
              <p className="text-white/70 text-sm">{card.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enrolled Programs Section */}
      {enrollments && Array.isArray(enrollments) && enrollments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-effect rounded-2xl border border-white/20 p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-blue-400" />
            Your Enrolled Programs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((program, index) => (
              <motion.div
                key={program.id || index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-lg mb-1 line-clamp-2">
                      {program.title || program.name || 'Untitled Program'}
                    </h4>
                    <p className="text-white/60 text-sm mb-2">
                      {program.description || 'No description available'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {program.modules?.length || 0}
                      </div>
                      <div className="text-white/60 text-xs">
                        Modules
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {program.modules?.filter(m => m.completion?.percentage >= 100).length || 0}
                      </div>
                      <div className="text-white/60 text-xs">
                        Completed
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-white/80 mb-1">
                      Progress
                    </div>
                    <div className="w-20 bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${program.modules?.length > 0 
                            ? Math.round((program.modules.filter(m => m.completion?.percentage >= 100).length / program.modules.length) * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {program.modules?.length > 0 
                        ? Math.round((program.modules.filter(m => m.completion?.percentage >= 100).length / program.modules.length) * 100)
                        : 0}%
                    </div>
                  </div>
                </div>
                
                {program.level && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                      {program.level}
                    </span>
                    {program.duration && (
                      <span className="inline-block ml-2 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                        {program.duration}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-effect rounded-2xl border border-white/20 p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={activity.id || index} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-400' :
                    activity.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.title}</p>
                    <p className="text-white/60 text-xs">{activity.description || activity.time}</p>
                    {activity.score && (
                      <p className="text-green-400 text-xs font-semibold">Score: {activity.score}%</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60">No recent activities</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-effect rounded-2xl border border-white/20 p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-purple-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "View Modules", href: "/dashboard/student/modules", icon: <BookOpen className="w-4 h-4" />, color: "from-blue-500 to-cyan-500" },
              { label: "Check Grades", href: "/dashboard/student/grades", icon: <Award className="w-4 h-4" />, color: "from-green-500 to-emerald-500" },
              { label: "Assessments", href: "/dashboard/student/assessments", icon: <CheckCircle className="w-4 h-4" />, color: "from-purple-500 to-pink-500" },
              { label: "Project Assignments", href: "/dashboard/student/project-assignments", icon: <FileText className="w-4 h-4" />, color: "from-indigo-500 to-purple-500" },
              { label: "Study Planner", href: "/dashboard/student/planner", icon: <Calendar className="w-4 h-4" />, color: "from-orange-500 to-red-500" },
              { label: "Health Monitor", href: "/dashboard/student/health", icon: <TrendingUp className="w-4 h-4" />, color: "from-pink-500 to-rose-500" }
            ].map((action, index) => (
              <a
                key={action.label}
                href={action.href}
                className={`p-4 rounded-xl bg-gradient-to-br ${action.color} bg-opacity-20 border border-white/20 hover:scale-105 transition-all duration-300 text-center group`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="text-white text-sm font-medium">{action.label}</span>
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Motivational Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-center p-6 glass-effect rounded-2xl border border-white/20"
      >
        <blockquote className="text-white/90 text-lg italic mb-2">
          "The beautiful thing about learning is that no one can take it away from you."
        </blockquote>
        <cite className="text-white/60 text-sm">— B.B. King</cite>
        {error && (
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">⚠️ Some data may not be current due to connection issues</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
