'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Repeat2, RefreshCw, Filter, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function RepeatedModules() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [repeatedModulesData, setRepeatedModulesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterModule, setFilterModule] = useState('all');
  const [modules, setModules] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    fetchRepeatedModulesData();
    fetchModules();
  }, []);

  const fetchRepeatedModulesData = async () => {
    try {
      setLoading(true);
      // For now, we'll use placeholder data since there's no specific repeated modules API endpoint
      // In a real implementation, you would call: await apiClient.repeatedModulesAPI.getAll();
      const placeholderData = [
        { 
          id: 1,
          studentId: 'S001', 
          name: 'John Doe', 
          module: 'Data Structures', 
          moduleId: 'mod1',
          repeatCount: 2, 
          nextRepeatDate: '2025-09-15', 
          commonStart: '2025-09-10', 
          commonEnd: '2025-12-10', 
          participationLogs: 12,
          reason: 'Failed final exam',
          status: 'active'
        },
        { 
          id: 2,
          studentId: 'S002', 
          name: 'Jane Smith', 
          module: 'OOP in Java', 
          moduleId: 'mod2',
          repeatCount: 1, 
          nextRepeatDate: '2025-10-01', 
          commonStart: '2025-09-25', 
          commonEnd: '2025-12-25', 
          participationLogs: 6,
          reason: 'Low attendance',
          status: 'pending'
        },
        { 
          id: 3,
          studentId: 'S003', 
          name: 'Ali Nazeem', 
          module: 'Networking', 
          moduleId: 'mod3',
          repeatCount: 3, 
          nextRepeatDate: '2025-09-18', 
          commonStart: '2025-09-15', 
          commonEnd: '2025-12-15', 
          participationLogs: 8,
          reason: 'Multiple failed attempts',
          status: 'active'
        },
        { 
          id: 4,
          studentId: 'S004', 
          name: 'Sarah Wilson', 
          module: 'Database Systems', 
          moduleId: 'mod4',
          repeatCount: 1, 
          nextRepeatDate: '2025-10-05', 
          commonStart: '2025-10-01', 
          commonEnd: '2025-12-30', 
          participationLogs: 4,
          reason: 'Incomplete coursework',
          status: 'pending'
        },
      ];
      setRepeatedModulesData(placeholderData);
    } catch (err) {
      console.error('Error fetching repeated modules data:', err);
      setError('Failed to load repeated modules data');
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
    ? repeatedModulesData 
    : repeatedModulesData.filter(entry => entry.moduleId === filterModule);

  const getRepeatBadge = (count) => {
    if (count >= 3) return 'bg-red-500/20 text-red-300';
    if (count === 2) return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-blue-500/20 text-blue-300';
  };

  const getStatusBadge = (status) => {
    if (status === 'active') return 'bg-green-500/20 text-green-300';
    if (status === 'pending') return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-gray-500/20 text-gray-300';
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
      `}</style>
      <div className="main-font text-white">
        <header
          className={`mb-6 ${isMounted ? 'animated-entry' : 'opacity-0'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold header-font flex items-center">
                <Repeat2 className="w-10 h-10 mr-3 text-blue-400" />
                Repeated Modules
              </h1>
              <p className="text-lg text-gray-300">Detailed overview of students repeating modules.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchRepeatedModulesData}
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
            {filteredData.length > 0 && (
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle size={16} />
                <span className="text-sm">Students requiring attention</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading repeated modules data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchRepeatedModulesData}
              className="text-blue-400 hover:text-blue-300"
            >
              Try Again
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <Repeat2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No repeated modules found for the selected filter.</p>
            <p className="text-gray-500 text-sm mt-2">This is good news - no students are currently repeating modules!</p>
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
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Repeat Count</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Next Repeat Date</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Participation Logs</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((mod, idx) => (
                  <tr key={mod.id || idx} className={`border-t border-white/10 ${idx % 2 === 0 ? '' : 'bg-white/5'} transition-colors hover:bg-white/10`}>
                    <td className="px-4 py-3 font-medium">{mod.studentId}</td>
                    <td className="px-4 py-3">{mod.name}</td>
                    <td className="px-4 py-3">{mod.module}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full font-medium text-xs ${getRepeatBadge(mod.repeatCount)}`}>
                        {mod.repeatCount}x
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full font-medium text-xs ${getStatusBadge(mod.status)}`}>
                        {mod.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{mod.reason}</td>
                    <td className="px-4 py-3">{mod.nextRepeatDate}</td>
                    <td className="px-4 py-3">{mod.commonStart}</td>
                    <td className="px-4 py-3">{mod.commonEnd}</td>
                    <td className="px-4 py-3 text-center">{mod.participationLogs}</td>
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
