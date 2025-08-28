"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import apiClient from '@/lib/apiClient';

export default function MyGrades() {
  const { data: session } = useSession();
  const [grades, setGrades] = useState([]);
  const [modules, setModules] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user?.uid && session?.user?.role === 'student') {
      fetchAllData();
    }
  }, [session]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [enrollmentsData, modulesData, progressData, submissionsData, assignmentsData] = await Promise.all([
        apiClient.studentAPI.getEnrollments(),
        apiClient.moduleAPI.getAll(),
        apiClient.progressAPI.getStudentProgress(session.user.uid),
        apiClient.submissionsAPI.getAll({ studentId: session.user.uid }),
        apiClient.studentAPI.getActiveAssignments()
      ]);
      
      setEnrollments(enrollmentsData.enrollments || []);
      setModules(modulesData.modules || []);
      
      // Process student progress data
      const progressByModule = {};
      if (progressData.progress) {
        progressData.progress.forEach(progress => {
          if (!progressByModule[progress.moduleId]) {
            progressByModule[progress.moduleId] = [];
          }
          progressByModule[progress.moduleId].push(progress);
        });
      }
      setModuleProgress(progressByModule);
      
      // Process assignments
      const allAssignments = assignmentsData.assignments || [];
      const submissions = submissionsData.submissions || [];
      
      // Create a set of submitted assignment IDs for quick lookup
      const submittedAssignmentIds = new Set(
        submissions.map(sub => `${sub.moduleId}-${sub.assignmentId}`)
      );
      
      // Separate active and completed assignments
      const active = [];
      const completed = [];
      
      allAssignments.forEach(assignment => {
        const assignmentKey = `${assignment.moduleId}-${assignment.id}`;
        if (submittedAssignmentIds.has(assignmentKey)) {
          // Find the submission for this assignment
          const submission = submissions.find(sub => 
            sub.moduleId === assignment.moduleId && sub.assignmentId === assignment.id
          );
          completed.push({ ...assignment, submission });
        } else {
          active.push(assignment);
        }
      });
      
      setActiveAssignments(active);
      setCompletedAssignments(completed);
      
      // Process and calculate grades
      calculateGrades(enrollmentsData.enrollments || [], modulesData.modules || [], progressByModule, completed);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrades = (enrollmentsList, modulesList, progressByModule, completedAssignmentsList) => {
    const moduleGrades = {};
    const moduleMap = {};
    
    // Create a map of module details
    modulesList.forEach(module => {
      moduleMap[module.id] = module;
    });
    
    // Add module details from enrollments
    enrollmentsList.forEach(enrollment => {
      if (enrollment.modules) {
        enrollment.modules.forEach(module => {
          moduleMap[module.id] = {
            ...module,
            courseTitle: enrollment.title || enrollment.name,
            courseId: enrollment.id
          };
        });
      }
    });
    
    // Process module progress (traditional assessments and educator-set grades)
    Object.keys(progressByModule).forEach(moduleId => {
      const progressList = progressByModule[moduleId];
      
      // Find the highest grade from module marks or educator assessments
      let highestGrade = 0;
      let gradeSource = null;
      let gradingInfo = null;
      
      progressList.forEach(progress => {
        if (progress.marks !== undefined && progress.marks !== null && progress.marks > highestGrade) {
          highestGrade = progress.marks;
          gradeSource = 'module_mark';
          gradingInfo = {
            gradedAt: progress.gradedAt || progress.updatedAt,
            gradedBy: progress.graderName || 'Educator',
            status: progress.status
          };
        } else if (progress.score !== undefined && progress.score > highestGrade) {
          highestGrade = progress.score;
          gradeSource = 'assessment';
          gradingInfo = {
            gradedAt: progress.gradedAt || progress.updatedAt,
            gradedBy: progress.graderName || 'Educator',
            assessmentType: progress.assessmentType
          };
        }
      });
      
      if (highestGrade > 0) {
        moduleGrades[moduleId] = {
          grade: highestGrade,
          source: gradeSource,
          ...gradingInfo
        };
      }
    });
    
    // Process completed assignments
    completedAssignmentsList.forEach(assignment => {
      const moduleId = assignment.moduleId;
      const submission = assignment.submission;
      
      if (submission?.finalGrade !== undefined || submission?.aiGrade !== undefined) {
        const grade = submission.finalGrade || submission.aiGrade;
        
        // Only use assignment grade if there's no module mark or if assignment grade is higher
        if (!moduleGrades[moduleId] || 
            (moduleGrades[moduleId].source !== 'module_mark' && grade > moduleGrades[moduleId].grade)) {
          moduleGrades[moduleId] = {
            grade: grade,
            source: 'assignment',
            assignmentTitle: assignment.title,
            submittedAt: submission.submittedAt,
            gradedBy: submission.gradedBy || (submission.aiGrade ? 'AI Assistant' : 'Educator'),
            isAIGraded: !!submission.aiGrade && !submission.finalGrade,
            educatorFeedback: submission.educatorFeedback,
            aiOverallFeedback: submission.aiOverallFeedback
          };
        }
      }
    });
    
    // Transform to final grades array
    const transformedGrades = Object.keys(moduleGrades).map(moduleId => {
      const gradeData = moduleGrades[moduleId];
      const moduleInfo = moduleMap[moduleId] || {};
      
      return {
        moduleId,
        moduleName: moduleInfo.title || moduleInfo.name || 'Unknown Module',
        moduleDescription: moduleInfo.description,
        courseTitle: moduleInfo.courseTitle,
        courseId: moduleInfo.courseId,
        grade: gradeData.grade,
        source: gradeData.source,
        assignmentTitle: gradeData.assignmentTitle,
        submittedAt: gradeData.submittedAt,
        gradedAt: gradeData.gradedAt,
        gradedBy: gradeData.gradedBy,
        educatorFeedback: gradeData.educatorFeedback,
        aiOverallFeedback: gradeData.aiOverallFeedback,
        isAIGraded: gradeData.isAIGraded,
        assessmentType: gradeData.assessmentType,
        status: gradeData.status
      };
    });
    
    setGrades(transformedGrades);
  };

  const getStatus = (grade) => {
    if (grade >= 80) return { label: "Excellent", color: "bg-emerald-500", textColor: "text-emerald-600" };
    if (grade >= 70) return { label: "Good", color: "bg-blue-500", textColor: "text-blue-600" };
    if (grade >= 50) return { label: "Pass", color: "bg-green-500", textColor: "text-green-600" };
    if (grade >= 40) return { label: "At Risk", color: "bg-amber-400", textColor: "text-amber-600" };
    return { label: "Fail", color: "bg-red-500", textColor: "text-red-600" };
  };

  // Calculate comprehensive statistics
  const calculateStatistics = () => {
    // Get all enrolled modules
    const allEnrolledModules = [];
    enrollments.forEach(enrollment => {
      if (enrollment.modules) {
        enrollment.modules.forEach(module => {
          allEnrolledModules.push({
            ...module,
            courseTitle: enrollment.title || enrollment.name
          });
        });
      }
    });
    
    // Calculate totals
    const totalEnrolledModules = allEnrolledModules.length;
    const modulesWithGrades = grades.length;
    const passedModules = grades.filter(g => g.grade >= 50).length;
    const failedModules = grades.filter(g => g.grade < 50).length;
    const pendingModules = totalEnrolledModules - modulesWithGrades;
    
    // Calculate GPA (4.0 scale)
    let currentGPA = 0;
    let cumulativeGPA = 0;
    
    if (modulesWithGrades > 0) {
      // Current GPA - based on completed modules only
      const totalGradePoints = grades.reduce((sum, g) => {
        // Convert percentage to 4.0 scale
        let gradePoint = 0;
        if (g.grade >= 80) gradePoint = 4.0;
        else if (g.grade >= 70) gradePoint = 3.0;
        else if (g.grade >= 60) gradePoint = 2.0;
        else if (g.grade >= 50) gradePoint = 1.0;
        else gradePoint = 0.0;
        return sum + gradePoint;
      }, 0);
      
      currentGPA = (totalGradePoints / modulesWithGrades);
      
      // Cumulative GPA - includes all enrolled modules (pending modules count as 0)
      cumulativeGPA = totalEnrolledModules > 0 ? (totalGradePoints / totalEnrolledModules) : 0;
    }
    
    // Calculate average percentage
    const averagePercentage = modulesWithGrades > 0 
      ? Math.round(grades.reduce((sum, g) => sum + g.grade, 0) / modulesWithGrades)
      : 0;
    
    return {
      totalEnrolledModules,
      modulesWithGrades,
      passedModules,
      failedModules,
      pendingModules,
      currentGPA: currentGPA.toFixed(2),
      cumulativeGPA: cumulativeGPA.toFixed(2),
      averagePercentage,
      completionRate: totalEnrolledModules > 0 ? Math.round((modulesWithGrades / totalEnrolledModules) * 100) : 0
    };
  };
  
  const stats = calculateStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 text-lg">Loading grades...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Error: {error}</div>
          <button 
            onClick={fetchGrades}
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
        /* Importing new fonts */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;500;600&display=swap');

        /* Animation for individual grade cards */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .grade-card-animated {
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

        /* Progress bar fill animation for grades */
        @keyframes gradeProgressBarFill {
            from { width: 0%; }
            to { width: var(--grade-width, 0%); } /* Use CSS variable for target width */
        }
        .grade-progress-bar-animated {
            animation: gradeProgressBarFill 1.5s ease-out forwards;
        }

      `}</style>
      <div className="main-font"> {/* Apply the main font */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4 header-font animated-entry"> {/* Changed heading color */}
          My Grades
        </h1>
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div> {/* Changed divider color */}

        {/* Enhanced Summary Section with GPA and Module Statistics */}
        <div className={`glass-effect p-6 rounded-xl shadow-lg mb-8
            transform ${isMounted ? 'grade-card-animated' : 'opacity-0 scale-95'}`}
            style={{ animationDelay: '0.1s' }}>
          
          {/* GPA Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 header-font">Academic Performance Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Current GPA</p>
                <p className="text-3xl font-extrabold text-blue-700 header-font mt-1">{stats.currentGPA}</p>
                <p className="text-xs text-blue-500 mt-1">Based on {stats.modulesWithGrades} completed modules</p>
              </div>
              
              <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">Cumulative GPA</p>
                <p className="text-3xl font-extrabold text-purple-700 header-font mt-1">{stats.cumulativeGPA}</p>
                <p className="text-xs text-purple-500 mt-1">Based on {stats.totalEnrolledModules} enrolled modules</p>
              </div>
              
              <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Average Grade</p>
                <p className="text-3xl font-extrabold text-green-700 header-font mt-1">{stats.averagePercentage}%</p>
                <p className="text-xs text-green-500 mt-1">Overall performance</p>
              </div>
              
              <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium">Completion Rate</p>
                <p className="text-3xl font-extrabold text-orange-700 header-font mt-1">{stats.completionRate}%</p>
                <p className="text-xs text-orange-500 mt-1">Modules completed</p>
              </div>
            </div>
          </div>
          
          {/* Module Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium">Total Enrolled</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalEnrolledModules}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.modulesWithGrades}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium">Passed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.passedModules}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium">Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.failedModules}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingModules}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">{stats.completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Enhanced Grade Cards */}
        <div className="space-y-6">
          {grades.map((g, idx) => {
            const status = getStatus(g.grade);
            return (
              <div
                key={`${g.moduleId}-${idx}`}
                className={`glass-effect p-6 rounded-xl shadow-lg space-y-4
                  transform hover:scale-[1.01] transition-all duration-300 border-l-4 ${
                    g.grade >= 80 ? 'border-emerald-500' :
                    g.grade >= 70 ? 'border-blue-500' :
                    g.grade >= 50 ? 'border-green-500' :
                    g.grade >= 40 ? 'border-amber-500' : 'border-red-500'
                  }
                  ${isMounted ? 'grade-card-animated' : 'opacity-0 scale-95'}`}
                style={{ animationDelay: `${0.2 + idx * 0.08}s` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">{g.moduleName}</h2>
                        {g.courseTitle && (
                          <p className="text-sm text-blue-600 mt-1">📚 {g.courseTitle}</p>
                        )}
                      </div>
                      
                      {/* Grade Display */}
                      <div className="text-right">
                        <div className="text-4xl font-bold text-gray-800">{g.grade}%</div>
                        <div className={`text-sm font-semibold ${status.textColor} flex items-center gap-1`}>
                          {g.grade >= 80 ? '🏆' : g.grade >= 70 ? '🥉' : g.grade >= 50 ? '✅' : g.grade >= 40 ? '⚠️' : '❌'}
                          {status.label}
                        </div>
                      </div>
                    </div>
                    
                    {g.moduleDescription && (
                      <p className="text-sm text-gray-600 mb-3">{g.moduleDescription}</p>
                    )}
                    
                    {/* Grade Source and Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {g.source === 'module_mark' ? (
                            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                              🎯 Final Module Grade
                            </span>
                          ) : g.source === 'assessment' ? (
                            <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                              📊 Assessment Grade
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              📝 Assignment Grade
                            </span>
                          )}
                          
                          {g.isAIGraded && (
                            <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs rounded-full font-medium">
                              🤖 AI Graded
                            </span>
                          )}
                        </div>
                        
                        {g.assessmentType && (
                          <p className="text-xs text-gray-600">Assessment Type: {g.assessmentType}</p>
                        )}
                        
                        {g.assignmentTitle && (
                          <p className="text-xs text-gray-600">📋 Assignment: {g.assignmentTitle}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-500">
                        {g.gradedBy && (
                          <p>👨‍🏫 Graded by: {g.gradedBy}</p>
                        )}
                        
                        {g.submittedAt && (
                          <p>📤 Submitted: {new Date(g.submittedAt.seconds ? g.submittedAt.seconds * 1000 : g.submittedAt).toLocaleDateString()}</p>
                        )}
                        
                        {g.gradedAt && (
                          <p>✅ Graded: {new Date(g.gradedAt.seconds ? g.gradedAt.seconds * 1000 : g.gradedAt).toLocaleDateString()}</p>
                        )}
                        
                        {g.status && (
                          <p>📊 Status: <span className="capitalize">{g.status}</span></p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full bg-gray-200 h-4 rounded-full overflow-hidden">
                      <div
                        className={`${status.color} h-4 rounded-full grade-progress-bar-animated transition-all duration-1000 relative`}
                        style={{ width: `${Math.min(g.grade, 100)}%`, '--grade-width': `${g.grade}%` }}
                      >
                        <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                        {g.grade}%
                      </div>
                    </div>

                    {/* Feedback Sections */}
                    {g.educatorFeedback && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r mt-4">
                        <div className="flex items-center mb-2">
                          <span className="text-blue-600 mr-2">👨‍🏫</span>
                          <p className="text-sm font-semibold text-blue-800">Educator Feedback</p>
                        </div>
                        <p className="text-sm text-blue-700">{g.educatorFeedback}</p>
                      </div>
                    )}
                    
                    {g.aiOverallFeedback && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400 p-4 rounded-r mt-4">
                        <div className="flex items-center mb-2">
                          <span className="text-purple-600 mr-2">🤖</span>
                          <p className="text-sm font-semibold text-purple-800">AI Analysis & Feedback</p>
                        </div>
                        <p className="text-sm text-purple-700">{g.aiOverallFeedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Enhanced Empty State */}
        {grades.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="glass-effect p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 header-font">No Grades Available Yet</h3>
              
              {stats.totalEnrolledModules > 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-6">
                    You're enrolled in {stats.totalEnrolledModules} module{stats.totalEnrolledModules !== 1 ? 's' : ''} but haven't received any grades yet.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">📝 To get grades, you can:</h4>
                    <ul className="text-left text-blue-700 space-y-2">
                      <li>• Complete and submit assignments for your enrolled modules</li>
                      <li>• Take assessments and exams when they become available</li>
                      <li>• Participate in practical exercises and lab work</li>
                      <li>• Check with your educators for upcoming assessment opportunities</li>
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <button 
                      onClick={() => window.location.href = '/dashboard/student/assignments'}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      📝 View Available Assignments
                    </button>
                    <button 
                      onClick={() => window.location.href = '/dashboard/student/assessments'}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      📊 Check Assessments
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-6">
                    You're not enrolled in any modules yet. Contact your administrator to get enrolled in courses.
                  </p>
                  
                  <button 
                    onClick={() => window.location.href = '/dashboard/student'}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    🏠 Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
