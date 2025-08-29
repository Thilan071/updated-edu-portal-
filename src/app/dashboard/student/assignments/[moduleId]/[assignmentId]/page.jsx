'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import apiClient, { assignmentTemplateAPI, moduleAPI, progressAPI } from '@/lib/apiClient';
import { uploadFile } from '@/lib/storageUtils';

export default function AssignmentDetail() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const { moduleId, assignmentId } = params;

  const [assignment, setAssignment] = useState(null);
  const [module, setModule] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState('');
  const [fileUpload, setFileUpload] = useState(null);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchAssignmentData();
      fetchPreviousAIAnalysis();
    }
  }, [status, session, moduleId, assignmentId]);

  const fetchPreviousAIAnalysis = async () => {
    try {
      const aiResponse = await apiClient.aiAssessmentAPI.get({
        assignmentId,
        moduleId
      });
      
      if (aiResponse.success && aiResponse.data) {
        setAiAnalysis(aiResponse.data.analysisResult);
      }
    } catch (aiError) {
      // AI analysis not found or error - this is okay
      console.log('No previous AI analysis found');
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', assignmentId);
    formData.append('moduleId', moduleId);
    formData.append('type', 'self-assessment');
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.fileUrl;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
    return null;
  };

  const analyzeWithAI = async (uploadedFile = null) => {
    setAiAnalyzing(true);
    try {
      // Prepare uploaded files array
      const uploadedFiles = [];
      
      // Handle file upload if provided
      if (uploadedFile) {
        const uploadedUrl = await uploadFileToStorage(uploadedFile);
        if (uploadedUrl) {
          uploadedFiles.push(uploadedUrl);
        }
      }

      const analysisData = {
        assignmentId,
        moduleId,
        studentWork: submission,
        uploadedFiles,
        assessmentCriteria: assignment?.description || ''
      };

      const response = await apiClient.aiAssessmentAPI.analyze(analysisData);
      
      if (response.success) {
        const analysis = response.data.analysis;
        setAiAnalysis(analysis);
        
        // Show AI analysis results
        setShowAiAnalysis(true);
        
        // Automatically save the AI analysis progress to student assessment module
        try {
          await apiClient.selfAssessmentAPI.update({
            assignmentId,
            moduleId,
            progressPercentage: analysis.progressPercentage,
            workUploaded: true,
            notes: `AI Analysis: ${analysis.overallFeedback}`,
            fileUrl: uploadedFiles[0] || null,
            aiAnalysis: analysis
          });
        } catch (error) {
          console.error('Error saving AI analysis to assessment:', error);
        }
        
        setShowAiAnalysis(true);
        
        // Show different messages based on how analysis was triggered
        if (uploadedFile) {
          alert(`AI analysis completed! Progress assessed at ${analysis.progressPercentage}% and saved to your assessment.`);
        } else {
          alert('AI analysis completed! Your progress has been automatically assessed and saved.');
        }
      } else {
        alert('Failed to analyze work with AI. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      alert('Error analyzing work. Please try again.');
    } finally {
      setAiAnalyzing(false);
    }
  };



  const fetchAssignmentData = async () => {
    try {
      setLoading(true);
      
      // Fetch assignment details
      const assignmentResponse = await assignmentTemplateAPI.getById(moduleId, assignmentId);
      setAssignment(assignmentResponse.assignmentTemplate);

      // Fetch module details
      const moduleResponse = await moduleAPI.getById(moduleId);
      setModule(moduleResponse.module);

      // Fetch student progress for this assignment
      const progressResponse = await progressAPI.get({ moduleId });
      const assignmentProgress = progressResponse.progress?.find(p => p.assignmentId === assignmentId);
      setProgress(assignmentProgress);

    } catch (error) {
      console.error('Error fetching assignment data:', error);
      setError('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmission = async () => {
    if (!submission.trim() && !fileUpload) {
      alert('Please provide a submission or upload a file');
      return;
    }

    try {
      setSubmitting(true);
      
      let fileUrl = null;
      let fileName = '';
      let fileSize = 0;
      
      if (fileUpload) {
        fileUrl = await uploadFileToStorage(fileUpload);
        fileName = fileUpload.name;
        fileSize = fileUpload.size;
      }
      
      // Create project assignment submission
      const projectAssignmentData = {
        assignmentId,
        moduleId,
        submissionText: submission.trim(),
        fileUrl: fileUrl,
        fileName: fileName,
        fileSize: fileSize,
        aiAnalysis: aiAnalysis // Include AI analysis if available
      };

      // Submit as project assignment in user's subcollection
      const response = await fetch('/api/project-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectAssignmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit project assignment');
      }

      const result = await response.json();
      
      // Update student progress to mark assignment as completed
      try {
        await apiClient.progressAPI.update({
          moduleId,
          assignmentId,
          status: 'submitted',
          submittedAt: new Date(),
          submission: submission.trim(),
          fileUrl: fileUrl,
          projectAssignmentId: result.projectAssignmentId
        });
      } catch (progressError) {
        console.error('Error updating progress:', progressError);
      }
      
      alert('Project assignment submitted successfully! Your submission has been saved in your "Project Assignment" subcollection. Redirecting to assessments...');
      
      // Redirect to assessments page after successful submission
      setTimeout(() => {
        router.push('/dashboard/student/assessments');
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting project assignment:', error);
      alert('Failed to submit project assignment: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadFileToStorage = async (file) => {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `submissions/${session.user.uid}/${moduleId}/${assignmentId}/${fileName}`;
      
      const downloadURL = await uploadFile(file, storagePath);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileUpload(file);
      setWorkUploaded(true);
      
      // Automatically trigger AI analysis when file is uploaded
      if (file.type === 'application/pdf') {
        await analyzeWithAI(file);
      }
    }
  };



  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to view this assignment.</p>
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
            onClick={() => router.push('/dashboard/student/assessments')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Assignment Not Found</h1>
          <p className="mb-4">The requested assignment could not be found.</p>
          <button 
            onClick={() => router.push('/dashboard/student/assessments')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  const isSubmitted = progress && progress.status === 'submitted';
  const isOverdue = new Date() > new Date(assignment.dueDate);

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/dashboard/student/assessments')}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Assessments
          </button>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{assignment.title}</h1>
                <p className="text-gray-300">{module?.title || 'Loading module...'}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  isSubmitted ? 'bg-green-500 text-white' : 
                  isOverdue ? 'bg-red-500 text-white' : 
                  'bg-orange-500 text-white'
                }`}>
                  {isSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : 'Active'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Due Date:</span>
                <p className="text-white font-semibold">
                  {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Max Score:</span>
                <p className="text-white font-semibold">{assignment.maxScore || 100} points</p>
              </div>
              <div>
                <span className="text-gray-400">Type:</span>
                <p className="text-white font-semibold capitalize">{assignment.type || 'Assignment'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Description */}
        <div className="glass-effect p-6 rounded-xl mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Assignment Description</h2>
          <div className="text-gray-300 whitespace-pre-wrap">
            {assignment.description || assignment.instructions || 'No description provided.'}
          </div>
        </div>

        {/* Assessment PDF Display */}
        {assignment.pdfInfo && assignment.pdfInfo.filePath && (
          <div className="glass-effect p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold text-white mb-4">📄 Assessment Materials</h2>
            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-white font-semibold">{assignment.pdfInfo.fileName}</h3>
                  <p className="text-gray-400 text-sm">
                    Uploaded: {new Date(assignment.pdfInfo.uploadedAt).toLocaleDateString()}
                    {assignment.pdfInfo.fileSize && (
                      <span className="ml-2">• Size: {(assignment.pdfInfo.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    )}
                    <span className="ml-2">• Stored securely in Firebase</span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <a
                    href={assignment.pdfInfo.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View PDF
                  </a>
                  <a
                    href={assignment.pdfInfo.filePath}
                    download={assignment.pdfInfo.fileName}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </a>
                </div>
                
                {/* PDF Preview Frame */}
                <div className="border border-slate-600 rounded-lg overflow-hidden">
                  <iframe
                    src={assignment.pdfInfo.filePath}
                    className="w-full h-96"
                    title="Assessment PDF Preview"
                    style={{
                      border: 'none',
                      background: '#1e293b'
                    }}
                  >
                    <p className="text-gray-400 p-4">
                      Your browser does not support PDF preview. 
                      <a href={assignment.pdfInfo.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                        Click here to view the PDF
                      </a>
                    </p>
                  </iframe>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  🔒 This document is securely stored in Firebase Storage and accessible only to enrolled students.
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Project Assignment Submission Section */}
        {!isSubmitted && !isOverdue && (
          <div className="glass-effect p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Submit Project Assignment</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Written Submission</label>
                <textarea
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                  placeholder="Enter your assignment submission here..."
                  className="w-full h-40 p-4 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">
                  Upload Work (PDF) - AI Analysis Included
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                {fileUpload && (
                  <div className="mt-2 space-y-2">
                    <p className="text-green-400">Selected: {fileUpload.name}</p>
                    {aiAnalyzing && (
                      <div className="flex items-center gap-2 text-purple-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                        <span>Analyzing with AI...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {aiAnalysis && showAiAnalysis && (
                <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                      🤖 AI Analysis Results
                    </h4>
                    <button
                      onClick={() => setShowAiAnalysis(false)}
                      className="text-purple-400 hover:text-purple-300 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-purple-300">Progress Assessment: </span>
                      <span className="text-white font-bold">{aiAnalysis.progressPercentage}%</span>
                    </div>
                    
                    <div>
                      <span className="font-medium text-purple-300">Overall Feedback: </span>
                      <p className="text-gray-200 mt-1">{aiAnalysis.overallFeedback}</p>
                    </div>
                    
                    {aiAnalysis.completedComponents && aiAnalysis.completedComponents.length > 0 && (
                      <div>
                        <span className="font-medium text-green-400">✅ Completed Components:</span>
                        <ul className="list-disc list-inside text-green-300 mt-1 ml-4">
                          {aiAnalysis.completedComponents.map((component, index) => (
                            <li key={index}>{component}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {aiAnalysis.missingComponents && aiAnalysis.missingComponents.length > 0 && (
                      <div>
                        <span className="font-medium text-red-400">❌ Missing Components:</span>
                        <ul className="list-disc list-inside text-red-300 mt-1 ml-4">
                          {aiAnalysis.missingComponents.map((component, index) => (
                            <li key={index}>{component}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                      <div>
                        <span className="font-medium text-blue-400">💡 Suggestions for Improvement:</span>
                        <ul className="list-disc list-inside text-blue-300 mt-1 ml-4">
                          {aiAnalysis.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <button
                onClick={handleSubmission}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                {submitting ? 'Submitting Project Assignment...' : 'Submit Project Assignment'}
              </button>
            </div>
          </div>
        )}

        {/* Submission Results */}
        {isSubmitted && progress && (
          <div className="glass-effect p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Submission Details</h2>
            
            <div className="space-y-4">
              <div>
                <span className="text-gray-400">Submitted:</span>
                <p className="text-white">
                  {new Date(progress.submittedAt).toLocaleString()}
                </p>
              </div>
              
              {progress.score !== undefined && (
                <div>
                  <span className="text-gray-400">Score:</span>
                  <p className="text-white font-semibold">
                    {progress.score} / {assignment.maxScore || 100}
                  </p>
                </div>
              )}
              
              {progress.feedback && (
                <div>
                  <span className="text-gray-400">Feedback:</span>
                  <p className="text-white whitespace-pre-wrap">{progress.feedback}</p>
                </div>
              )}
              
              {progress.submission && (
                <div>
                  <span className="text-gray-400">Your Submission:</span>
                  <div className="bg-slate-800 p-4 rounded-lg mt-2">
                    <p className="text-gray-300 whitespace-pre-wrap">{progress.submission}</p>
                  </div>
                </div>
              )}
              

              
              {progress.workUploaded !== undefined && (
                <div>
                  <span className="text-gray-400">Work Upload Status:</span>
                  <p className={`font-semibold ${progress.workUploaded ? 'text-green-400' : 'text-orange-400'}`}>
                    {progress.workUploaded ? 'All work uploaded' : 'Partial upload'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overdue Message */}
        {isOverdue && !isSubmitted && (
          <div className="glass-effect p-6 rounded-xl border-l-4 border-red-500">
            <h2 className="text-xl font-bold text-red-400 mb-2">Assignment Overdue</h2>
            <p className="text-gray-300">
              This assignment was due on {new Date(assignment.dueDate).toLocaleDateString()}. 
              Please contact your instructor if you need to submit late.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}