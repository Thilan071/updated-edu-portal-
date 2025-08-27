'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';

export default function SubmissionReviewPage() {
  const { data: session } = useSession();
  const params = useParams();
  const { moduleId, assignmentId } = params;
  
  const [submission, setSubmission] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.user && moduleId && assignmentId) {
      fetchSubmissionDetails();
    }
  }, [session, moduleId, assignmentId]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch submission details
      const submissionResponse = await apiClient.submissionsAPI.getByAssignment(assignmentId);
      if (submissionResponse.submissions && submissionResponse.submissions.length > 0) {
        setSubmission(submissionResponse.submissions[0]);
      }
      
      // Fetch assignment details
      const assignmentResponse = await apiClient.assignmentsAPI.getById(assignmentId);
      setAssignment(assignmentResponse.assignment);
      
      // Fetch module details
      const moduleResponse = await apiClient.modulesAPI.getById(moduleId);
      setModule(moduleResponse.module);
      
    } catch (err) {
      console.error('Error fetching submission details:', err);
      setError('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'graded': return 'text-green-600 bg-green-100';
      case 'ai_graded': return 'text-purple-600 bg-purple-100';
      case 'under_review': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getReviewStatusColor = (reviewStatus) => {
    switch (reviewStatus) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'under_review': return 'text-blue-600 bg-blue-100';
      case 'reviewed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="main-font flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-font flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href={`/dashboard/student/assignments/${moduleId}/${assignmentId}`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Back to Assignment
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="main-font flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No submission found for this assignment.</p>
          <Link href={`/dashboard/student/assignments/${moduleId}/${assignmentId}`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Back to Assignment
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-font min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/student/assessments" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Assessments
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 header-font mb-2">
            Submission Review
          </h1>
          <p className="text-gray-600">
            {module?.title} - {assignment?.title}
          </p>
        </div>

        {/* Submission Overview */}
        <div className="glass-effect p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Submission Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className="font-medium">{formatDate(submission.submittedAt)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                  {submission.status === 'submitted' ? 'Submitted' : 
                   submission.status === 'graded' ? 'Graded' : 
                   submission.status === 'ai_graded' ? 'AI Graded' : 'Under Review'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Review Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReviewStatusColor(submission.reviewStatus)}`}>
                  {submission.reviewStatus === 'pending' ? 'Pending Review' : 
                   submission.reviewStatus === 'under_review' ? 'Under Review' : 
                   submission.reviewStatus === 'reviewed' ? 'Reviewed' : 'Pending'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Submission Type:</span>
                <span className="font-medium capitalize">{submission.submissionType}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {submission.finalGrade !== undefined && submission.finalGrade !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Grade:</span>
                  <span className="font-bold text-lg text-purple-600">{submission.finalGrade}%</span>
                </div>
              )}
              
              {submission.aiGrade !== undefined && submission.aiGrade !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Grade:</span>
                  <span className="font-medium text-blue-600">{submission.aiGrade}%</span>
                </div>
              )}
              
              {submission.isGraded && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Graded:</span>
                  <span className="font-medium">{formatDate(submission.gradedAt)}</span>
                </div>
              )}
              
              {submission.lastViewedBy && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Viewed:</span>
                  <span className="font-medium">{formatDate(submission.lastViewedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submission Content */}
        <div className="glass-effect p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Submission Content</h2>
          
          {submission.submissionText && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Text Submission</h3>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="whitespace-pre-wrap">{submission.submissionText}</p>
              </div>
            </div>
          )}
          
          {submission.fileUrl && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">File Submission</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <a 
                  href={submission.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  📎 View Submitted File
                </a>
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis */}
        {submission.aiAnalysis && (
          <div className="glass-effect p-6 rounded-xl shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">AI Analysis</h2>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="whitespace-pre-wrap">{submission.aiAnalysis}</p>
            </div>
          </div>
        )}

        {/* Educator Feedback */}
        {submission.educatorFeedback && (
          <div className="glass-effect p-6 rounded-xl shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Educator Feedback</h2>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="whitespace-pre-wrap">{submission.educatorFeedback}</p>
            </div>
          </div>
        )}

        {/* Grade Breakdown */}
        {(submission.finalGrade !== undefined && submission.finalGrade !== null) && (
          <div className="glass-effect p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Grade Breakdown</h2>
            <div className="w-full bg-gray-300 rounded-full h-4 mb-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(submission.finalGrade, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>0%</span>
              <span className="font-bold text-purple-600">{submission.finalGrade}%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}