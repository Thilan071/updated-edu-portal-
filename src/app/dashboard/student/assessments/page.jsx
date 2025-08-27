"use client";
import { useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';

export default function MyAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [modules, setModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    setIsMounted(true);
    if (session?.user?.uid && status !== 'loading') {
      fetchData();
    }
  }, [session, status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAssessments(),
        fetchModules(),
        fetchStudentProgress(),
        fetchActiveAssignments()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    try {
      const response = await apiClient.assessmentAPI.getAll();
      setAssessments(response.assessments || []);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      throw err;
    }
  };

  const fetchModules = async () => {
    try {
      const response = await apiClient.moduleAPI.getAll();
      setModules(response.modules || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
      throw err;
    }
  };

  const fetchActiveAssignments = async () => {
    try {
      const activeAssignmentsResponse = await apiClient.studentAPI.getActiveAssignments();
      const allAssignments = activeAssignmentsResponse.assignments || [];
      
      // Get student's submissions to filter out completed assignments
      if (!session?.user?.uid) {
        console.error('No user session available');
        setActiveAssignments(allAssignments);
        setCompletedAssignments([]);
        return;
      }
      
      const submissionsResponse = await apiClient.submissionsAPI.getAll({ studentId: session.user.uid });
      const submissions = submissionsResponse.submissions || [];
      
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
    } catch (err) {
      console.error('Error fetching active assignments:', err);
      throw err;
    }
  };

  const fetchStudentProgress = async () => {
    try {
      const response = await apiClient.progressAPI.getStudentProgress(session.user.id);
      const progressByModule = {};
      
      response.progress?.forEach(progress => {
        if (!progressByModule[progress.moduleId]) {
          progressByModule[progress.moduleId] = {
            assessments: [],
            totalScore: 0,
            maxPossibleScore: 0,
            examScore: 0,
            practicalScore: 0,
            assignmentScore: 0,
            examMaxScore: 0,
            practicalMaxScore: 0,
            assignmentMaxScore: 0,
            isComplete: false,
            passStatus: 'incomplete'
          };
        }
        
        progressByModule[progress.moduleId].assessments.push(progress);
        progressByModule[progress.moduleId].totalScore += progress.score;
        progressByModule[progress.moduleId].maxPossibleScore += progress.maxScore;
        
        // Categorize by assessment type
        if (progress.assessmentType === 'exam') {
          progressByModule[progress.moduleId].examScore += progress.score;
          progressByModule[progress.moduleId].examMaxScore += progress.maxScore;
        } else if (progress.assessmentType === 'practical') {
          progressByModule[progress.moduleId].practicalScore += progress.score;
          progressByModule[progress.moduleId].practicalMaxScore += progress.maxScore;
        } else if (progress.assessmentType === 'assignment') {
          progressByModule[progress.moduleId].assignmentScore += progress.score;
          progressByModule[progress.moduleId].assignmentMaxScore += progress.maxScore;
        }
      });
      
      // Calculate completion status for each module
      Object.keys(progressByModule).forEach(moduleId => {
        const moduleData = progressByModule[moduleId];
        const hasExam = moduleData.examMaxScore > 0;
        const hasPractical = moduleData.practicalMaxScore > 0;
        const hasAssignment = moduleData.assignmentMaxScore > 0;
        const totalPossible = 200; // 100% exam + 100% practical/assignment
        const passThreshold = totalPossible * 0.7; // 70% of 200% = 140%
        
        // Calculate percentage scores
        const examPercentage = moduleData.examMaxScore > 0 ? (moduleData.examScore / moduleData.examMaxScore) * 100 : 0;
        const practicalPercentage = moduleData.practicalMaxScore > 0 ? (moduleData.practicalScore / moduleData.practicalMaxScore) * 100 : 0;
        const assignmentPercentage = moduleData.assignmentMaxScore > 0 ? (moduleData.assignmentScore / moduleData.assignmentMaxScore) * 100 : 0;
        const totalPercentage = examPercentage + Math.max(practicalPercentage, assignmentPercentage);
        
        moduleData.examPercentage = examPercentage;
        moduleData.practicalPercentage = practicalPercentage;
        moduleData.assignmentPercentage = assignmentPercentage;
        moduleData.totalPercentage = totalPercentage;
        
        // Module is complete if both exam and (practical OR assignment) are done and total >= 70%
        moduleData.isComplete = hasExam && (hasPractical || hasAssignment) && totalPercentage >= 70;
        
        if (totalPercentage >= 70) {
          moduleData.passStatus = 'passed';
        } else if (hasExam && hasPractical) {
          moduleData.passStatus = 'failed';
        } else {
          moduleData.passStatus = 'incomplete';
        }
      });
      
      setModuleProgress(progressByModule);
    } catch (err) {
      console.error('Error fetching student progress:', err);
      throw err;
    }
  };

  // Helper functions
  const getModuleName = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.title : 'Unknown Module';
  };

  const getAssessmentProgress = (assessment) => {
    const progress = moduleProgress[assessment.moduleId];
    if (!progress) return null;
    
    const assessmentProgress = progress.assessments.find(p => p.assessmentId === assessment.id);
    return assessmentProgress;
  };

  const getStatusClasses = (status) => {
    if (status === "completed") return "bg-gradient-to-br from-emerald-500 to-green-600";
    if (status === "graded") return "bg-gradient-to-br from-blue-500 to-blue-600";
    if (status === "pending") return "bg-gradient-to-br from-amber-400 to-orange-500";
    return "bg-gradient-to-br from-gray-500 to-gray-600";
  };

  const getModuleStatusClasses = (status) => {
    if (status === "passed") return "bg-gradient-to-br from-emerald-500 to-green-600";
    if (status === "failed") return "bg-gradient-to-br from-red-500 to-red-600";
    return "bg-gradient-to-br from-amber-400 to-orange-500";
  };

  // Calculate summary statistics
  const totalModules = modules.length;
  const completedModules = Object.values(moduleProgress).filter(p => p.isComplete).length;
  const passedModules = Object.values(moduleProgress).filter(p => p.passStatus === 'passed').length;
  const totalAssessments = assessments.length;
  const completedAssessments = assessments.filter(assessment => {
    const progress = getAssessmentProgress(assessment);
    return progress !== null;
  }).length;

  if (loading) {
    return (
      <div className="main-font flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-font flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="main-font flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to view your assessments.</p>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        /* Importing new fonts */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;500;600&display=swap');

        /* Animation for individual assessment cards */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .assessment-card-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        /* Updated: Glass-effect for white background with slight transparency */
        .glass-effect {
          background-color: rgba(255, 255, 255, 0.8); /* Predominantly white, slight transparency */
          backdrop-filter: blur(8px) saturate(180%); /* Reduced blur slightly for white */
          -webkit-backdrop-filter: blur(8px) saturate(180%); /* Safari support */
          border: 1px solid rgba(0, 0, 0, 0.08); /* Subtle border for definition */
          box-shadow: 0 5px 25px 0 rgba(0, 0, 0, 0.15); /* Lighter, but present shadow */
          transition: all 0.3s ease-in-out; /* Smooth transition for glass effect properties */
        }

        /* Updated: Hover effect for glass cards */
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

        /* Progress bar animation */
        @keyframes progressBarFill {
            from { width: 0%; }
            to { width: var(--progress-width, 0%); } /* Use CSS variable for target width */
        }
        .progress-bar-animated {
            animation: progressBarFill 1.5s ease-out forwards;
        }

        /* Button hover effect */
        .btn-hover-effect:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4); /* Cyan glow */
        }

        /* Progress fill styles */
        .progress-fill.practical {
            background: linear-gradient(90deg, #10b981, #059669);
        }
        
        .progress-fill.exam {
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        }
        
        .progress-fill.assignment {
            background: linear-gradient(90deg, #f97316, #ea580c);
        }

        /* Assessment card styles */
        .assessment-card.completed {
            border-left: 4px solid #10b981;
        }
        
        .assessment-card.pending {
            border-left: 4px solid #f59e0b;
        }
        
        .assessment-card.failed {
            border-left: 4px solid #ef4444;
        }
        
        .assignment-card {
            border-left: 4px solid #f97316 !important;
        }
        
        .assignment-card.overdue {
            border-left: 4px solid #ef4444 !important;
            background: rgba(254, 242, 242, 0.5);
        }
        
        .assignment-badge {
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .module-badge {
            background: rgba(156, 163, 175, 0.2);
            color: #374151;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 0.7rem;
            font-weight: 500;
        }
        
        .overdue-text {
            color: #ef4444 !important;
            font-weight: 600;
        }
        
        .subsection-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 1rem;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.5rem;
        }
        
        .assignments-section, .assessments-section {
            margin-bottom: 2rem;
        }
      `}</style>
      <div className="main-font"> {/* Apply the main font */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4 header-font animated-entry"> {/* Changed heading color */}
          My Assessments
        </h1>
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div> {/* Changed divider color */}

        {/* Updated: Summary Section with Module Progress */}
        <div className={`glass-effect p-6 rounded-xl shadow-lg mb-8 grid grid-cols-1 md:grid-cols-4 gap-6
            transform ${isMounted ? 'assessment-card-animated' : 'opacity-0 scale-95'}`}
            style={{ animationDelay: '0.1s' }}>
          <div className="text-center">
            <p className="text-gray-600 text-lg">Total Modules</p>
            <p className="text-blue-700 text-5xl font-extrabold header-font mt-2">{totalModules}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-lg">Passed Modules</p>
            <p className="text-emerald-600 text-5xl font-extrabold header-font mt-2">{passedModules}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-lg">Total Assessments</p>
            <p className="text-purple-700 text-5xl font-extrabold header-font mt-2">{totalAssessments}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-lg">Completed</p>
            <p className="text-cyan-600 text-5xl font-extrabold header-font mt-2">{completedAssessments}</p>
          </div>
        </div>

        {/* Module Progress Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 header-font">Module Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module, idx) => {
              const progress = moduleProgress[module.id];
              const hasProgress = progress && progress.assessments.length > 0;
              
              return (
                <div
                  key={module.id}
                  className={`glass-effect p-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300
                    ${isMounted ? 'assessment-card-animated' : 'opacity-0 scale-95'}`}
                  style={{ animationDelay: `${0.15 + idx * 0.05}s` }}
                >
                  <h3 className="font-semibold text-gray-800 mb-2">{module.title}</h3>
                  
                  {hasProgress ? (
                    <>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Exam:</span>
                          <span className="font-medium">{progress.examPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(progress.examPercentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        {progress.practicalPercentage > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Practical:</span>
                              <span className="font-medium">{progress.practicalPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-300 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(progress.practicalPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </>
                        )}
                        
                        {progress.assignmentPercentage > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Assignment:</span>
                              <span className="font-medium">{progress.assignmentPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-300 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(progress.assignmentPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </>
                        )}
                        
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-gray-700">Total:</span>
                          <span className="text-purple-700">{progress.totalPercentage.toFixed(1)}% / 200%</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(progress.totalPercentage / 2, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold text-center ${getModuleStatusClasses(progress.passStatus)}`}>
                        {progress.passStatus === 'passed' ? 'PASSED' : 
                         progress.passStatus === 'failed' ? 'FAILED' : 'IN PROGRESS'}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">No assessments completed</p>
                      <div className="px-3 py-1 rounded-full bg-gray-400 text-white text-sm font-semibold mt-2">
                        NOT STARTED
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Assignments Section */}
        {activeAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 header-font">Active Assignments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAssignments.map((assignment, idx) => {
                const progress = getAssessmentProgress(assignment);
                const isOverdue = new Date(assignment.dueDate) < new Date();
                const submission = assignment.submission;
                
                return (
                  <div
                    key={assignment.id}
                    onClick={() => window.location.href = `/dashboard/student/assignments/${assignment.moduleId}/${assignment.id}`}
                    className={`glass-effect p-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300 border-l-4 cursor-pointer ${
                      submission ? 'border-green-500' : isOverdue ? 'border-red-500' : 'border-orange-500'
                    } ${isMounted ? 'assessment-card-animated' : 'opacity-0 scale-95'}`}
                    style={{ animationDelay: `${0.15 + idx * 0.05}s` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {submission ? 'SUBMITTED' : 'ASSIGNMENT'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{getModuleName(assignment.moduleId)}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Due Date:</span>
                        <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Max Score:</span>
                        <span className="font-medium">{assignment.maxScore || 100} points</span>
                      </div>
                      {submission && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-blue-600">
                            {submission.status === 'submitted' ? 'Under Review' : 
                             submission.status === 'graded' ? 'Graded' : 
                             submission.status === 'ai_graded' ? 'AI Graded' : 'Submitted'}
                          </span>
                        </div>
                      )}
                      {submission && submission.finalGrade !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Grade:</span>
                          <span className="font-medium text-purple-600">{submission.finalGrade}%</span>
                        </div>
                      )}
                      {progress && !submission && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Your Score:</span>
                          <span className="font-medium text-green-600">{progress.score}%</span>
                        </div>
                      )}
                    </div>
                    
                    {submission && submission.finalGrade !== undefined && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(submission.finalGrade, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {progress && !submission && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(progress.score, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <button 
                        onClick={() => window.location.href = `/dashboard/student/assignments/${assignment.moduleId}/${assignment.id}`}
                        className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                          submission 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                            : progress 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                        }`}
                      >
                        {submission ? 'View Submission' : progress ? 'View Results' : 'Start Assignment'}
                      </button>
                      
                      {submission && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/dashboard/student/assignments/${assignment.moduleId}/${assignment.id}/review`;
                          }}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                        >
                          Review Submission
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Assignments Section */}
        {completedAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 header-font">Completed Assignments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedAssignments.map((assignment, idx) => {
                const submission = assignment.submission;
                
                return (
                  <div
                    key={assignment.id}
                    className={`glass-effect p-6 rounded-xl shadow-lg border-l-4 border-green-500 ${
                      isMounted ? 'assessment-card-animated' : 'opacity-0 scale-95'
                    }`}
                    style={{ animationDelay: `${0.15 + idx * 0.05}s` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                        COMPLETED
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{getModuleName(assignment.moduleId)}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-medium text-gray-800">
                          {new Date(submission.submittedAt.seconds * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-green-600">
                          {submission.status === 'submitted' ? 'Under Review' : 
                           submission.status === 'graded' ? 'Graded' : 
                           submission.status === 'ai_graded' ? 'AI Graded' : 'Submitted'}
                        </span>
                      </div>
                      {submission.finalGrade !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Grade:</span>
                          <span className="font-medium text-blue-600">{submission.finalGrade}%</span>
                        </div>
                      )}
                    </div>
                    
                    {submission.finalGrade !== undefined && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(submission.finalGrade, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => window.location.href = `/dashboard/student/assignments/${assignment.moduleId}/${assignment.id}`}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      View Submission
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Assessment List by Module */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 header-font">Traditional Assessments</h2>
          
          {modules.map((module, moduleIdx) => {
            const moduleAssessments = assessments.filter(a => a.moduleId === module.id);
            if (moduleAssessments.length === 0) return null;
            
            const progress = moduleProgress[module.id];
            
            return (
              <div key={module.id} className="space-y-4">
                <div className={`glass-effect p-4 rounded-xl shadow-lg border-l-4 border-blue-500
                  transform ${isMounted ? 'assessment-card-animated' : 'opacity-0 scale-95'}`}
                  style={{ animationDelay: `${0.2 + moduleIdx * 0.1}s` }}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800 header-font">{module.title}</h3>
                    {progress && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Module Progress</p>
                        <p className="text-lg font-semibold text-purple-700">
                          {progress.totalPercentage.toFixed(1)}% / 200%
                        </p>
                        <span className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${getModuleStatusClasses(progress.passStatus)}`}>
                          {progress.passStatus === 'passed' ? 'PASSED' : 
                           progress.passStatus === 'failed' ? 'FAILED' : 'IN PROGRESS'}
                        </span>
                      </div>
                    )}
                  </div>
                  {module.description && (
                    <p className="text-gray-600 mt-2">{module.description}</p>
                  )}
                </div>
                
                <div className="space-y-4 ml-4">
                  {moduleAssessments.map((assessment, idx) => {
                    const assessmentProgress = getAssessmentProgress(assessment);
                    const statusClasses = assessmentProgress ? getStatusClasses(assessmentProgress.status) : 'bg-gray-500';
                    
                    return (
                      <div
                        key={assessment.id}
                        className={`glass-effect p-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300
                          ${isMounted ? 'assessment-card-animated' : 'opacity-0 scale-95'}`}
                        style={{ animationDelay: `${0.25 + moduleIdx * 0.1 + idx * 0.05}s` }}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-800">{assessment.title}</h4>
                              {assessmentProgress && (
                                <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${statusClasses}`}>
                                  {assessmentProgress.status.toUpperCase()}
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                assessment.type === 'exam' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {assessment.type ? assessment.type.toUpperCase() : 'ASSESSMENT'}
                              </span>
                            </div>
                            
                            {assessment.description && (
                              <p className="text-gray-600 mb-2">{assessment.description}</p>
                            )}
                            
                            <p className="text-gray-600 mb-2">
                              <span className="font-medium">Due:</span> {new Date(assessment.dueDate).toLocaleDateString()}
                            </p>
                            
                            <p className="text-gray-600 mb-4">
                              <span className="font-medium">Max Score:</span> {assessment.maxScore || 100} points
                            </p>
                            
                            {assessmentProgress && assessmentProgress.score !== null && (
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Score: {assessmentProgress.score}% ({assessmentProgress.actualScore || assessmentProgress.score}/{assessment.maxScore || 100} points)
                                  </span>
                                  <span className="text-sm text-gray-500">{assessmentProgress.score}% of 100%</span>
                                </div>
                                <div className="w-full bg-gray-300 rounded-full h-3">
                                  <div
                                    className={`h-3 rounded-full transition-all duration-1000 progress-bar-fill ${
                                      statusClasses.includes('bg-emerald') ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 
                                      statusClasses.includes('bg-red') ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                                      'bg-gradient-to-r from-blue-500 to-blue-600'
                                    }`}
                                    style={{ width: `${Math.min(assessmentProgress.score, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 md:mt-0 md:ml-6">
                            <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
