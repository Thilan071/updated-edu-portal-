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
  const [expandedModules, setExpandedModules] = useState({}); // New state for tracking expanded modules
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
      
      // Step 1: Load basic data
      const [assessmentsData, modulesData] = await Promise.all([
        apiClient.assessmentAPI.getAll(),
        apiClient.moduleAPI.getAll()
      ]);
      
      setAssessments(assessmentsData.assessments || []);
      setModules(modulesData.modules || []);
      
      // Step 2: Load assignments and submissions
      const activeAssignmentsResponse = await apiClient.studentAPI.getActiveAssignments();
      const allAssignments = activeAssignmentsResponse.assignments || [];
      
      if (!session?.user?.uid) {
        console.error('No user session available');
        setActiveAssignments(allAssignments);
        setCompletedAssignments([]);
        return;
      }
      
      const submissionsResponse = await apiClient.submissionsAPI.getAll({ studentId: session.user.uid });
      const submissions = submissionsResponse.submissions || [];
      
      console.log('📋 Fetched submissions:', submissions);
      
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
          console.log('📋 Found completed assignment:', assignment.title, 'with grade:', submission?.finalGrade);
        } else {
          active.push(assignment);
        }
      });
      
      setActiveAssignments(active);
      setCompletedAssignments(completed);
      
      // Step 3: Now calculate progress with all data available
      await calculateStudentProgress(completed);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };
  
  // Separate function to calculate progress with completed assignments
  const calculateStudentProgress = async (completedAssignmentsData = completedAssignments) => {
    try {
      const response = await apiClient.progressAPI.getStudentProgress(session.user.id);
      const progressByModule = {};
      
      console.log('🔍 Calculating progress with completed assignments:', completedAssignmentsData);
      
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
      
      // Include completed assignments/submissions in progress calculation
      completedAssignmentsData.forEach(assignment => {
        const moduleId = assignment.moduleId;
        const submission = assignment.submission;
        
        console.log('🔍 Processing completed assignment:', assignment.title, 'Grade:', submission?.finalGrade);
        
        if (submission?.finalGrade !== undefined) {
          if (!progressByModule[moduleId]) {
            progressByModule[moduleId] = {
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
          
          // Add submission as assignment score
          const maxScore = assignment.maxScore || 100;
          const actualScore = (submission.finalGrade / 100) * maxScore;
          
          console.log('📊 Adding assignment score:', actualScore, 'out of', maxScore);
          
          progressByModule[moduleId].assignmentScore += actualScore;
          progressByModule[moduleId].assignmentMaxScore += maxScore;
          progressByModule[moduleId].totalScore += actualScore;
          progressByModule[moduleId].maxPossibleScore += maxScore;
          
          // Add to assessments array for tracking
          progressByModule[moduleId].assessments.push({
            assessmentId: assignment.id,
            assessmentType: 'assignment',
            score: actualScore,
            maxScore: maxScore,
            status: 'completed',
            actualScore: actualScore
          });
        }
      });
      
      // Calculate completion status for each module
      Object.keys(progressByModule).forEach(moduleId => {
        const moduleData = progressByModule[moduleId];
        const hasExam = moduleData.examMaxScore > 0;
        const hasPractical = moduleData.practicalMaxScore > 0;
        const hasAssignment = moduleData.assignmentMaxScore > 0;
        
        // Calculate percentage scores with comprehensive null/undefined/NaN checks
        const examScore = moduleData.examScore || 0;
        const examMaxScore = moduleData.examMaxScore || 0;
        const practicalScore = moduleData.practicalScore || 0;
        const practicalMaxScore = moduleData.practicalMaxScore || 0;
        const assignmentScore = moduleData.assignmentScore || 0;
        const assignmentMaxScore = moduleData.assignmentMaxScore || 0;
        
        // Safe percentage calculations with proper validation
        const examPercentage = (examMaxScore > 0 && !isNaN(examScore) && !isNaN(examMaxScore)) 
          ? (examScore / examMaxScore) * 100 
          : 0;
        const practicalPercentage = (practicalMaxScore > 0 && !isNaN(practicalScore) && !isNaN(practicalMaxScore)) 
          ? (practicalScore / practicalMaxScore) * 100 
          : 0;
        const assignmentPercentage = (assignmentMaxScore > 0 && !isNaN(assignmentScore) && !isNaN(assignmentMaxScore)) 
          ? (assignmentScore / assignmentMaxScore) * 100 
          : 0;
        
        // Ensure no NaN values with additional safety checks
        const safeExamPercentage = (isNaN(examPercentage) || examPercentage < 0) ? 0 : Math.min(examPercentage, 100);
        const safePracticalPercentage = (isNaN(practicalPercentage) || practicalPercentage < 0) ? 0 : Math.min(practicalPercentage, 100);
        const safeAssignmentPercentage = (isNaN(assignmentPercentage) || assignmentPercentage < 0) ? 0 : Math.min(assignmentPercentage, 100);
        
        // Calculate total percentage safely
        const higherOfPracticalOrAssignment = Math.max(safePracticalPercentage, safeAssignmentPercentage);
        const totalPercentage = safeExamPercentage + higherOfPracticalOrAssignment;
        const safeTotalPercentage = (isNaN(totalPercentage) || totalPercentage < 0) ? 0 : Math.min(totalPercentage, 200);
        
        moduleData.examPercentage = safeExamPercentage;
        moduleData.practicalPercentage = safePracticalPercentage;
        moduleData.assignmentPercentage = safeAssignmentPercentage;
        moduleData.totalPercentage = safeTotalPercentage;
        
        console.log('📈 Module', moduleId, 'percentages:', {
          exam: safeExamPercentage,
          practical: safePracticalPercentage,
          assignment: safeAssignmentPercentage,
          total: safeTotalPercentage
        });
        
        // Module is complete only if BOTH exam AND (practical OR assignment) are completed and total >= 70%
        const examCompleted = hasExam && safeExamPercentage > 0;
        const practicalOrAssignmentCompleted = (hasPractical && safePracticalPercentage > 0) || (hasAssignment && safeAssignmentPercentage > 0);
        
        moduleData.isComplete = examCompleted && practicalOrAssignmentCompleted && safeTotalPercentage >= 70;
        
        // Pass status: only pass if both assessment types are completed and score >= 70%
        if (examCompleted && practicalOrAssignmentCompleted && safeTotalPercentage >= 70) {
          moduleData.passStatus = 'passed';
        } else if (examCompleted && practicalOrAssignmentCompleted && safeTotalPercentage < 70) {
          moduleData.passStatus = 'failed';
        } else if (hasExam || hasPractical || hasAssignment) {
          moduleData.passStatus = 'incomplete';
        } else {
          moduleData.passStatus = 'incomplete';
        }
      });
      
      console.log('📋 Final progress by module:', progressByModule);
      setModuleProgress(progressByModule);
    } catch (err) {
      console.error('Error calculating student progress:', err);
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
      
      // Debug: Log the current completed assignments
      console.log('🔍 Completed assignments during progress calculation:', completedAssignments);
      
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
      
      // Also include completed assignments/submissions in progress calculation
      completedAssignments.forEach(assignment => {
        const moduleId = assignment.moduleId;
        const submission = assignment.submission;
        
        console.log('🔍 Processing completed assignment:', assignment.title, 'Grade:', submission?.finalGrade);
        
        if (submission?.finalGrade !== undefined) {
          if (!progressByModule[moduleId]) {
            progressByModule[moduleId] = {
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
          
          // Add submission as assignment score
          const maxScore = assignment.maxScore || 100;
          const actualScore = (submission.finalGrade / 100) * maxScore;
          
          console.log('📊 Adding assignment score:', actualScore, 'out of', maxScore);
          
          progressByModule[moduleId].assignmentScore += actualScore;
          progressByModule[moduleId].assignmentMaxScore += maxScore;
          progressByModule[moduleId].totalScore += actualScore;
          progressByModule[moduleId].maxPossibleScore += maxScore;
          
          // Add to assessments array for tracking
          progressByModule[moduleId].assessments.push({
            assessmentId: assignment.id,
            assessmentType: 'assignment',
            score: actualScore,
            maxScore: maxScore,
            status: 'completed',
            actualScore: actualScore
          });
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
        
        // Calculate percentage scores with comprehensive safety checks
        const examScore = moduleData.examScore || 0;
        const examMaxScore = moduleData.examMaxScore || 0;
        const practicalScore = moduleData.practicalScore || 0;
        const practicalMaxScore = moduleData.practicalMaxScore || 0;
        const assignmentScore = moduleData.assignmentScore || 0;
        const assignmentMaxScore = moduleData.assignmentMaxScore || 0;
        
        // Safe percentage calculations
        const examPercentage = (examMaxScore > 0 && !isNaN(examScore) && !isNaN(examMaxScore)) 
          ? (examScore / examMaxScore) * 100 
          : 0;
        const practicalPercentage = (practicalMaxScore > 0 && !isNaN(practicalScore) && !isNaN(practicalMaxScore)) 
          ? (practicalScore / practicalMaxScore) * 100 
          : 0;
        const assignmentPercentage = (assignmentMaxScore > 0 && !isNaN(assignmentScore) && !isNaN(assignmentMaxScore)) 
          ? (assignmentScore / assignmentMaxScore) * 100 
          : 0;
        
        // Ensure no NaN values with bounds checking
        const safeExamPercentage = (isNaN(examPercentage) || examPercentage < 0) ? 0 : Math.min(examPercentage, 100);
        const safePracticalPercentage = (isNaN(practicalPercentage) || practicalPercentage < 0) ? 0 : Math.min(practicalPercentage, 100);
        const safeAssignmentPercentage = (isNaN(assignmentPercentage) || assignmentPercentage < 0) ? 0 : Math.min(assignmentPercentage, 100);
        
        const higherOfPracticalOrAssignment = Math.max(safePracticalPercentage, safeAssignmentPercentage);
        const totalPercentage = safeExamPercentage + higherOfPracticalOrAssignment;
        const safeTotalPercentage = (isNaN(totalPercentage) || totalPercentage < 0) ? 0 : Math.min(totalPercentage, 200);
        
        console.log('📈 Module', moduleId, 'percentages:', {
          exam: examPercentage,
          practical: practicalPercentage,
          assignment: assignmentPercentage,
          total: totalPercentage
        });
        
        moduleData.examPercentage = safeExamPercentage;
        moduleData.practicalPercentage = safePracticalPercentage;
        moduleData.assignmentPercentage = safeAssignmentPercentage;
        moduleData.totalPercentage = safeTotalPercentage;
        
        // Module is complete only if BOTH exam AND (practical OR assignment) are completed and total >= 70%
        const examCompleted = hasExam && safeExamPercentage > 0;
        const practicalOrAssignmentCompleted = (hasPractical && safePracticalPercentage > 0) || (hasAssignment && safeAssignmentPercentage > 0);
        
        moduleData.isComplete = examCompleted && practicalOrAssignmentCompleted && safeTotalPercentage >= 70;
        
        // Pass status: only pass if both assessment types are completed and score >= 70%
        if (examCompleted && practicalOrAssignmentCompleted && safeTotalPercentage >= 70) {
          moduleData.passStatus = 'passed';
        } else if (examCompleted && practicalOrAssignmentCompleted && safeTotalPercentage < 70) {
          moduleData.passStatus = 'failed';
        } else if (hasExam || hasPractical || hasAssignment) {
          moduleData.passStatus = 'incomplete';
        } else {
          moduleData.passStatus = 'incomplete';
        }
      });
      
      console.log('📋 Final progress by module:', progressByModule);
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

  // New helper function to toggle module expansion
  const toggleModuleExpansion = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // New helper function to get assignments for a module
  const getModuleAssignments = (moduleId) => {
    const moduleAssessments = assessments.filter(a => a.moduleId === moduleId);
    const moduleActiveAssignments = activeAssignments.filter(a => a.moduleId === moduleId);
    const moduleCompletedAssignments = completedAssignments.filter(a => a.moduleId === moduleId);
    
    return {
      assessments: moduleAssessments,
      activeAssignments: moduleActiveAssignments,
      completedAssignments: moduleCompletedAssignments,
      totalAssignments: moduleAssessments.length + moduleActiveAssignments.length + moduleCompletedAssignments.length
    };
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
  
  // Calculate total assessments (traditional assessments + all assignments)
  const totalAssessments = assessments.length + activeAssignments.length + completedAssignments.length;
  
  // Calculate completed assessments (traditional assessments with progress + completed assignments)
  const completedTraditionalAssessments = assessments.filter(assessment => {
    const progress = getAssessmentProgress(assessment);
    return progress !== null;
  }).length;
  const completedAssessments = completedTraditionalAssessments + completedAssignments.length;

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

        /* Fade-in animation for expanded content */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
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

        /* Enhanced progress bar styles */
        .module-progress-bar {
            background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 100%);
            border: 1px solid #d1d5db;
        }
        
        .module-progress-fill {
            background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #10b981 100%);
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
            position: relative;
        }
        
        .module-progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
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

        {/* Module Progress Section - Now Expandable */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 header-font">Module Progress & Assignments</h2>
          <div className="space-y-6">
            {modules.map((module, idx) => {
              const progress = moduleProgress[module.id];
              const moduleAssignments = getModuleAssignments(module.id);
              const isExpanded = expandedModules[module.id];
              
              return (
                <div key={module.id} className="space-y-4">
                  {/* Module Card Header - Clickable */}
                  <div
                    className={`glass-effect p-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-blue-500
                      ${isMounted ? 'assessment-card-animated' : 'opacity-0 scale-95'}`}
                    style={{ animationDelay: `${0.15 + idx * 0.05}s` }}
                    onClick={() => toggleModuleExpansion(module.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-800">{module.title}</h3>
                          <span className="text-gray-500 text-sm">
                            ({moduleAssignments.totalAssignments} assignment{moduleAssignments.totalAssignments !== 1 ? 's' : ''})
                          </span>
                          <div className={`transform transition-transform duration-200 text-gray-500 ${
                            isExpanded ? 'rotate-180' : 'rotate-0'
                          }`}>
                            ▼
                          </div>
                        </div>
                        

                        
                        {/* Module Progress Bar */}
                        <div className="mt-4">
                          {progress ? (
                            <>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Overall Module Progress</span>
                                <span className="text-sm text-gray-600">{(progress.totalPercentage || 0).toFixed(1)}% / 200%</span>
                              </div>
                              <div className="w-full module-progress-bar rounded-full h-4 shadow-inner">
                                <div
                                  className="module-progress-fill h-4 rounded-full transition-all duration-1000 overflow-hidden"
                                  style={{ width: `${Math.min((progress.totalPercentage || 0) / 2, 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0%</span>
                                <span>50% (One Assessment)</span>
                                <span>100% (Both Assessments)</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center">
                                Progress combines both Exam ({(progress.examPercentage || 0).toFixed(1)}%) and Assignment ({(progress.assignmentPercentage || 0).toFixed(1)}%) assessments
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Overall Module Progress</span>
                                <span className="text-sm text-gray-600">0%</span>
                              </div>
                              <div className="w-full module-progress-bar rounded-full h-4 shadow-inner">
                                <div className="bg-gray-300 h-4 rounded-full" style={{ width: '0%' }}></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0%</span>
                                <span>50% (One Assessment)</span>
                                <span>100% (Both Assessments)</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center">
                                Complete both Exam and Assignment assessments to track progress
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="text-right ml-6">
                        {progress ? (
                          <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${
                            getModuleStatusClasses(progress.passStatus)
                          }`}>
                            {progress.passStatus === 'passed' ? 'PASSED' : 
                             progress.passStatus === 'failed' ? 'FAILED' :
                             progress.passStatus === 'incomplete' ? 'IN PROGRESS' : 'NOT STARTED'}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-gray-400 text-white text-sm font-semibold">
                            NOT STARTED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Module Content */}
                  {isExpanded && (
                    <div className="ml-6 space-y-6 animate-fade-in">
                      {/* Traditional Assessments */}
                      {moduleAssignments.assessments.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-700 mb-3">📊 Traditional Assessments</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {moduleAssignments.assessments.map((assessment) => {
                              const assessmentProgress = getAssessmentProgress(assessment);
                              const statusClasses = assessmentProgress ? getStatusClasses(assessmentProgress.status) : 'bg-gray-500';
                              
                              return (
                                <div key={assessment.id} className="glass-effect p-4 rounded-lg border-l-4 border-purple-400 relative">
                                  {/* AI Generated Badge */}
                                  {assessmentProgress?.aiGenerated && (
                                    <div className="absolute top-2 right-2">
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500 text-white text-xs rounded-full font-medium">
                                        🤖 AI Progress
                                      </span>
                                    </div>
                                  )}
                                  
                                  <h5 className="font-semibold text-gray-800 mb-2 pr-16">{assessment.title}</h5>
                                  <p className="text-sm text-gray-600 mb-2">
                                    Type: {assessment.type || 'Assessment'}
                                  </p>
                                  
                                  {/* Progress Display */}
                                  {assessmentProgress && (
                                    <div className="mb-3">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-500">Progress</span>
                                        <span className="text-sm font-medium text-blue-600">
                                          {assessmentProgress.progressPercentage || assessmentProgress.score || 0}%
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                                          style={{ width: `${assessmentProgress.progressPercentage || assessmentProgress.score || 0}%` }}
                                        ></div>
                                      </div>
                                      
                                      {/* AI Progress Indicator */}
                                      {assessmentProgress.aiGenerated && (
                                        <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                                          <p className="text-xs text-purple-700">
                                            ✨ Progress tracked by AI assessment
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm">
                                    View Details
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Active Assignments */}
                      {moduleAssignments.activeAssignments.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-700 mb-3">📝 Active Assignments</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {moduleAssignments.activeAssignments.map((assignment) => {
                              const isOverdue = new Date(assignment.dueDate) < new Date();
                              
                              return (
                                <div 
                                  key={assignment.id}
                                  onClick={() => window.location.href = `/dashboard/student/assignments/${assignment.moduleId}/${assignment.id}`}
                                  className={`glass-effect p-4 rounded-lg cursor-pointer border-l-4 hover:scale-105 transition-all ${
                                    isOverdue ? 'border-red-500' : 'border-orange-500'
                                  }`}
                                >
                                  <h5 className="font-semibold text-gray-800 mb-2">{assignment.title}</h5>
                                  <p className={`text-sm mb-2 ${
                                    isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                                  }`}>
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </p>
                                  <button className={`w-full px-4 py-2 rounded text-sm font-medium ${
                                    isOverdue 
                                      ? 'bg-red-600 hover:bg-red-700 text-white'
                                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                                  }`}>
                                    {isOverdue ? 'Complete Overdue' : 'Start Assignment'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Completed Assignments */}
                      {moduleAssignments.completedAssignments.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-700 mb-3">✅ Completed Assignments</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {moduleAssignments.completedAssignments.map((assignment) => {
                              // Check if this assignment has AI-generated progress
                              const aiGenerated = progress?.assessments?.find(a => 
                                a.assessmentId === assignment.id && a.aiGenerated === true
                              );
                              
                              return (
                                <div key={assignment.id} className="glass-effect p-4 rounded-lg border-l-4 border-green-500 relative">
                                  {/* AI Generated Badge */}
                                  {aiGenerated && (
                                    <div className="absolute top-2 right-2">
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500 text-white text-xs rounded-full font-medium">
                                        🤖 AI Progress
                                      </span>
                                    </div>
                                  )}
                                  
                                  <h5 className="font-semibold text-gray-800 mb-2 pr-20">{assignment.title}</h5>
                                  <p className="text-sm text-gray-600 mb-1">
                                    Submitted: {new Date(assignment.submission.submittedAt.seconds * 1000).toLocaleDateString()}
                                  </p>
                                  
                                  {/* Progress Display */}
                                  <div className="mb-2">
                                    {assignment.submission.finalGrade && (
                                      <p className="text-sm font-medium text-green-600">
                                        Progress: {assignment.submission.finalGrade}%
                                        {aiGenerated && (
                                          <span className="text-xs text-purple-600 ml-2">
                                            (AI Assessment: {aiGenerated.progressPercentage || aiGenerated.score}%)
                                          </span>
                                        )}
                                      </p>
                                    )}
                                    
                                    {/* AI Progress Indicator */}
                                    {aiGenerated && (
                                      <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                                        <p className="text-xs text-purple-700">
                                          ✨ This assignment was automatically assessed by AI for progress tracking
                                        </p>
                                        {aiGenerated.feedback && (
                                          <p className="text-xs text-gray-600 mt-1 truncate" title={aiGenerated.feedback}>
                                            Feedback: {aiGenerated.feedback}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <button 
                                    onClick={() => window.location.href = `/dashboard/student/assignments/${assignment.moduleId}/${assignment.id}`}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                                  >
                                    View Submission
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>





       
      </div>
    </>
  );
}
