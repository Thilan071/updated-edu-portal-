"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, Clock, CheckCircle, AlertCircle, ChevronDown, Users, Calendar, GraduationCap, RefreshCw } from "lucide-react";

export default function MyModules() {
  const { data: session } = useSession();
  const [modules, setModules] = useState([]);
  const [allModules, setAllModules] = useState([]); // Store all modules
  const [programs, setPrograms] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [isMounted, setIsMounted] = useState(false); // For entry animations
  const [loading, setLoading] = useState(false); // Start with false, only show loading when actually fetching
  const [error, setError] = useState(null);
  const [batchInfo, setBatchInfo] = useState(null); // Store current batch information
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded

  useEffect(() => {
    // Trigger fade-in animation on mount
    setIsMounted(true);
    
    if (session?.user?.role === 'student' && !dataLoaded) {
      // Try to load from session storage first
      const cachedModules = sessionStorage.getItem('student-modules');
      const cachedPrograms = sessionStorage.getItem('student-programs');
      const cachedBatchInfo = sessionStorage.getItem('student-batch-info');
      
      if (cachedModules) {
        const parsedModules = JSON.parse(cachedModules);
        setAllModules(parsedModules);
        setModules(parsedModules);
      }
      
      if (cachedPrograms) {
        setPrograms(JSON.parse(cachedPrograms));
      }
      
      if (cachedBatchInfo) {
        setBatchInfo(JSON.parse(cachedBatchInfo));
      }
      
      // Only fetch if we don't have cached data
      if (!cachedModules) {
        fetchModules();
      }
      if (!cachedPrograms) {
        fetchPrograms();
      }
      if (!cachedBatchInfo) {
        fetchBatchInfo();
      }
      
      setDataLoaded(true);
    }
  }, [session?.user?.role, dataLoaded]); // Remove callback dependencies to avoid initialization issues

  useEffect(() => {
    // Filter modules when semester selection changes
    filterModulesBySemester();
  }, [selectedSemester, allModules]); // Use direct dependencies instead of callback

  const fetchBatchInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.currentBatchDetails) {
          setBatchInfo(userData.currentBatchDetails);
          // Cache in session storage
          sessionStorage.setItem('student-batch-info', JSON.stringify(userData.currentBatchDetails));
        }
      }
    } catch (err) {
      console.error('Error fetching batch info:', err);
    }
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      const response = await fetch('/api/courses', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const courses = data.courses || [];
        setPrograms(courses);
        // Cache in session storage
        sessionStorage.setItem('student-programs', JSON.stringify(courses));
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/enrollments', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      
      const data = await response.json();
      
      // Transform the data to match the expected module structure
      const transformedModules = [];
      
      if (data.enrollments && Array.isArray(data.enrollments)) {
        data.enrollments.forEach(course => {
          if (course.modules && Array.isArray(course.modules)) {
            course.modules.forEach(module => {
              const completion = module.completion || { percentage: 0, status: 'not_started' };
              const progress = module.progress || [];
              
              // Calculate average grade from progress
              const grades = progress.filter(p => p.score !== undefined).map(p => p.score);
              const averageGrade = grades.length > 0 
                ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length)
                : null;
              
              // Determine status based on completion percentage
              let status = 'In Progress';
              if (completion.percentage >= 100) {
                status = 'Completed';
              } else if (completion.percentage === 0) {
                status = 'Not Started';
              }
              
              transformedModules.push({
                id: module.id,
                moduleName: module.title || module.name || 'Untitled Module',
                status: status,
                grade: averageGrade,
                attempts: progress.length,
                dueDate: module.dueDate || null,
                description: module.description || 'No description available',
                courseTitle: course.title || course.name || 'Untitled Course',
                completionPercentage: completion.percentage,
                semester: module.semester || 1, // Add semester info
                programId: course.id
              });
            });
          }
        });
      }
      
      setAllModules(transformedModules);
      setModules(transformedModules); // Initially show all modules
      // Cache in session storage
      sessionStorage.setItem('student-modules', JSON.stringify(transformedModules));
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError(err.message);
      // Fallback to empty array
      setAllModules([]);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterModulesBySemester = useCallback(() => {
    if (selectedSemester === 'all') {
      setModules(allModules);
    } else {
      const semesterNumber = parseInt(selectedSemester);
      const filteredModules = allModules.filter(module => module.semester === semesterNumber);
      setModules(filteredModules);
    }
  }, [selectedSemester, allModules]);

  const availableSemesters = useMemo(() => {
    return [...new Set(allModules.map(module => module.semester))].sort();
  }, [allModules]);

  const handleRefresh = useCallback(async () => {
    // Clear session storage cache
    sessionStorage.removeItem('student-modules');
    sessionStorage.removeItem('student-programs');
    sessionStorage.removeItem('student-batch-info');
    
    // Reset states
    setLoading(true);
    setError(null);
    
    try {
      // Fetch fresh data
      await Promise.all([
        fetchModules(),
        fetchPrograms(),
        fetchBatchInfo()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchModules, fetchPrograms, fetchBatchInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-800 text-lg">Loading modules...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Error: {error}</div>
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

  const getStatusClasses = (status) => {
    switch(status) {
      case "Completed": return "bg-gradient-to-br from-emerald-500 to-green-600 text-white";
      case "Repeating": return "bg-gradient-to-br from-red-500 to-rose-600 text-white";
      case "In Progress": return "bg-gradient-to-br from-amber-400 to-orange-500 text-white";
      case "Not Started": return "bg-gradient-to-br from-gray-400 to-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <>
      <style jsx>{`
        /* Importing new fonts */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;500;600&display=swap');

        /* Animation for individual module cards */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .module-card-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        /* Glass-effect for white background with slight transparency */
        .glass-effect {
          background-color: rgba(255, 255, 255, 0.8); /* Predominantly white, slight transparency */
          backdrop-filter: blur(8px) saturate(180%); /* Reduced blur slightly for white */
          -webkit-backdrop-filter: blur(8px) saturate(180%); /* Safari support */
          border: 1px solid rgba(0, 0, 0, 0.08); /* Subtle border for definition */
          box-shadow: 0 5px 25px 0 rgba(0, 0, 0, 0.15); /* Lighter, but present shadow */
          transition: all 0.3s ease-in-out; /* Smooth transition for glass effect properties */
        }

        /* Hover effect for glass cards */
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

        /* Progress bar fill animation */
        @keyframes progressFill {
          from { width: 0%; }
          to { width: var(--progress-width); }
        }

        /* Shimmer effect for progress bars */
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-shimmer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 2s infinite;
        }

        /* Statistics card hover effect */
        @keyframes cardPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        .stat-card:hover {
          animation: cardPulse 0.6s ease-in-out;
        }

        /* Gradient border effect */
        .border-gradient {
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
          border: 1px solid transparent;
        }
      `}</style>
      <div className="main-font"> {/* Apply the main font */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-gray-800 header-font animated-entry"> {/* Changed heading color */}
           My Modules
          </h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            title="Refresh modules data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div> {/* Changed divider color */}

        {/* Batch Information Card */}
        {batchInfo && (
          <div className="mb-6 glass-effect border border-white/20 rounded-2xl p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Current Batch</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-300" />
                <div>
                  <p className="text-sm text-gray-400">Batch Name</p>
                  <p className="text-white font-medium">{batchInfo.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-green-300" />
                <div>
                  <p className="text-sm text-gray-400">Academic Year</p>
                  <p className="text-white font-medium">{batchInfo.academicYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-purple-300" />
                <div>
                  <p className="text-sm text-gray-400">Instructor</p>
                  <p className="text-white font-medium">{batchInfo.instructor || 'Not assigned'}</p>
                </div>
              </div>
            </div>
            {batchInfo.startDate && batchInfo.endDate && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">
                    {new Date(batchInfo.startDate.seconds * 1000).toLocaleDateString()} - {new Date(batchInfo.endDate.seconds * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Semester Filter Dropdown */}
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="semester-select" className="text-lg font-semibold text-gray-700">
            Filter by Semester:
          </label>
          <div className="relative">
            <select
              id="semester-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              <option value="all">All Semesters</option>
              {availableSemesters.map(semester => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="text-sm text-gray-600">
            Showing {modules.length} of {allModules.length} modules
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Responsive grid */}
          {modules.map((mod, idx) => (
            <div
              key={idx}
              className={`glass-effect rounded-xl shadow-lg p-6 space-y-2
                transform hover:scale-[1.01] transition-all duration-300
                ${isMounted ? 'module-card-animated' : 'opacity-0 scale-95'}`}
              style={{ animationDelay: `${0.2 + idx * 0.07}s` }} // Staggered animation
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-800">{mod.moduleName}</h2>
              <p className="text-sm text-gray-600 mb-3">Course: {mod.courseTitle}</p>
              <p className="text-gray-700">Status: <strong className={`px-2 py-0.5 rounded-full text-sm ${getStatusClasses(mod.status)}`}>{mod.status}</strong></p>
              {mod.completionPercentage > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Progress: {mod.completionPercentage}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${mod.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <p className="text-gray-700">Grade: <strong>{mod.grade !== null ? <span className="font-bold text-blue-700">{mod.grade}%</span> : <span className="text-gray-500">N/A</span>}</strong></p>
              <p className="text-gray-700">Attempts: <strong><span className="font-bold text-blue-700">{mod.attempts}</span></strong></p>
            </div>
          ))}
        </div>

        {/* Final Year Project Prediction Section */}
        <div className="mt-8 glass-effect border border-gradient rounded-2xl p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="w-7 h-7 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800 header-font">
              What Should Be Expected in Your Final Year Project?
            </h2>
          </div>
          
          {/* Overall Progress Calculation */}
          {(() => {
            // Mathematical calculations for progress analysis
            const totalModules = allModules.length;
            const completedModules = allModules.filter(mod => mod.status === 'Completed').length;
            const inProgressModules = allModules.filter(mod => mod.status === 'In Progress').length;
            
            // Calculate overall completion percentage
            const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
            
            // Calculate average grade (only for modules with grades)
            const modulesWithGrades = allModules.filter(mod => mod.grade !== null && mod.grade !== undefined);
            const averageGrade = modulesWithGrades.length > 0 
              ? Math.round(modulesWithGrades.reduce((sum, mod) => sum + mod.grade, 0) / modulesWithGrades.length)
              : 0;
            
            // Calculate total attempts across all modules
            const totalAttempts = allModules.reduce((sum, mod) => sum + (mod.attempts || 0), 0);
            
            // Determine progress color based on performance
            let progressColor = 'from-yellow-400 to-orange-500';
            let readinessLevel = 'Developing';
            
            if (averageGrade >= 80 && overallProgress >= 75) {
              progressColor = 'from-green-400 to-emerald-500';
              readinessLevel = 'Highly Prepared';
            } else if (averageGrade >= 70 && overallProgress >= 60) {
              progressColor = 'from-blue-400 to-cyan-500';
              readinessLevel = 'Well Prepared';
            } else if (averageGrade >= 60 && overallProgress >= 45) {
              progressColor = 'from-purple-400 to-pink-500';
              readinessLevel = 'Moderately Prepared';
            }
            
            return (
              <div className="space-y-4">
                {/* Main Progress Bar */}
                <div className="bg-white/70 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-800">Final Year Project Readiness</h4>
                    <span className="text-sm font-medium text-gray-600">{overallProgress}% Progress</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-6 mb-4 shadow-inner">
                    <div 
                      className={`bg-gradient-to-r ${progressColor} h-6 rounded-full transition-all duration-1000 ease-out relative overflow-hidden progress-shimmer flex items-center justify-center`}
                      style={{ width: `${overallProgress}%` }}
                    >
                      <span className="text-white text-sm font-semibold">{readinessLevel}</span>
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Statistics */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-blue-600 font-semibold text-lg">{totalModules}</div>
                      <div className="text-gray-500">Total Modules</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-semibold text-lg">{completedModules}</div>
                      <div className="text-gray-500">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-600 font-semibold text-lg">{averageGrade}%</div>
                      <div className="text-gray-500">Avg Grade</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-600 font-semibold text-lg">{totalAttempts}</div>
                      <div className="text-gray-500">Total Attempts</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
