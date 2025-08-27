'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Search, RefreshCw, ChevronDown, BookOpen, GraduationCap } from 'lucide-react';
import apiClient from '@/lib/apiClient';

const STATUS_COLORS = {
  Active: 'bg-green-500/20 text-green-300',
  'At Risk': 'bg-yellow-500/20 text-yellow-300',
  Inactive: 'bg-red-500/20 text-red-300',
};

function StudentCard({ student, isMounted, delay, selectedModule }) {
  const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  const completionRate = student.totalModules > 0 ? Math.round((student.completedModules / student.totalModules) * 100) : 0;
  
  // Determine student status based on completion and progress
  let studentStatus = 'Active';
  if (completionRate < 30) {
    studentStatus = 'At Risk';
  } else if (completionRate >= 70) {
    studentStatus = 'Active';
  }
  
  // Get enrolled courses list
  const enrolledCourses = student.enrolledCourses || [];
  const courseNames = enrolledCourses.map(course => course.title || course.name).join(', ');
  
  // Module-specific progress if a module is selected
  const moduleSpecificProgress = selectedModule ? 
    student.moduleProgress.filter(p => p.moduleId === selectedModule.id) : [];
  
  return (
    <div
      className={`glass-effect-dark rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]
        ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <h3 className="text-2xl font-bold text-white mb-2">{fullName}</h3>
      <p className="text-gray-300 text-sm"><strong className="text-gray-400">ID:</strong> {student.studentId || student.id}</p>
      <p className="text-gray-300 text-sm"><strong className="text-gray-400">Email:</strong> {student.email}</p>
      <p className="text-gray-300 text-sm"><strong className="text-gray-400">Batch:</strong> {student.currentBatchName || 'N/A'}</p>
      <p className="text-gray-300 text-sm"><strong className="text-gray-400">Courses:</strong> {courseNames || 'N/A'}</p>
      
      {selectedModule ? (
        <>
          <p className="text-gray-300 text-sm">
            <strong className="text-gray-400">Module Progress:</strong> {selectedModule.title}
          </p>
          <p className="text-gray-300 text-sm">
            <strong className="text-gray-400">Module Status:</strong> {
              moduleSpecificProgress.length > 0 && moduleSpecificProgress[0].status === 'completed' 
                ? 'Completed' 
                : 'In Progress'
            }
          </p>
        </>
      ) : (
        <p className="text-gray-300 text-sm">
          <strong className="text-gray-400">Overall Progress:</strong> {student.completedModules}/{student.totalModules} modules ({completionRate}%)
        </p>
      )}
      
      {/* Progress bar */}
      <div className="mt-3 mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{selectedModule ? 'Module' : 'Overall'} Completion</span>
          <span>{selectedModule ? (moduleSpecificProgress.length > 0 && moduleSpecificProgress[0].status === 'completed' ? '100%' : '0%') : `${completionRate}%`}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              (selectedModule ? 
                (moduleSpecificProgress.length > 0 && moduleSpecificProgress[0].status === 'completed' ? 100 : 0) : 
                completionRate) >= 70 ? 'bg-green-500' : 
              (selectedModule ? 
                (moduleSpecificProgress.length > 0 && moduleSpecificProgress[0].status === 'completed' ? 100 : 0) : 
                completionRate) >= 30 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ 
              width: `${selectedModule ? 
                (moduleSpecificProgress.length > 0 && moduleSpecificProgress[0].status === 'completed' ? 100 : 0) : 
                completionRate}%` 
            }}
          ></div>
        </div>
      </div>
      
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[studentStatus] || STATUS_COLORS['Active']}`}>
        {studentStatus}
      </span>
    </div>
  );
}

function useStudentFilter(list) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return list.filter((s) => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim();
      const matchesText = [fullName, s.email, s.studentId || s.id, s.currentBatchName].some((v) =>
        String(v).toLowerCase().includes(q)
      );
      
      // Calculate student status based on progress
      const completionRate = s.totalModules > 0 ? Math.round((s.completedModules / s.totalModules) * 100) : 0;
      let studentStatus = 'Active';
      if (completionRate < 30) {
        studentStatus = 'At Risk';
      } else if (completionRate >= 70) {
        studentStatus = 'Active';
      }
      
      const matchesStatus = status === 'All' ? true : studentStatus === status;
      return matchesText && matchesStatus;
    });
  }, [list, query, status]);
  return { filtered, query, setQuery, status, setStatus };
}

export default function StudentsDetails() {
  const { data: session } = useSession();
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const { filtered, query, setQuery, status, setStatus } = useStudentFilter(students);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user?.id) {
      fetchBatchesAndModules();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStudents();
    }
  }, [session, selectedBatch, selectedModule]);

  const fetchBatchesAndModules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session?.user?.id) {
        throw new Error('No educator session found');
      }
      
      const response = await apiClient.educatorAPI.getBatchesAndModules(session.user.id);
      setBatches(response.data || []);
    } catch (error) {
      console.error('Error fetching batches and modules:', error);
      setError('Failed to load batches and modules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session?.user?.id) {
        throw new Error('No educator session found');
      }
      
      const filters = {};
      if (selectedBatch) {
        filters.batchId = selectedBatch.id;
      }
      if (selectedModule) {
        filters.moduleId = selectedModule.id;
      }
      
      const response = await apiClient.educatorAPI.getFilteredStudents(session.user.id, filters);
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchChange = (batch) => {
    setSelectedBatch(batch);
    setSelectedModule(null); // Reset module selection when batch changes
  };

  const handleModuleChange = (module) => {
    setSelectedModule(module);
  };

  const currentModules = selectedBatch ? selectedBatch.modules || [] : [];

  return (
    <>
      <style jsx>{`
        /* Animations consistent with the overall design */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card-animated {
          animation: fadeInSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
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
            <Users className="w-10 h-10 mr-3 text-blue-400" />
            My Students
          </h1>
          <p className="text-lg text-gray-300">Students enrolled in your modules with their progress details.</p>
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              {error}
              <button 
                onClick={fetchStudents}
                className="ml-4 px-3 py-1 bg-red-500/30 hover:bg-red-500/50 rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Retry
              </button>
            </div>
          )}
        </header>

        {/* Batch and Module Selection */}
        <div
          className={`glass-effect-dark rounded-2xl p-6 mb-6
            ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
          style={{ animationDelay: '0.2s' }}
        >
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
            <GraduationCap className="w-6 h-6 mr-2 text-blue-400" />
            Filter by Batch & Module
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Batch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Batch</label>
              <div className="relative">
                <select
                  value={selectedBatch?.id || ''}
                  onChange={(e) => {
                    const batch = batches.find(b => b.id === e.target.value);
                    handleBatchChange(batch);
                  }}
                  className="w-full p-3 pl-4 pr-10 rounded-lg glass-effect-dark border-white/20 text-white cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" className="bg-[#1f2937]">All Batches</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id} className="bg-[#1f2937]">
                      {batch.name} ({batch.currentStudents} students)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Module Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Module
                {selectedBatch && (
                  <span className="text-xs text-gray-400 ml-2">
                    (from {selectedBatch.name})
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  value={selectedModule?.id || ''}
                  onChange={(e) => {
                    const module = currentModules.find(m => m.id === e.target.value);
                    handleModuleChange(module);
                  }}
                  className="w-full p-3 pl-4 pr-10 rounded-lg glass-effect-dark border-white/20 text-white cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                  disabled={!selectedBatch}
                >
                  <option value="" className="bg-[#1f2937]">All Modules</option>
                  {currentModules.map((module) => (
                    <option key={module.id} value={module.id} className="bg-[#1f2937]">
                      {module.title || module.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Selected filters display */}
          {(selectedBatch || selectedModule) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedBatch && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  {selectedBatch.name}
                </span>
              )}
              {selectedModule && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {selectedModule.title || selectedModule.name}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6
            ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
          style={{ animationDelay: '0.3s' }}
        >
          <h2 className="text-xl font-semibold text-white">
            Enrolled Students
            {selectedBatch && (
              <span className="text-sm text-gray-400 ml-2">
                in {selectedBatch.name}
                {selectedModule && ` - ${selectedModule.title || selectedModule.name}`}
              </span>
            )}
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, ID..."
                className="w-full pl-10 pr-4 py-2 text-sm text-white rounded-lg glass-effect-dark border-white/20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 pl-4 pr-10 rounded-lg glass-effect-dark border-white/20 text-white cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="All" className="bg-[#1f2937]">All</option>
                <option value="Active" className="bg-[#1f2937]">Active</option>
                <option value="At Risk" className="bg-[#1f2937]">At Risk</option>
                <option value="Inactive" className="bg-[#1f2937]">Inactive</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-gray-300">Loading students...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((student, idx) => (
              <StudentCard key={student.id} student={student} isMounted={isMounted} delay={0.4 + idx * 0.1} selectedModule={selectedModule} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-sm text-gray-400 p-8 glass-effect-dark rounded-2xl">
                No students found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
