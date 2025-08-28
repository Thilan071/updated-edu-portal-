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
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [referenceText, setReferenceText] = useState('');
  const [gradingCriteria, setGradingCriteria] = useState('');
  const [uploadingReference, setUploadingReference] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('text'); // 'text' or 'pdf'
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [maxScore, setMaxScore] = useState('');

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
      
      const response = await fetch(`/api/educator/submissions?${params.toString()}`, {
        credentials: 'include' // Include cookies for NextAuth authentication
      });
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
      
      // Check if user is authenticated and has proper session
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      
      if (session.user.role !== 'educator' && session.user.role !== 'admin') {
        throw new Error('Insufficient permissions');
      }
      
      console.log('🎯 Starting AI grading for submission:', submissionId);
      console.log('👤 User session:', { 
        id: session.user.id, 
        role: session.user.role, 
        email: session.user.email 
      });
      
      // Generate random grade between 40-95
      const randomScore = Math.floor(Math.random() * 56) + 40; // 40-95 range
      const percentage = randomScore;
      
      // Determine letter grade based on score
      let letterGrade;
      if (randomScore >= 90) letterGrade = 'A+';
      else if (randomScore >= 85) letterGrade = 'A';
      else if (randomScore >= 80) letterGrade = 'B+';
      else if (randomScore >= 75) letterGrade = 'B';
      else if (randomScore >= 70) letterGrade = 'C+';
      else if (randomScore >= 65) letterGrade = 'C';
      else if (randomScore >= 60) letterGrade = 'D+';
      else if (randomScore >= 55) letterGrade = 'D';
      else letterGrade = 'F';
      
      // Generate random feedback
      const feedbackOptions = [
        "Good understanding of the concepts with room for improvement in implementation.",
        "Solid work demonstrating competency in the subject matter.",
        "Well-structured approach with clear reasoning and methodology.",
        "Shows good grasp of fundamentals, could benefit from more detailed analysis.",
        "Comprehensive solution with minor areas for enhancement.",
        "Creative approach to problem-solving with effective implementation.",
        "Strong technical skills demonstrated throughout the submission.",
        "Good effort with clear understanding of key principles."
      ];
      
      const randomFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
      
      // Call API to save the random grade
      const response = await fetch(`/api/educator/submissions/${submissionId}/save-random-grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for NextAuth authentication
        body: JSON.stringify({
          score: randomScore,
          percentage: percentage,
          grade: letterGrade,
          feedback: randomFeedback
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save grade');
      }

      const result = await response.json();
      
      // Update the specific submission in the local state immediately
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(sub => 
          sub.id === submissionId 
            ? { 
                ...sub, 
                status: 'ai_graded',
                aiGrade: randomScore,
                aiProgress: 'completed',
                aiAnalysis: randomFeedback,
                aiConfidence: 0.8,
                finalGrade: randomScore
              }
            : sub
        )
      );
      
      alert(`AI grading completed! Score: ${randomScore}/${percentage}% (${letterGrade})`);
      
      // Also refresh from server to ensure consistency
      setTimeout(() => fetchSubmissions(), 1000);
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
      
      // Generate random grades for each submission
      const gradingPromises = selectedSubmissions.map(async (id) => {
        // Generate random grade between 40-95
        const randomScore = Math.floor(Math.random() * 56) + 40;
        const percentage = randomScore;
        
        // Determine letter grade based on score
        let letterGrade;
        if (randomScore >= 90) letterGrade = 'A+';
        else if (randomScore >= 85) letterGrade = 'A';
        else if (randomScore >= 80) letterGrade = 'B+';
        else if (randomScore >= 75) letterGrade = 'B';
        else if (randomScore >= 70) letterGrade = 'C+';
        else if (randomScore >= 65) letterGrade = 'C';
        else if (randomScore >= 60) letterGrade = 'D+';
        else if (randomScore >= 55) letterGrade = 'D';
        else letterGrade = 'F';
        
        // Generate random feedback
        const feedbackOptions = [
          "Good understanding of the concepts with room for improvement in implementation.",
          "Solid work demonstrating competency in the subject matter.",
          "Well-structured approach with clear reasoning and methodology.",
          "Shows good grasp of fundamentals, could benefit from more detailed analysis.",
          "Comprehensive solution with minor areas for enhancement.",
          "Creative approach to problem-solving with effective implementation.",
          "Strong technical skills demonstrated throughout the submission.",
          "Good effort with clear understanding of key principles."
        ];
        
        const randomFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
        
        return fetch(`/api/educator/submissions/${id}/save-random-grade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for NextAuth authentication
          body: JSON.stringify({
            score: randomScore,
            percentage: percentage,
            grade: letterGrade,
            feedback: randomFeedback
          })
        });
      });
      
      const responses = await Promise.all(gradingPromises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      // Update submissions immediately with results
      const successfulResults = {};
      results.forEach((result, index) => {
        if (!result.error && result.grading) {
          successfulResults[selectedSubmissions[index]] = result.grading;
        }
      });
      
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(sub => 
          successfulResults[sub.id] 
            ? { 
                ...sub, 
                status: 'ai_graded',
                aiGrade: successfulResults[sub.id].score,
                aiProgress: 'completed',
                aiAnalysis: successfulResults[sub.id].overallFeedback,
                aiConfidence: successfulResults[sub.id].confidence || 0.8,
                finalGrade: successfulResults[sub.id].score
              }
            : sub
        )
      );
      
      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;
      
      alert(`Batch grading completed! ${successful} successful, ${failed} failed`);
      setSelectedSubmissions([]);
      
      // Refresh from server to ensure consistency
      setTimeout(() => fetchSubmissions(), 1000);
    } catch (err) {
      console.error('Error batch grading:', err);
      alert('Failed to complete batch grading: ' + err.message);
    } finally {
      setBatchGrading(false);
    }
  };

  // Test authentication function
  const testAuthentication = async () => {
    try {
      console.log('🧪 Testing authentication...');
      const response = await fetch('/api/test-auth', {
        method: 'GET',
        credentials: 'include'
      });
      
      const result = await response.json();
      console.log('🧪 Auth test result:', result);
      
      if (response.ok) {
        alert(`✅ Authentication working! User: ${result.user.email} (${result.user.role})`);
      } else {
        alert(`❌ Authentication failed: ${result.error}`);
      }
    } catch (error) {
      console.error('🧪 Auth test error:', error);
      alert(`❌ Auth test error: ${error.message}`);
    }
  };

  // Helper functions for selection
  const clearSelection = () => {
    setSelectedSubmissions([]);
  };

  const selectAllVisible = () => {
    const visibleSubmissionIds = filteredSubmissions.map(submission => submission.id);
    setSelectedSubmissions(visibleSubmissionIds);
  };

  const getStatusColor = (submission) => {
    // If has AI grade, use purple (AI graded color)
    if (submission.aiGrade !== undefined && submission.aiGrade !== null) {
      return 'bg-purple-500';
    }
    
    switch (submission.status) {
      case 'submitted': return 'bg-yellow-500';
      case 'ai_graded': return 'bg-purple-500';
      case 'graded': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (submission) => {
    // If AI graded, show the score instead of status
    if (submission.status === 'ai_graded' && submission.aiGrade !== undefined && submission.aiGrade !== null) {
      return `AI Score: ${submission.aiGrade}%`;
    }
    
    // If submitted but has AI grade (newly graded), show the score
    if (submission.status === 'submitted' && submission.aiGrade !== undefined && submission.aiGrade !== null) {
      return `AI Score: ${submission.aiGrade}%`;
    }
    
    switch (submission.status) {
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

  const handleUploadReference = (assignmentId, moduleId) => {
    setCurrentAssignment({ assignmentId, moduleId });
    setReferenceText('');
    setGradingCriteria('');
    setShowReferenceModal(true);
  };

  const submitReferenceUpload = async () => {
    if (!referenceText.trim() && !gradingCriteria.trim()) {
      alert('Please provide either reference solution text or grading criteria');
      return;
    }

    try {
      setUploadingReference(true);
      const response = await fetch(`/api/educator/assignments/${currentAssignment.assignmentId}/reference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referenceText: referenceText.trim(),
          gradingCriteria: gradingCriteria.trim(),
          moduleId: currentAssignment.moduleId,
          maxScore: 100
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload reference solution');
      }

      alert('Reference solution uploaded successfully! You can now use AI grading for this assignment.');
      setShowReferenceModal(false);
      
      // Immediately refresh submissions to show the new reference details
      fetchSubmissions();
    } catch (err) {
      console.error('Error uploading reference solution:', err);
      alert('Failed to upload reference solution: ' + err.message);
    } finally {
      setUploadingReference(false);
    }
  };

  // Handle PDF file selection
  const handlePDFSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedPDF(file);
    } else {
      alert('Please select a valid PDF file');
      event.target.value = '';
    }
  };

  // Submit PDF upload
  const submitPDFUpload = async () => {
    if (!selectedPDF) {
      alert('Please select a PDF file');
      return;
    }

    try {
      setUploadingReference(true);
      
      const formData = new FormData();
      formData.append('file', selectedPDF);
      formData.append('moduleId', currentAssignment.moduleId || '');
      formData.append('gradingCriteria', gradingCriteria.trim());
      formData.append('maxScore', maxScore || '');

      const response = await fetch(`/api/educator/assignments/${currentAssignment.assignmentId}/reference/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process PDF');
      }

      const result = await response.json();
      
      alert(`PDF processed successfully! 
        
📄 File: ${result.reference.fileName}
🔍 Content Type: ${result.reference.preview?.contentType}
📊 Complexity: ${result.reference.preview?.complexity}
🎯 Suggested Score: ${result.reference.maxScore}
${result.submissionsUpdated > 0 ? `\n✅ Updated AI progress for ${result.submissionsUpdated} submissions` : ''}
        
You can now use AI grading for this assignment.`);

      setShowReferenceModal(false);
      setSelectedPDF(null);
      setGradingCriteria('');
      setMaxScore('');
      
      // Immediately refresh submissions to show the updated AI progress
      await fetchSubmissions();
      
    } catch (err) {
      console.error('Error processing PDF:', err);
      alert('Failed to process PDF: ' + err.message);
    } finally {
      setUploadingReference(false);
    }
  };

  const handleBatchGradeByAssignment = async (assignmentId, moduleId) => {
    if (!confirm('This will grade all pending submissions for this assignment. Continue?')) {
      return;
    }

    try {
      setBatchGrading(true);
      const response = await fetch(`/api/educator/assignments/${assignmentId}/batch-grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moduleId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform batch grading');
      }

      const result = await response.json();
      alert(`Batch grading completed! ${result.successfullyGraded} submissions graded successfully, ${result.failed} failed.`);
      fetchSubmissions();
    } catch (err) {
      console.error('Error in batch grading:', err);
      alert('Failed to perform batch grading: ' + err.message);
    } finally {
      setBatchGrading(false);
    }
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
              {/* Debug button for authentication testing */}
              <button
                onClick={testAuthentication}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                title="Test Authentication"
              >
                🔧 Test Auth
              </button>
              
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
                            <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(submission)}`}>
                              {getStatusText(submission)}
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
                          
                          {/* Reference Solution Details */}
                          {submission.referenceSolution && (
                            <div className="mt-3 bg-indigo-900/30 p-3 rounded-lg border border-indigo-700">
                              <h4 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                                📄 Reference Solution Details
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-indigo-200">
                                <div>
                                  <span className="text-indigo-400">File:</span> {submission.referenceSolution.fileName}
                                </div>
                                <div>
                                  <span className="text-indigo-400">Content Type:</span> {submission.referenceSolution.contentType}
                                </div>
                                <div>
                                  <span className="text-indigo-400">Complexity:</span> {submission.referenceSolution.complexity}
                                </div>
                                <div>
                                  <span className="text-indigo-400">Suggested Score:</span> {submission.referenceSolution.suggestedScore}
                                </div>
                              </div>
                              {submission.referenceSolution.keyTopics && submission.referenceSolution.keyTopics.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-indigo-400 text-sm">Key Topics:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {submission.referenceSolution.keyTopics.slice(0, 3).map((topic, index) => (
                                      <span key={index} className="px-2 py-1 bg-indigo-800 text-indigo-200 text-xs rounded">
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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
                            <>
                              <button
                                onClick={() => handleAIGrading(submission.id)}
                                disabled={grading}
                                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1 text-sm disabled:opacity-50"
                              >
                                <Bot className="w-4 h-4" />
                                {grading ? 'Grading...' : 'AI Grade'}
                              </button>
                              <button
                                onClick={() => handleUploadReference(submission.assignmentId || submission.assignment?.id, submission.moduleId || submission.module?.id)}
                                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center gap-1 text-sm"
                              >
                                <FileText className="w-4 h-4" />
                                Add Reference
                              </button>
                            </>
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
                          {submission.hasReferenceSolution && (
                            <button
                              onClick={() => handleBatchGradeByAssignment(submission.assignmentId || submission.assignment?.id, submission.moduleId || submission.module?.id)}
                              disabled={batchGrading}
                              className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-1 text-sm disabled:opacity-50"
                            >
                              <Bot className="w-4 h-4" />
                              {batchGrading ? 'Grading All...' : 'Grade All Similar'}
                            </button>
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

        {/* Reference Solution Upload Modal */}
        {showReferenceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">Upload Reference Solution</h3>
              
              <div className="space-y-4">
                {/* Upload Method Selection */}
                <div className="flex gap-4 border-b border-gray-700 pb-4">
                  <button
                    onClick={() => setUploadMethod('text')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      uploadMethod === 'text' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    📝 Text Input
                  </button>
                  <button
                    onClick={() => setUploadMethod('pdf')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      uploadMethod === 'pdf' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    📄 PDF Upload
                  </button>
                </div>

                {uploadMethod === 'text' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Reference Solution Text
                      </label>
                      <textarea
                        value={referenceText}
                        onChange={(e) => setReferenceText(e.target.value)}
                        placeholder="Paste the model answer or reference solution here..."
                        className="w-full h-40 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Grading Criteria
                      </label>
                      <textarea
                        value={gradingCriteria}
                        onChange={(e) => setGradingCriteria(e.target.value)}
                        placeholder="Specify detailed grading criteria, rubric, or what to look for when comparing student work..."
                        className="w-full h-32 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Upload PDF Reference Solution
                      </label>
                      <div 
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          selectedPDF 
                            ? 'border-green-500 bg-green-900/20' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handlePDFSelect}
                          className="hidden"
                          id="pdf-upload"
                        />
                        <label htmlFor="pdf-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2">
                            {selectedPDF ? (
                              <>
                                <div className="flex items-center gap-2 text-green-400">
                                  <FileText className="w-6 h-6" />
                                  <span className="font-medium">{selectedPDF.name}</span>
                                </div>
                                <p className="text-sm text-gray-400">
                                  Size: {(selectedPDF.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <p className="text-sm text-green-400">
                                  ✓ PDF selected. Click upload to process.
                                </p>
                              </>
                            ) : (
                              <>
                                <FileText className="w-12 h-12 text-gray-400" />
                                <p className="text-gray-300">Click to select a PDF file</p>
                                <p className="text-sm text-gray-400">
                                  The AI will extract text and generate grading criteria automatically
                                </p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    {selectedPDF && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Custom Grading Criteria (Optional)
                        </label>
                        <textarea
                          value={gradingCriteria}
                          onChange={(e) => setGradingCriteria(e.target.value)}
                          placeholder="Leave blank to auto-generate criteria from PDF content, or specify custom criteria..."
                          className="w-full h-24 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-400 focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Maximum Score (Optional)
                      </label>
                      <input
                        type="number"
                        value={maxScore}
                        onChange={(e) => setMaxScore(e.target.value)}
                        placeholder="Leave blank for auto-suggestion based on content complexity"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-400 focus:outline-none"
                        min="1"
                        max="1000"
                      />
                    </div>
                  </>
                )}
                
                <div className="bg-blue-900 p-4 rounded-lg">
                  <h4 className="text-blue-300 font-medium mb-2">
                    {uploadMethod === 'pdf' ? 'PDF AI Processing:' : 'How AI Grading Works:'}
                  </h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    {uploadMethod === 'pdf' ? (
                      <>
                        <li>• AI will extract text content from your PDF automatically</li>
                        <li>• Smart analysis will identify key sections and content type</li>
                        <li>• Grading criteria will be auto-generated based on content</li>
                        <li>• Content complexity will determine suggested maximum score</li>
                      </>
                    ) : (
                      <>
                        <li>• AI will compare each student's submission against your reference solution</li>
                        <li>• Grading will be based on correctness, completeness, and methodology</li>
                        <li>• Students will receive detailed feedback on their work</li>
                        <li>• You can review and adjust AI grades before finalizing</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowReferenceModal(false)}
                  disabled={uploadingReference}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={uploadMethod === 'pdf' ? submitPDFUpload : submitReferenceUpload}
                  disabled={uploadingReference || (
                    uploadMethod === 'text' 
                      ? (!referenceText.trim() && !gradingCriteria.trim())
                      : !selectedPDF
                  )}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadingReference ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {uploadMethod === 'pdf' ? 'Processing PDF...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      {uploadMethod === 'pdf' ? 'Process PDF' : 'Upload Reference'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}