import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from './firebaseAdmin';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

class GeminiGradingService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Grade student submission against reference solution using Gemini AI
   * @param {Object} params - Grading parameters
   * @param {string} params.studentSubmission - Student's submitted work
   * @param {string} params.referenceSolution - Educator's reference solution
   * @param {string} params.assignmentTitle - Assignment title
   * @param {string} params.assignmentDescription - Assignment description
   * @param {string} params.gradingCriteria - Specific grading criteria
   * @param {number} params.maxScore - Maximum possible score
   * @param {string} params.studentFileUrl - URL to student's file (optional)
   * @param {string} params.referenceFileUrl - URL to reference file (optional)
   * @returns {Object} Grading result with score, feedback, and detailed analysis
   */
  async gradeSubmission(params) {
    try {
      const {
        studentSubmission,
        referenceSolution,
        assignmentTitle,
        assignmentDescription,
        gradingCriteria,
        maxScore = 100,
        studentFileUrl = '',
        referenceFileUrl = ''
      } = params;

      console.log('🤖 Grading submission with Gemini AI...');

      // Build comprehensive grading prompt
      const prompt = this.buildGradingPrompt({
        studentSubmission,
        referenceSolution,
        assignmentTitle,
        assignmentDescription,
        gradingCriteria,
        maxScore,
        studentFileUrl,
        referenceFileUrl
      });

      // Generate grading using Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const gradingText = response.text();

      console.log('✅ Gemini grading completed');

      // Parse the structured response
      return this.parseGradingResponse(gradingText, maxScore);

    } catch (error) {
      console.error('❌ Error grading submission with Gemini:', error);
      throw new Error('Failed to grade submission with AI');
    }
  }

  /**
   * Build comprehensive grading prompt for Gemini
   */
  buildGradingPrompt(params) {
    const {
      studentSubmission,
      referenceSolution,
      assignmentTitle,
      assignmentDescription,
      gradingCriteria,
      maxScore,
      studentFileUrl,
      referenceFileUrl
    } = params;

    const fileSection = this.buildFileSection(studentFileUrl, referenceFileUrl);

    return `
You are an expert educational AI assistant tasked with grading student assignments. You will compare the student's submission against the reference solution provided by the educator and assign a fair, detailed grade.

**ASSIGNMENT DETAILS:**
Title: ${assignmentTitle}
Description: ${assignmentDescription}
Maximum Score: ${maxScore} points

**GRADING CRITERIA:**
${gradingCriteria || 'Standard academic grading criteria: correctness, completeness, clarity, methodology, and presentation.'}

**REFERENCE SOLUTION (Educator's Model Answer):**
${referenceSolution || 'No reference solution provided - grade based on assignment requirements.'}

**STUDENT SUBMISSION:**
${studentSubmission || 'No text submission provided.'}

${fileSection}

**GRADING INSTRUCTIONS:**
1. Compare the student's work against the reference solution
2. Evaluate based on the grading criteria provided
3. Consider both correctness and approach/methodology
4. Be fair and constructive in your assessment
5. Provide specific examples and feedback
6. Assign a numerical score out of ${maxScore}

**RESPONSE FORMAT:**
Please provide your grading response in the following JSON format:

{
  "score": [numerical score out of ${maxScore}],
  "percentage": [percentage score 0-100],
  "grade": "[Letter grade: A+, A, A-, B+, B, B-, C+, C, C-, D, F]",
  "overallFeedback": "[2-3 sentence overall assessment]",
  "detailedAnalysis": {
    "correctness": {
      "score": [score for correctness],
      "feedback": "[detailed feedback on correctness]"
    },
    "completeness": {
      "score": [score for completeness], 
      "feedback": "[detailed feedback on completeness]"
    },
    "methodology": {
      "score": [score for approach/methodology],
      "feedback": "[detailed feedback on methodology]"
    },
    "presentation": {
      "score": [score for presentation/clarity],
      "feedback": "[detailed feedback on presentation]"
    }
  },
  "comparisonWithReference": {
    "similarities": ["[List key similarities with reference solution]"],
    "differences": ["[List key differences from reference solution]"],
    "improvements": ["[Suggest improvements based on reference]"]
  },
  "strengths": ["[List specific strengths in student's work]"],
  "areasForImprovement": ["[List specific areas needing improvement]"],
  "specificFeedback": ["[Detailed, actionable feedback points]"],
  "recommendations": ["[Recommendations for future assignments]"],
  "confidence": [0.0-1.0 confidence level in this grading],
  "rubricBreakdown": {
    "criteria1": {"score": [score], "comment": "[comment]"},
    "criteria2": {"score": [score], "comment": "[comment]"},
    "criteria3": {"score": [score], "comment": "[comment]"}
  }
}

**GRADING STANDARDS:**
- A (90-100%): Exceptional work that meets or exceeds all requirements
- B (80-89%): Good work with minor issues or missing elements
- C (70-79%): Satisfactory work that meets basic requirements
- D (60-69%): Below average work with significant issues
- F (0-59%): Failing work that doesn't meet minimum requirements

Please respond ONLY with the JSON object, no additional text.
`;
  }

  /**
   * Build file section for prompt if files are present
   */
  buildFileSection(studentFileUrl, referenceFileUrl) {
    let fileSection = '';
    
    if (referenceFileUrl) {
      fileSection += `\n**REFERENCE FILE:** ${referenceFileUrl}`;
    }
    
    if (studentFileUrl) {
      fileSection += `\n**STUDENT FILE:** ${studentFileUrl}`;
    }
    
    if (fileSection) {
      fileSection = `\n**FILES SUBMITTED:**${fileSection}\n(Note: Evaluate based on file content if accessible, otherwise focus on text submissions)`;
    }
    
    return fileSection;
  }

  /**
   * Parse Gemini's grading response
   */
  parseGradingResponse(gradingText, maxScore) {
    try {
      // Clean the response text to extract JSON
      let cleanedText = gradingText.trim();
      
      // Remove any markdown code block markers
      cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // Parse the JSON response
      const grading = JSON.parse(cleanedText);
      
      // Validate and normalize the response
      const normalizedGrading = this.normalizeGradingResponse(grading, maxScore);
      
      return {
        success: true,
        data: normalizedGrading
      };
      
    } catch (error) {
      console.error('Error parsing Gemini grading response:', error);
      console.log('Raw response:', gradingText);
      
      // Return a fallback response
      return {
        success: false,
        data: this.createFallbackGrading(maxScore),
        error: 'Failed to parse AI grading response'
      };
    }
  }

  /**
   * Normalize and validate grading response
   */
  normalizeGradingResponse(grading, maxScore) {
    // Ensure score is within valid range
    const score = Math.max(0, Math.min(maxScore, grading.score || 0));
    const percentage = Math.round((score / maxScore) * 100);
    
    // Generate letter grade based on percentage
    const letterGrade = this.calculateLetterGrade(percentage);
    
    return {
      score: score,
      percentage: percentage,
      grade: grading.grade || letterGrade,
      overallFeedback: grading.overallFeedback || 'Submission has been graded.',
      detailedAnalysis: grading.detailedAnalysis || {
        correctness: { score: score * 0.4, feedback: 'Evaluated for correctness' },
        completeness: { score: score * 0.3, feedback: 'Evaluated for completeness' },
        methodology: { score: score * 0.2, feedback: 'Evaluated for methodology' },
        presentation: { score: score * 0.1, feedback: 'Evaluated for presentation' }
      },
      comparisonWithReference: grading.comparisonWithReference || {
        similarities: ['Compared against reference solution'],
        differences: ['Differences noted'],
        improvements: ['Improvements suggested']
      },
      strengths: grading.strengths || ['Submission completed'],
      areasForImprovement: grading.areasForImprovement || ['Continue improving'],
      specificFeedback: grading.specificFeedback || ['Good effort on the assignment'],
      recommendations: grading.recommendations || ['Keep practicing'],
      confidence: grading.confidence || 0.8,
      rubricBreakdown: grading.rubricBreakdown || {
        overall: { score: score, comment: 'Overall assessment' }
      },
      gradedAt: new Date(),
      gradingMethod: 'gemini_ai_comparison'
    };
  }

  /**
   * Calculate letter grade from percentage
   */
  calculateLetterGrade(percentage) {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * Create fallback grading when AI parsing fails
   */
  createFallbackGrading(maxScore) {
    const fallbackScore = Math.round(maxScore * 0.7); // Give 70% as fallback
    return {
      score: fallbackScore,
      percentage: 70,
      grade: 'C',
      overallFeedback: 'Assignment graded automatically. Manual review recommended.',
      detailedAnalysis: {
        correctness: { score: fallbackScore * 0.4, feedback: 'Automatic grading - please review' },
        completeness: { score: fallbackScore * 0.3, feedback: 'Automatic grading - please review' },
        methodology: { score: fallbackScore * 0.2, feedback: 'Automatic grading - please review' },
        presentation: { score: fallbackScore * 0.1, feedback: 'Automatic grading - please review' }
      },
      comparisonWithReference: {
        similarities: ['Automatic comparison performed'],
        differences: ['Manual review recommended'],
        improvements: ['Please review manually for detailed feedback']
      },
      strengths: ['Submission provided'],
      areasForImprovement: ['Manual review needed'],
      specificFeedback: ['AI grading encountered an issue - manual review recommended'],
      recommendations: ['Educator should review this submission manually'],
      confidence: 0.5,
      rubricBreakdown: {
        overall: { score: fallbackScore, comment: 'Fallback grading applied' }
      },
      gradedAt: new Date(),
      gradingMethod: 'gemini_ai_fallback'
    };
  }

  /**
   * Grade multiple submissions in batch
   */
  async gradeBatch(submissions, referenceSolution, gradingParams) {
    const results = [];
    
    for (const submission of submissions) {
      try {
        const result = await this.gradeSubmission({
          ...gradingParams,
          studentSubmission: submission.submissionText,
          studentFileUrl: submission.fileUrl,
          referenceSolution
        });
        
        results.push({
          submissionId: submission.id,
          studentId: submission.studentId,
          grading: result.data,
          success: result.success
        });
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error grading submission ${submission.id}:`, error);
        results.push({
          submissionId: submission.id,
          studentId: submission.studentId,
          grading: this.createFallbackGrading(gradingParams.maxScore),
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

export default new GeminiGradingService();
