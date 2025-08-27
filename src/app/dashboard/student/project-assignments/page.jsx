'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProjectAssignments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projectAssignments, setProjectAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, graded, pending

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchProjectAssignments();
    }
  }, [status, session]);

  const fetchProjectAssignments = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/project-assignments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project assignments');
      }

      const data = await response.json();
      setProjectAssignments(data.projectAssignments || []);
    } catch (error) {
      console.error('Error fetching project assignments:', error);
      setError('Failed to load project assignments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = projectAssignments.filter(assignment => {
    if (filter === 'graded') return assignment.isGraded;
    if (filter === 'pending') return !assignment.isGraded;
    return true;
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading project assignments...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to view your project assignments.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Error</h1>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => router.push('/dashboard/student')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/dashboard/student')}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="glass-effect p-6 rounded-xl">
            <h1 className="text-3xl font-bold text-white mb-2">My Project Assignments</h1>
            <p className="text-gray-300">View and manage your submitted project assignments stored in your "Project Assignment" collection</p>
            
            {/* Filter Controls */}
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                All ({projectAssignments.length})
              </button>
              <button
                onClick={() => setFilter('graded')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'graded' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Graded ({projectAssignments.filter(a => a.isGraded).length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'pending' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Pending ({projectAssignments.filter(a => !a.isGraded).length})
              </button>
            </div>
          </div>
        </div>

        {/* Project Assignments Grid */}
        {filteredAssignments.length === 0 ? (
          <div className="glass-effect p-8 rounded-xl text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Project Assignments</h3>
            <p className="text-gray-400">
              {filter === 'all' 
                ? "You haven't submitted any project assignments yet."
                : filter === 'graded'
                ? "No graded project assignments found."
                : "No pending project assignments found."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="glass-effect p-6 rounded-xl hover:scale-[1.02] transition-transform">
                {/* Assignment Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{assignment.assignmentTitle}</h3>
                    <p className="text-blue-400 text-sm">{assignment.moduleTitle}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    assignment.isGraded 
                      ? 'bg-green-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}>
                    {assignment.isGraded ? 'Graded' : 'Pending'}
                  </div>
                </div>

                {/* Assignment Details */}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Submitted:</span>
                      <p className="text-white">
                        {new Date(assignment.submittedAt.seconds * 1000 || assignment.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Max Score:</span>
                      <p className="text-white">{assignment.maxScore} points</p>
                    </div>
                  </div>

                  {/* File Information */}
                  {assignment.fileUrl && (
                    <div className="bg-slate-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-blue-400 font-medium">Uploaded File</span>
                      </div>
                      <p className="text-white text-sm">{assignment.fileName || 'Unknown file'}</p>
                      {assignment.fileSize > 0 && (
                        <p className="text-gray-400 text-xs">Size: {formatFileSize(assignment.fileSize)}</p>
                      )}
                      <a 
                        href={assignment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        View File
                      </a>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {assignment.aiAnalysis && (
                    <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-purple-400 font-medium">🤖 AI Analysis</span>
                      </div>
                      <p className="text-purple-300 text-sm">
                        Progress: {assignment.aiProgressPercentage || assignment.aiAnalysis.progressPercentage}%
                      </p>
                      {assignment.aiAnalysis.overallFeedback && (
                        <p className="text-gray-300 text-sm mt-1">
                          {assignment.aiAnalysis.overallFeedback}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submission Text */}
                  {assignment.submissionText && (
                    <div>
                      <span className="text-gray-400 text-sm">Submission:</span>
                      <div className="bg-slate-800 p-3 rounded-lg mt-1 max-h-24 overflow-y-auto">
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">
                          {assignment.submissionText.length > 150 
                            ? assignment.submissionText.substring(0, 150) + '...' 
                            : assignment.submissionText
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Grading Information */}
                {assignment.isGraded && (
                  <div className="border-t border-slate-600 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Final Grade:</span>
                      <span className="text-green-400 font-bold text-lg">
                        {assignment.finalGrade} / {assignment.maxScore}
                      </span>
                    </div>
                    
                    {assignment.aiGrade && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">AI Grade:</span>
                        <span className="text-purple-400">
                          {assignment.aiGrade} / {assignment.maxScore}
                        </span>
                      </div>
                    )}
                    
                    {assignment.educatorFeedback && (
                      <div className="mt-3">
                        <span className="text-gray-400 text-sm">Educator Feedback:</span>
                        <div className="bg-slate-800 p-3 rounded-lg mt-1">
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">
                            {assignment.educatorFeedback}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-gray-400 text-xs mt-2">
                      Graded on: {new Date(assignment.gradedAt.seconds * 1000 || assignment.gradedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
