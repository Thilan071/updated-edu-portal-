'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import apiClient from '@/lib/apiClient';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// A simple icon component for better reusability and consistency
const NavIcon = ({ children }) => (
  <span className="inline-flex items-center justify-center w-6 h-6 mr-3">
    {children}
  </span>
);

export default function EducatorDashboard() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    activeModules: 0,
    pendingAssessments: 0,
    notificationsSent: 0,
    modulePerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user) {
      console.log('Session user data:', session.user);
      fetchDashboardData();
    } else {
      console.log('No session or user data available:', session);
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error('User session not available');
      }

      console.log('Fetching dashboard data for user:', session.user.id);

      // Fetch educator's modules
      console.log('Fetching modules...');
      const modulesResponse = await apiClient.educatorAPI.getModules(session.user.id);
      console.log('Modules response:', modulesResponse);
      const modules = modulesResponse.modules || [];

      // Fetch students enrolled in educator's modules
      console.log('Fetching students...');
      const studentsResponse = await apiClient.educatorAPI.getStudents(session.user.id);
      console.log('Students response:', studentsResponse);
      const students = studentsResponse.students || [];

      // Fetch assessments assigned by this educator
      console.log('Fetching assessments...');
      const assessmentsResponse = await apiClient.educatorAPI.getAssessments(session.user.id);
      console.log('Assessments response:', assessmentsResponse);
      const assessments = assessmentsResponse.assessments || [];

      // Calculate dashboard metrics
      const activeModules = modules.filter(m => m.isActive !== false).length;
      const totalStudents = students.length;
      const pendingAssessments = assessments.reduce((acc, assessment) => {
        return acc + (assessment.stats?.pendingSubmissions || 0);
      }, 0);

      // Create performance data for chart based on actual student progress
      const modulePerformance = modules.slice(0, 4).map(module => {
        const moduleStudents = students.filter(student => 
          student.moduleProgress.some(progress => progress.moduleId === module.id)
        );
        const completedCount = moduleStudents.filter(student => 
          student.moduleProgress.some(progress => 
            progress.moduleId === module.id && progress.status === 'completed'
          )
        ).length;
        const atRiskCount = moduleStudents.filter(student => 
          student.moduleProgress.some(progress => 
            progress.moduleId === module.id && (progress.marks || 0) < 50
          )
        ).length;
        
        return {
          code: module.code || 'MOD',
          title: module.title || module.name || 'Module',
          atRisk: atRiskCount,
          topPerformers: completedCount
        };
      });

      console.log('Dashboard data calculated:', {
        totalStudents,
        activeModules,
        pendingAssessments,
        modulePerformance
      });

      setDashboardData({
        totalStudents,
        activeModules,
        pendingAssessments,
        notificationsSent: assessments.length, // Number of assessments created
        modulePerformance,
        modules,
        students,
        assessments
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: 'Students Enrolled', value: loading ? '...' : dashboardData.totalStudents, icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ) },
    { label: 'Modules Teaching', value: loading ? '...' : dashboardData.activeModules, icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ) },
    { label: 'Pending Submissions', value: loading ? '...' : dashboardData.pendingAssessments, icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit-3">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ) },
    { label: 'Assessments Created', value: loading ? '...' : dashboardData.notificationsSent, icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-check">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>
      </svg>
    ) },
  ];

  const chartData = {
    labels: dashboardData.modulePerformance.map(m => m.title),
    datasets: [
      { 
        label: 'Students At Risk', 
        data: dashboardData.modulePerformance.map(m => m.atRisk), 
        backgroundColor: 'rgba(255, 59, 48, 0.8)', 
        borderColor: '#FF3B30', 
        borderWidth: 2,
        borderRadius: 4,
      },
      { 
        label: 'Top Performers', 
        data: dashboardData.modulePerformance.map(m => m.topPerformers), 
        backgroundColor: 'rgba(52, 199, 80, 0.8)', 
        borderColor: '#34C759', 
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e2e8f0', // Light gray for legend text
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        bodyColor: '#e2e8f0',
        titleColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          title: function(tooltipItems) {
            const dataIndex = tooltipItems[0].dataIndex;
            const moduleData = dashboardData.modulePerformance[dataIndex];
            return moduleData.title;
          },
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} students`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        ticks: {
          color: '#e2e8f0', // Light gray for axis labels
          stepSize: 1,
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        ticks: {
          color: '#e2e8f0',
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11,
            weight: 'normal'
          }
        },
      },
    },
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes subtleScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        .card-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        .card-hover:hover {
          animation: subtleScale 0.3s ease-in-out forwards;
        }

        /* Glassmorphism effect consistent with layout.jsx */
        .glass-effect-dark {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
          transition: all 0.3s ease-in-out;
        }

        .glass-effect-dark:hover {
          background-color: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-5px) scale(1.01);
          box-shadow: 0 15px 50px 0 rgba(0, 0, 0, 0.5);
        }
      `}</style>
      
      <div className="space-y-8 text-white main-font">
        <header className={`mb-6 ${isMounted ? 'animated-entry' : 'opacity-0'}`}>
          <h1 className="text-4xl font-bold header-font">Dashboard Overview</h1>
          <p className="text-lg text-gray-300">Quick insights into student performance and activities</p>
          {session?.user && (
            <p className="text-sm text-gray-400 mt-2">
              Logged in as: {session.user.name || session.user.email} (ID: {session.user.id})
            </p>
          )}
          {loading && (
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300">
              Loading dashboard data...
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              {error}
            </div>
          )}
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, index) => (
            <div 
              key={c.label} 
              className={`glass-effect-dark rounded-2xl p-6 transform transition-all duration-300 card-hover
                ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <div className="flex items-center space-x-3 mb-2 text-blue-400">
                {c.icon}
                <p className="text-sm uppercase tracking-wide text-gray-300">{c.label}</p>
              </div>
              <p className="text-3xl font-semibold header-font">{c.value}</p>
            </div>
          ))}
        </section>

        <section 
          className={`glass-effect-dark rounded-2xl p-6 h-[500px] mt-8 transform transition-all duration-300
            ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
          style={{ animationDelay: `${0.2 + cards.length * 0.1}s` }}
        >
          <h2 className="text-2xl font-bold mb-6 header-font">Performance Summary</h2>
          <div className="h-[calc(100%-40px)]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </section>
      </div>
    </>
  );
}