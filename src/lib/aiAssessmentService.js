// lib/aiAssessmentService.js
import { adminDb } from './firebaseAdmin';

/**
 * AI Assessment Service - Simulates AI grading with realistic random scores
 * This service provides automatic assessment functionality that generates
 * random but realistic progress values to simulate AI analysis
 */
export class AIAssessmentService {
  
  /**
   * Generate AI-powered assessment results for student work
   * @param {Object} params - Assessment parameters
   * @param {string} params.studentId - Student's Firebase UID
   * @param {string} params.moduleId - Module ID
   * @param {string} params.assignmentId - Assignment ID
   * @param {string} params.submissionText - Student's text submission
   * @param {string} params.fileUrl - URL of uploaded PDF file
   * @param {string} params.fileName - Name of uploaded file
   * @returns {Object} AI assessment results
   */
  static async generateAIAssessment({
    studentId,
    moduleId, 
    assignmentId,
    submissionText = '',
    fileUrl = null,
    fileName = null
  }) {
    try {
      console.log('🤖 Generating AI assessment for student:', studentId);
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      // Generate realistic random progress (60-95%)
      const progressPercentage = Math.floor(Math.random() * 36) + 60; // 60-95%
      
      // Generate realistic feedback based on score ranges
      const feedback = this.generateFeedbackByScore(progressPercentage);
      
      // Create assessment result
      const assessmentResult = {
        studentId,
        moduleId,
        assignmentId,
        progressPercentage,
        overallFeedback: feedback.overall,
        completedComponents: feedback.completed,
        missingComponents: feedback.missing,
        suggestions: feedback.suggestions,
        analysisMetadata: {
          hasSubmissionText: submissionText.length > 0,
          hasUploadedFile: fileUrl !== null,
          fileName,
          fileUrl,
          wordCount: submissionText.split(' ').length,
          analysisDate: new Date().toISOString(),
          aiModel: 'SimulatedAI-v1.0',
          confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to Firebase
      const assessmentRef = adminDb.collection('ai_assessments').doc();
      assessmentResult.id = assessmentRef.id;
      await assessmentRef.set(assessmentResult);
      
      console.log('✅ AI assessment generated:', {
        id: assessmentResult.id,
        progress: progressPercentage
      });
      
      return {
        success: true,
        data: assessmentResult
      };
      
    } catch (error) {
      console.error('❌ Error generating AI assessment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate contextual feedback based on score
   * @param {number} score - Progress score (0-100)
   * @returns {Object} Feedback object with different components
   */
  static generateFeedbackByScore(score) {
    const feedbackTemplates = {
      excellent: {
        overall: "Outstanding work! Your submission demonstrates excellent understanding and thorough completion of the assignment requirements.",
        completed: [
          "All major components addressed comprehensively",
          "Excellent structure and organization",
          "Clear demonstration of understanding",
          "Professional presentation quality",
          "Strong analytical thinking evident"
        ],
        missing: [],
        suggestions: [
          "Consider exploring advanced applications of these concepts",
          "Great foundation for building more complex projects",
          "Share your approach with classmates as a best practice example"
        ]
      },
      good: {
        overall: "Good work! Your submission shows solid understanding with most requirements met effectively.",
        completed: [
          "Main assignment components completed",
          "Good structure and logical flow",
          "Demonstrates understanding of key concepts",
          "Meets most technical requirements"
        ],
        missing: [
          "Some minor details could be expanded"
        ],
        suggestions: [
          "Add more detailed explanations in some sections",
          "Consider including additional examples or evidence",
          "Review formatting and presentation standards"
        ]
      },
      satisfactory: {
        overall: "Satisfactory progress! You've completed the basic requirements but there's room for improvement in several areas.",
        completed: [
          "Basic assignment structure present",
          "Key concepts partially addressed",
          "Shows effort and engagement"
        ],
        missing: [
          "Some required components incomplete",
          "Limited depth in analysis",
          "Could benefit from more examples"
        ],
        suggestions: [
          "Expand on key concepts with more detail",
          "Include more supporting evidence or examples", 
          "Review assignment requirements checklist",
          "Consider seeking additional help during office hours"
        ]
      },
      developing: {
        overall: "Your work shows effort, but significant improvements are needed to meet the assignment standards.",
        completed: [
          "Attempt made at basic structure",
          "Some understanding demonstrated"
        ],
        missing: [
          "Major components incomplete or missing",
          "Limited demonstration of understanding",
          "Insufficient detail and analysis",
          "May not meet minimum requirements"
        ],
        suggestions: [
          "Review assignment instructions carefully",
          "Seek help from instructor or teaching assistants",
          "Consider attending study groups or tutoring sessions",
          "Allocate more time for research and development",
          "Focus on understanding core concepts first"
        ]
      }
    };
    
    if (score >= 90) return feedbackTemplates.excellent;
    if (score >= 80) return feedbackTemplates.good;
    if (score >= 70) return feedbackTemplates.satisfactory;
    return feedbackTemplates.developing;
  }
  
  /**
   * Retrieve existing AI assessment
   * @param {string} studentId - Student's Firebase UID
   * @param {string} moduleId - Module ID
   * @param {string} assignmentId - Assignment ID
   * @returns {Object|null} Existing assessment or null
   */
  static async getAIAssessment(studentId, moduleId, assignmentId) {
    try {
      const snapshot = await adminDb.collection('ai_assessments')
        .where('studentId', '==', studentId)
        .where('moduleId', '==', moduleId)
        .where('assignmentId', '==', assignmentId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting AI assessment:', error);
      return null;
    }
  }
  
  /**
   * Update existing AI assessment
   * @param {string} assessmentId - Assessment ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated assessment
   */
  static async updateAIAssessment(assessmentId, updateData) {
    try {
      const assessmentRef = adminDb.collection('ai_assessments').doc(assessmentId);
      
      await assessmentRef.update({
        ...updateData,
        updatedAt: new Date()
      });
      
      const updatedDoc = await assessmentRef.get();
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      };
    } catch (error) {
      console.error('Error updating AI assessment:', error);
      throw error;
    }
  }
  
  /**
   * Generate progress entry for Firebase student_progress collection
   * @param {Object} aiAssessment - AI assessment data
   * @returns {Object} Progress data for Firebase
   */
  static generateProgressData(aiAssessment) {
    return {
      studentId: aiAssessment.studentId,
      moduleId: aiAssessment.moduleId,
      assignmentId: aiAssessment.assignmentId,
      assessmentType: 'assignment',
      score: aiAssessment.progressPercentage, // Use progress percentage as score
      maxScore: 100,
      status: 'completed',
      feedback: aiAssessment.overallFeedback,
      aiGenerated: true,
      aiAssessmentId: aiAssessment.id,
      progressPercentage: aiAssessment.progressPercentage,
      completedAt: new Date(),
      gradedBy: 'AI_SYSTEM',
      graderName: 'AI Assessment Engine',
      gradedAt: new Date()
    };
  }
}

export default AIAssessmentService;