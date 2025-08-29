'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, Phone, Calendar, BookOpen, Award, 
  TrendingUp, Clock, CheckCircle, AlertCircle, Edit3, Save, X, MessageSquare 
} from 'lucide-react';
import apiClient from '@/lib/apiClient';

const GRADE_LEVELS = {
  'A+': { min: 85, max: 100, color: 'bg-green-500', textColor: 'text-green-300' },
  'A': { min: 75, max: 84, color: 'bg-green-400', textColor: 'text-green-300' },
  'B+': { min: 65, max: 74, color: 'bg-blue-500', textColor: 'text-blue-300' },
  'B': { min: 55, max: 64, color: 'bg-blue-400', textColor: 'text-blue-300' },
  'C+': { min: 45, max: 54, color: 'bg-yellow-500', textColor: 'text-yellow-300' },
  'C': { min: 35, max: 44, color: 'bg-yellow-400', textColor: 'text-yellow-300' },
  'D': { min: 25, max: 34, color: 'bg-orange-500', textColor: 'text-orange-300' },
  'F': { min: 0, max: 24, color: 'bg-red-500', textColor: 'text-red-300' }
};

function getGradeFromMarks(marks) {
  for (const [grade, range] of Object.entries(GRADE_LEVELS)) {
    if (marks >= range.min && marks <= range.max) {
      return { grade, ...range };
    }
  }
  return { grade: 'F', ...GRADE_LEVELS.F };
}

function ModuleCard({ module, student, onUpdateMarks }) {
  const [isEditing, setIsEditing] = useState(false);
  const [marks, setMarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isRepeatModule, setIsRepeatModule] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  
  // Get current progress for this module
  const moduleProgress = student.moduleProgress?.find(p => p.moduleId === module.id);
  const currentMarks = moduleProgress?.marks || moduleProgress?.score || 0;
  const status = moduleProgress?.status || 'not_started';
  const gradeInfo = getGradeFromMarks(currentMarks);
  
  useEffect(() => {
    setMarks(currentMarks.toString());
    // Load existing feedback when component mounts
    loadExistingFeedback();
  }, [currentMarks]);

  const loadExistingFeedback = async () => {
    try {
      const response = await fetch(`/api/educator/module-feedback?studentId=${student.id}&moduleId=${module.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.feedbacks.length > 0) {
          const feedback = data.feedbacks[0]; // Get most recent feedback
          setExistingFeedback(feedback);
          setFeedback(feedback.feedback);
          setIsRepeatModule(feedback.isRepeatModule);
        }
      } else {
        console.warn('Failed to load existing feedback:', response.status);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const handleSave = async () => {
    if (!marks || isNaN(marks) || marks < 0 || marks > 100) {
      alert('Please enter a valid mark between 0 and 100');
      return;
    }
    
    setLoading(true);
    try {
      await onUpdateMarks(module.id, parseFloat(marks));
      setIsEditing(false);
    } catch (error) {
      alert('Failed to update marks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMarks(currentMarks.toString());
    setIsEditing(false);
  };

  const handleSaveFeedback = async () => {
    if (!feedback.trim()) {
      alert('Please enter feedback before saving');
      return;
    }

    setSavingFeedback(true);
    try {
      const response = await fetch('/api/educator/module-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentId: student.id,
          moduleId: module.id,
          feedback: feedback.trim(),
          isRepeatModule: isRepeatModule
        })
      });

      if (response.ok) {
        const result = await response.json();
        setExistingFeedback(result.feedback);
        setShowFeedback(false);
        
        // Show success message with better UX
        const action = existingFeedback ? 'updated' : 'saved';
        alert(`✅ Feedback ${action} successfully!${isRepeatModule ? '\n📝 This will appear in the student\'s repeat preparation plan.' : ''}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save feedback');
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert(`❌ Failed to save feedback: ${error.message}`);
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleCancelFeedback = () => {
    setFeedback(existingFeedback?.feedback || '');
    setIsRepeatModule(existingFeedback?.isRepeatModule || false);
    setShowFeedback(false);
  };

  return (
    <div className="glass-effect-dark rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{module.title || module.name}</h3>
          <p className="text-gray-400 text-sm">{module.description}</p>
          <div className="flex items-center mt-2 space-x-4">
            <span className="text-xs text-gray-500">
              Duration: {module.duration || 'N/A'}
            </span>
            <span className="text-xs text-gray-500">
              Level: {module.level || 'N/A'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {status === 'completed' && (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          {status === 'in_progress' && (
            <Clock className="w-5 h-5 text-yellow-400" />
          )}
          {status === 'not_started' && (
            <AlertCircle className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-300 font-medium">Current Marks:</span>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <span className="text-2xl font-bold text-white">{currentMarks}%</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${gradeInfo.color}/20 ${gradeInfo.textColor}`}>
                  {gradeInfo.grade}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Edit marks"
                >
                  <Edit3 className="w-4 h-4 text-blue-400" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center focus:outline-none focus:border-blue-400"
                  placeholder="0-100"
                />
                <span className="text-gray-400">%</span>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="p-1 hover:bg-green-500/20 rounded transition-colors disabled:opacity-50"
                  title="Save marks"
                >
                  <Save className="w-4 h-4 text-green-400" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${gradeInfo.color}`}
            style={{ width: `${currentMarks}%` }}
          ></div>
        </div>
        
        {/* Status */}
        <div className="mt-3 flex justify-between items-center text-sm">
          <span className="text-gray-400">Status:</span>
          <span className={`capitalize ${
            status === 'completed' ? 'text-green-400' :
            status === 'in_progress' ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            {status.replace('_', ' ')}
          </span>
        </div>
        
        {/* Feedback Section */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 text-sm">Module Feedback</span>
              {existingFeedback && (
                <span className="text-xs text-green-400">
                  ({existingFeedback.isRepeatModule ? 'Repeat Module' : 'Regular'})
                </span>
              )}
            </div>
            <button
              onClick={() => setShowFeedback(true)}
              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded transition-colors"
            >
              {existingFeedback ? 'Edit Feedback' : 'Add Feedback'}
            </button>
          </div>
          {existingFeedback && (
            <div className="mt-2 p-2 bg-white/5 rounded text-xs text-gray-300">
              {existingFeedback.feedback.length > 100 
                ? `${existingFeedback.feedback.substring(0, 100)}...` 
                : existingFeedback.feedback}
            </div>
          )}
        </div>
      </div>
      
      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  Module Feedback: {module.title || module.name}
                </h3>
                <button
                  onClick={handleCancelFeedback}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Feedback for {student.firstName} {student.lastName}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your feedback for this module..."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRepeatModule"
                  checked={isRepeatModule}
                  onChange={(e) => setIsRepeatModule(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isRepeatModule" className="text-sm text-gray-300">
                  This is a repeat module (will show in student's repeat preparation plan)
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleCancelFeedback}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFeedback}
                  disabled={savingFeedback || !feedback.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {savingFeedback ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Feedback</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId;
  
  const [student, setStudent] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user?.id && studentId) {
      fetchStudentDetails();
    }
  }, [session, studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session?.user?.id) {
        throw new Error('No educator session found');
      }
      
      // Get all students and find the specific one
      const studentsResponse = await apiClient.educatorAPI.getFilteredStudents(session.user.id, {});
      const foundStudent = studentsResponse.data?.find(s => s.id === studentId);
      
      if (!foundStudent) {
        throw new Error('Student not found');
      }
      
      setStudent(foundStudent);
      
      // Get all available modules for the student's enrolled courses
      const allModules = [];
      for (const course of foundStudent.enrolledCourses || []) {
        if (course.moduleIds) {
          for (const moduleId of course.moduleIds) {
            try {
              const moduleResponse = await fetch(`/api/modules/${moduleId}`, {
                credentials: 'include'
              });
              if (moduleResponse.ok) {
                const moduleData = await moduleResponse.json();
                allModules.push(moduleData.module);
              }
            } catch (err) {
              console.warn('Failed to fetch module:', moduleId);
            }
          }
        }
      }
      
      setModules(allModules);
    } catch (error) {
      console.error('Error fetching student details:', error);
      setError('Failed to load student details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStudentMarks = async (moduleId, marks) => {
    try {
      // Update student progress using the new module marks endpoint
      const response = await fetch('/api/student-progress/module-marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentId: studentId,
          moduleId: moduleId,
          marks: marks
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update marks');
      }
      
      // Refresh student data
      await fetchStudentDetails();
      
    } catch (error) {
      console.error('Error updating marks:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="main-font text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-font text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="main-font text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">Student not found</div>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  const overallCompletion = student.totalModules > 0 ? 
    Math.round((student.completedModules / student.totalModules) * 100) : 0;

  return (
    <>
      <style jsx>{`
        .glass-effect-dark {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
        }
      `}</style>
      
      <div className="main-font text-white min-h-screen">
        {/* Header */}
        <div className={`mb-6 ${isMounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
          <button
            onClick={() => router.back()}
            className="flex items-center mb-4 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Students
          </button>
          
          <h1 className="text-4xl font-bold header-font flex items-center">
            <User className="w-10 h-10 mr-3 text-blue-400" />
            Student Details
          </h1>
          <p className="text-lg text-gray-300">Complete overview and module marking for {fullName}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Information Panel */}
          <div className="lg:col-span-1">
            <div className="glass-effect-dark rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                <User className="w-6 h-6 mr-2 text-blue-400" />
                Personal Information
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm">Full Name</label>
                  <p className="text-white font-medium">{fullName}</p>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Student ID</label>
                  <p className="text-white font-medium">{student.studentId || student.id}</p>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Email</label>
                  <p className="text-white font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {student.email}
                  </p>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Current Batch</label>
                  <p className="text-white font-medium">{student.currentBatchName || 'Not assigned'}</p>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Enrolled Courses</label>
                  <div className="space-y-1">
                    {student.enrolledCourses?.map((course, idx) => (
                      <p key={idx} className="text-white text-sm">• {course.title || course.name}</p>
                    )) || <p className="text-gray-400">No courses enrolled</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="glass-effect-dark rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
                Overall Progress
              </h2>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-white mb-2">{overallCompletion}%</div>
                <div className="text-gray-400">
                  {student.completedModules} of {student.totalModules} modules completed
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    overallCompletion >= 70 ? 'bg-green-500' : 
                    overallCompletion >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${overallCompletion}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-400">
                <span>Started</span>
                <span>In Progress</span>
                <span>Completed</span>
              </div>
            </div>
          </div>

          {/* Modules and Marking Panel */}
          <div className="lg:col-span-2">
            <div className="glass-effect-dark rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-blue-400" />
                Module Performance & Marking
              </h2>
              
              {modules.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {modules.map((module) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      student={student}
                      onUpdateMarks={updateStudentMarks}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No modules found for this student</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
