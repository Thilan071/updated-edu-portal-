'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Tally3, RefreshCw, Filter } from 'lucide-react';
import apiClient from '@/lib/apiClient';

// Re-styled badges for the dark theme
function rateBadge(rate) {
  if (rate > 80) return 'bg-green-500/20 text-green-300';
  if (rate >= 50) return 'bg-yellow-500/20 text-yellow-300';
  return 'bg-red-500/20 text-red-300';
}

export default function ParticipationLogs() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [participationData, setParticipationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterModule, setFilterModule] = useState('all');
  const [modules, setModules] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    fetchParticipationData();
    fetchModules();
  }, []);

  const fetchParticipationData = async () => {
    try {
      setLoading(true);
      // For now, we'll use placeholder data since there's no specific participation API endpoint
      // In a real implementation, you would call: await apiClient.participationAPI.getAll();
      const placeholderData = [
        { 
          id: 1,
          studentId: 'S001', 
          studentName: 'Nethmi Perera', 
          module: 'Web Development', 
          moduleId: 'mod1',
          totalSessions: 20, 
          attended: 18, 
          absences: 2, 
          participationRate: 90,
          lastUpdated: '2025-01-13'
        },
        { 
          id: 2,
          studentId: 'S002', 
          studentName: 'Tharindu Silva', 
          module: 'AI Fundamentals', 
          moduleId: 'mod2',
          totalSessions: 15, 
          attended: 10, 
          absences: 5, 
          participationRate: 66.7,
          lastUpdated: '2025-01-12'
        },
        { 
          id: 3,
          studentId: 'S003', 
          studentName: 'Isuri Jayasundara', 
          module: 'Database Systems', 
          moduleId: 'mod3',
          totalSessions: 22, 
          attended: 22, 
          absences: 0, 
          participationRate: 100,
          lastUpdated: '2025-01-11'
        },
        { 
          id: 4,
          studentId: 'S004', 
          studentName: 'Kamal Fernando', 
          module: 'Web Development', 
          moduleId: 'mod1',
          totalSessions: 20, 
          attended: 15, 
          absences: 5, 
          participationRate: 75,
          lastUpdated: '2025-01-10'
        },
        { 
          id: 5,
          studentId: 'S005', 
          studentName: 'Saman Kumara', 
          module: 'AI Fundamentals', 
          moduleId: 'mod2',
          totalSessions: 15, 
          attended: 14, 
          absences: 1, 
          participationRate: 93.3,
          lastUpdated: '2025-01-09'
        },
      ];
      setParticipationData(placeholderData);
    } catch (err) {
      console.error('Error fetching participation data:', err);
      setError('Failed to load participation data');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await apiClient.moduleAPI.getAll();
      setModules(response.modules || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  };

  const filteredData = filterModule === 'all' 
    ? participationData 
    : participationData.filter(entry => entry.moduleId === filterModule);

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
      `}</style>
      <div className="main-font text-white">
        <header
          className={`mb-6 ${isMounted ? 'animated-entry' : 'opacity-0'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold header-font flex items-center">
                <Tally3 className="w-10 h-10 mr-3 text-blue-400" />
                Participation Logs Summary
              </h1>
              <p className="text-lg text-gray-300">Detailed overview of student attendance and engagement.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchParticipationData}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Filter Section */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
            >
              <option value="all">All Modules</option>
              {modules.map(module => (
                <option key={module.id} value={module.id}>{module.title}</option>
              ))}
            </select>
            <span className="text-gray-400 text-sm">
              Showing {filteredData.length} records
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading participation data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchParticipationData}
              className="text-blue-400 hover:text-blue-300"
            >
              Try Again
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No participation data found for the selected filter.</p>
          </div>
        ) : (
          <div
            className={`overflow-x-auto glass-effect-dark rounded-2xl p-6
              ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
            style={{ animationDelay: '0.2s' }}
          >
            <table className="min-w-full text-sm text-left text-gray-200 border-collapse">
              <thead className="bg-white/10 text-white">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Total Sessions</th>
                  <th className="px-4 py-3">Attended</th>
                  <th className="px-4 py-3">Absences</th>
                  <th className="px-4 py-3">Participation Rate (%)</th>
                  <th className="px-4 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((entry, idx) => (
                  <tr key={entry.id || idx} className={`border-t border-white/10 ${idx % 2 === 0 ? '' : 'bg-white/5'} transition-colors hover:bg-white/10`}>
                    <td className="px-4 py-3 font-medium">{entry.studentId}</td>
                    <td className="px-4 py-3">{entry.studentName}</td>
                    <td className="px-4 py-3">{entry.module}</td>
                    <td className="px-4 py-3">{entry.totalSessions}</td>
                    <td className="px-4 py-3 text-green-300">{entry.attended}</td>
                    <td className="px-4 py-3 text-red-300">{entry.absences}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-3 py-1 rounded-full font-medium text-xs ${rateBadge(entry.participationRate)}`}>
                        {Number(entry.participationRate).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{entry.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
