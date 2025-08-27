'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import { Bot, FileText, Eye, Download, CheckCircle, RefreshCw, Search, Filter, Calendar, User, BookOpen, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const NavIcon = ({ children }) => (
  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mr-3">
    {children}
  </div>
);

export default function AIMarkingToolPage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grading, setGrading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [batchGrading, setBatchGrading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user) {
      fetchSubmissions();
    }
  }, [session]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filter !== 'all') params.append('status', filter);
      
      const response = await fetch(`/api/educator/submissions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAIGrading = async (submissionId) => {
    try {
      setGrading(true);
      await apiClient.submissionsAPI.gradeWithAI(submissionId);
      alert('AI grading completed successfully!');
      fetchSubmissions(); // Refresh submissions
    } catch (err) {
      console.error('Error grading submission:', err);
      alert('Failed to grade submission: ' + err.message);
    } finally {
      setGrading(false);
    }
  };

  const handleBatchAIGrading = async () => {
    if (selectedSubmissions.length === 0) {
      alert('Please select submissions to grade');
      return;
    }

    try {
      setBatchGrading(true);
      const promises = selectedSubmissions.map(id => 
        apiClient.submissionsAPI.gradeWithAI(id)
      );
      await Promise.all(promises);
      alert(`Successfully graded ${selectedSubmissions.length} submissions!`);
      setSelectedSubmissions([]);
      fetchSubmissions();
    } catch (err) {
      console.error('Error batch grading:', err);
      alert('Failed to complete batch grading: ' + err.message);
    } finally {
      setBatchGrading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-500';
      case 'ai_graded': return 'bg-purple-500';
      case 'graded': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'submitted': return 'Pending AI Review';
      case 'ai_graded': return 'AI Graded';
      case 'graded': return 'Final Graded';
      default: return 'Unknown';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesFilter = (() => {
      if (filter === 'all') return true;
      if (filter === 'pending') return submission.status === 'submitted';
      if (filter === 'ai_graded') return submission.status === 'ai_graded';
      if (filter === 'needs_review') return submission.status === 'ai_graded' && (!submission.aiConfidence || submission.aiConfidence < 0.7);
      return true;
    })();

    const matchesSearch = searchTerm === '' || 
      submission.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.assignment?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.module?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const formatDate = (date) => {
    if (!date) return 'Not available';
    return new Date(date.seconds ? date.seconds * 1000 : date).toLocaleDateString();
  };

  const toggleSubmissionSelection = (submissionId) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredSubmissions.map(s => s.id);
    setSelectedSubmissions(visibleIds);
  };

  const clearSelection = () => {
    setSelectedSubmissions([]);
  };

  if (!session) {
    return (
      <div className="main-font flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to access the AI Marking Tool.</p>
      </div>
    );
  }

  return (
    <div className="main-font min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/educator/assessments" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Assessments
          </Link>
          <h1 className="text-4xl font-bold text-white header-font mb-2">
            AI Marking Tool
          </h1>
          <p className="text-gray-300">
            Automated grading and analysis for student submissions
          </p>
        </div>

        {/* Controls */}
        <div className={`glass-effect-dark rounded-2xl p-6 mb-6 transform transition-all duration-300
          ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-400 focus:outline-none w-full sm:w-64"
                />
              </div>

              {/* Filter */}
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-400 focus:outline-none"
              >
                <option value="all">All Submissions</option>
                <option value="pending">Pending AI Review</option>
                <option value="ai_graded">AI Graded</option>
                <option value="needs_review">Needs Manual Review</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {selectedSubmissions.length > 0 && (
                <>
                  <button
                    onClick={handleBatchAIGrading}
                    disabled={batchGrading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Bot className="w-4 h-4" />
                    {batchGrading ? 'Grading...' : `Grade ${selectedSubmissions.length} Selected`}
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Clear Selection
                  </button>
                </>
              )}
              <button
                onClick={selectAllVisible}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Select All Visible
              </button>
              <button
                onClick={fetchSubmissions}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6 transform transition-all duration-300
          ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
          style={{ animationDelay: '0.2s' }}
        >
          <div className="glass-effect-dark rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Submissions</p>
                <p className="text-2xl font-bold text-white">{submissions.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending AI Review</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {submissions.filter(s => s.status === 'submitted').length}
                </p>
              </div>
              <Bot className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">AI Graded</p>
                <p className="text-2xl font-bold text-purple-400">
                  {submissions.filter(s => s.status === 'ai_graded').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Final Graded</p>
                <p className="text-2xl font-bold text-green-400">
                  {submissions.filter(s => s.status === 'graded').length}
                </p>
              </div>
              <Star className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Needs Manual Review</p>
                <p className="text-2xl font-bold text-red-400">
                  {submissions.filter(s => s.status === 'ai_graded' && (!s.aiConfidence || s.aiConfidence < 0.7)).length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">AI Processing</p>
                <p className="text-2xl font-bold text-orange-400">
                  {submissions.filter(s => s.aiProgress === 'processing').length}
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">AI Completed</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {submissions.filter(s => s.aiProgress === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <div className="glass-effect-dark rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">AI Failed</p>
                <p className="text-2xl font-bold text-rose-400">
                  {submissions.filter(s => s.aiProgress === 'failed').length}
                </p>
              </div>
              <Bot className="w-8 h-8 text-rose-400" />
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className={`glass-effect-dark rounded-2xl p-6 transform transition-all duration-300
          ${isMounted ? 'card-animated' : 'opacity-0 scale-95'}`}
          style={{ animationDelay: '0.3s' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center text-white header-font">
              <NavIcon><Bot className="text-purple-400" /></NavIcon>
              Submissions for AI Review
            </h2>
            <p className="text-gray-400">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading submissions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={fetchSubmissions}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No submissions found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Selection Checkbox */}
                    <div className="flex items-center pt-1">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.includes(submission.id)}
                        onChange={() => toggleSubmissionSelection(submission.id)}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                      />
                    </div>

                    {/* Submission Info */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {submission.assignment?.title || 'Unknown Assignment'}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(submission.status)}`}>
                              {getStatusText(submission.status)}
                            </span>
                            {submission.aiConfidence && (
                              <span className={`text-xs font-medium ${getConfidenceColor(submission.aiConfidence)}`}>
                                Confidence: {(submission.aiConfidence * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-300">
                            <p><strong>Student:</strong> {submission.student?.firstName} {submission.student?.lastName}</p>
                            <p><strong>Module:</strong> {submission.module?.title || 'Unknown Module'}</p>
                            <p><strong>Submitted:</strong> {formatDate(submission.submittedAt)}</p>
                            <p><strong>Type:</strong> {submission.submissionType || 'Unknown'}</p>
                            <p><strong>AI Progress:</strong> 
                              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                submission.aiProgress === 'completed' ? 'bg-green-600 text-white' :
                                submission.aiProgress === 'processing' ? 'bg-yellow-600 text-white' :
                                submission.aiProgress === 'failed' ? 'bg-red-600 text-white' :
                                'bg-gray-600 text-white'
                              }`}>
                                {submission.aiProgress || 'pending'}
                              </span>
                            </p>
                            <p><strong>File Location:</strong> 
                              {submission.fileLocation ? (
                                <a href={submission.fileLocation} target="_blank" rel="noopener noreferrer" 
                                   className="text-blue-400 hover:text-blue-300 ml-1">
                                  📎 View File
                                </a>
                              ) : (
                                <span className="text-gray-500 ml-1">No file</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {/* Grades */}
                        <div className="flex flex-col gap-2 text-right">
                          {submission.aiGrade !== undefined && submission.aiGrade !== null && (
                            <div>
                              <p className="text-sm text-gray-400">AI Grade</p>
                              <p className="text-lg font-bold text-purple-400">{submission.aiGrade}%</p>
                            </div>
                          )}
                          {submission.finalGrade !== undefined && submission.finalGrade !== null && (
                            <div>
                              <p className="text-sm text-gray-400">Final Grade</p>
                              <p className="text-lg font-bold text-green-400">{submission.finalGrade}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* AI Analysis Preview */}
                      {submission.aiAnalysis && (
                        <div className="bg-gray-900 p-3 rounded-lg mb-3">
                          <p className="text-sm text-gray-400 mb-1">AI Analysis:</p>
                          <p className="text-sm text-gray-300 line-clamp-2">
                            {submission.aiAnalysis.substring(0, 200)}...
                          </p>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/educator/submissions/${submission.id}`}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Link>
                          {submission.fileUrl && (
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-1 text-sm"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {submission.status === 'submitted' && (
                            <button
                              onClick={() => handleAIGrading(submission.id)}
                              disabled={grading}
                              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1 text-sm disabled:opacity-50"
                            >
                              <Bot className="w-4 h-4" />
                              {grading ? 'Grading...' : 'AI Grade'}
                            </button>
                          )}
                          {submission.status === 'ai_graded' && (
                            <Link
                              href={`/dashboard/educator/submissions/${submission.id}/review`}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Review & Confirm
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}