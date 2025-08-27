'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bar, Line } from 'react-chartjs-2';
import { BarChart2, Repeat2, TrendingUp, ChevronDown, RefreshCw } from 'lucide-react';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import apiClient from '@/lib/apiClient';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);



export default function StudentProgress() {
  const { data: session } = useSession();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentProgress, setStudentProgress] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user) {
      fetchInitialData();
    }
  }, [session]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentProgress(selectedStudent.id);
    }
  }, [selectedStudent]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all students (for educators to select from)
      const studentsResponse = await apiClient.studentAPI.getAll();
      const studentsData = studentsResponse.data || [];
      
      // Fetch educator's modules
      const modulesResponse = await apiClient.educatorAPI.getModules();
      const modulesData = modulesResponse.data || [];

      setStudents(studentsData);
      setModules(modulesData);
      
      // Auto-select first student if available
      if (studentsData.length > 0) {
        setSelectedStudent(studentsData[0]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load students and modules');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProgress = async (studentId) => {
    try {
      setProgressLoading(true);
      
      // Fetch student progress across all modules
      const progressResponse = await apiClient.progressAPI.getStudentProgress(studentId);
      const progressData = progressResponse.progress || [];
      
      setStudentProgress(progressData);
    } catch (error) {
      console.error('Error fetching student progress:', error);
      setError('Failed to load student progress');
    } finally {
      setProgressLoading(false);
    }
  };

  // Generate chart data from student progress
  const generateChartData = () => {
    if (!studentProgress || studentProgress.length === 0) {
      return {
        marksChart: {
          labels: [],
          datasets: [{
            label: 'Marks',
            data: [],
            backgroundColor: '#60a5fa',
            borderRadius: 5,
          }],
        },
        participationChart: {
          labels: [],
          datasets: [{
            label: 'Participation Logs',
            data: [],
            borderColor: '#4ade80',
            backgroundColor: 'rgba(74, 222, 128, 0.2)',
            fill: true,
            tension: 0.4,
          }],
        },
        moduleRepeats: []
      };
    }

    // Group progress by module
    const moduleProgress = {};
    studentProgress.forEach(progress => {
      const moduleId = progress.moduleId;
      if (!moduleProgress[moduleId]) {
        moduleProgress[moduleId] = {
          scores: [],
          attempts: 0,
          moduleName: progress.moduleName || `Module ${moduleId.substring(0, 6)}`
        };
      }
      moduleProgress[moduleId].scores.push(progress.score);
      moduleProgress[moduleId].attempts++;
    });

    // Calculate average scores per module
    const moduleLabels = [];
    const moduleScores = [];
    const repeatedModules = [];

    Object.entries(moduleProgress).forEach(([moduleId, data]) => {
      const avgScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      moduleLabels.push(data.moduleName);
      moduleScores.push(Math.round(avgScore));
      
      if (data.attempts > 1) {
        repeatedModules.push({
          module: data.moduleName,
          attempts: data.attempts,
          lastScore: Math.max(...data.scores),
          nextDate: '2025-09-15' // This would come from actual repeat scheduling
        });
      }
    });

    // Generate participation data (simplified - would come from actual participation tracking)
    const participationLabels = moduleLabels;
    const participationScores = moduleLabels.map(() => Math.floor(Math.random() * 8) + 7);

    return {
      marksChart: {
        labels: moduleLabels,
        datasets: [{
          label: 'Average Marks',
          data: moduleScores,
          backgroundColor: '#60a5fa',
          borderRadius: 5,
        }],
      },
      participationChart: {
        labels: participationLabels,
        datasets: [{
          label: 'Participation Logs',
          data: participationScores,
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74, 222, 128, 0.2)',
          fill: true,
          tension: 0.4,
        }],
      },
      moduleRepeats: repeatedModules
    };
  };

  const { marksChart, participationChart, moduleRepeats } = generateChartData();



  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#d1d5db', // Light gray for legend text
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.8)', // Dark background for tooltips
        titleColor: '#f9fafb',
        bodyColor: '#e5e7eb',
      },
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af' }, // Light gray ticks
        grid: { color: 'rgba(255, 255, 255, 0.05)' }, // Subtle grid lines
      },
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
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
          transition: all 0.3s ease-in-out;
        }
      `}</style>
      <div className="main-font text-white">
        <header
          className={`mb-6 ${isMounted ? 'animated-entry' : 'opacity-0'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <h1 className="text-4xl font-bold header-font flex items-center">
            <BarChart2 className="w-10 h-10 mr-3 text-blue-400" />
            Student Progress
          </h1>
          <p className="text-lg text-gray-300">Visualize student performance and participation.</p>
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              {error}
              <button 
                onClick={fetchInitialData}
                className="ml-4 px-3 py-1 bg-red-500/30 hover:bg-red-500/50 rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Retry
              </button>
            </div>
          )}
        </header>

        <div
          className={`glass-effect-dark rounded-2xl p-6 mb-6 ${isMounted ? 'animated-entry' : 'opacity-0'}`}
          style={{ animationDelay: '0.2s' }}
        >
          <h2 className="text-xl font-semibold mb-4 header-font">Select Student</h2>
          <div className="relative">
            {loading ? (
              <div className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                Loading students...
              </div>
            ) : (
              <select
                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  const student = students.find(s => s.id === e.target.value);
                  setSelectedStudent(student);
                }}
              >
                <option value="">Choose a student...</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.email})
                  </option>
                ))}
              </select>
            )}
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>

        {selectedStudent && (
          <>
            {progressLoading && (
              <div className="glass-effect-dark rounded-2xl p-6 mb-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                <p className="text-gray-300">Loading student progress...</p>
              </div>
            )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`h-[400px] glass-effect-dark rounded-2xl p-6 flex flex-col justify-between
              ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
            style={{ animationDelay: '0.3s' }}
          >
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-blue-400" />
              Module-wise Marks
            </h3>
            <div className="flex-grow">
              <Bar data={marksChart} options={chartOptions} />
            </div>
          </div>

          <div
            className={`h-[400px] glass-effect-dark rounded-2xl p-6 flex flex-col justify-between
              ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
            style={{ animationDelay: '0.4s' }}
          >
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
              <BarChart2 className="w-6 h-6 mr-2 text-green-400" />
              Participation Logs
            </h3>
            <div className="flex-grow">
              <Line data={participationChart} options={chartOptions} />
            </div>
          </div>
        </div>

        <div
          className={`mt-6 glass-effect-dark rounded-2xl p-6
            ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
          style={{ animationDelay: '0.5s' }}
        >
          <h3 className="text-xl font-semibold mb-2 text-white flex items-center">
            <Repeat2 className="w-6 h-6 mr-2 text-yellow-400" />
            Module Repeats
          </h3>
          {moduleRepeats.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              {moduleRepeats.map((repeat, index) => (
                <li key={index}>
                  <span className="font-medium text-yellow-300">{repeat.module}</span> - Attempts: {repeat.attempts}, Last Score: {repeat.lastScore}%, Next Date: {repeat.nextDate}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-300">No repeats found for this student.</p>
          )}
        </div>
          </>
        )}
      </div>
    </>
  );
}
