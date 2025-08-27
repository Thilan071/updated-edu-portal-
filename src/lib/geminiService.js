import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Analyze student work against assessment criteria
   * @param {Object} params - Analysis parameters
   * @param {string} params.studentWork - The student's submitted work (text, code, etc.)
   * @param {string} params.assessmentCriteria - The assessment rubric/criteria
   * @param {string} params.assignmentTitle - Title of the assignment
   * @param {string} params.assignmentDescription - Description of the assignment
   * @param {Array} params.uploadedFiles - Array of uploaded file URLs (optional)
   * @returns {Object} Analysis result with progress percentage and feedback
   */
  async analyzeStudentWork(params) {
    try {
      const {
        studentWork,
        assessmentCriteria,
        assignmentTitle,
        assignmentDescription,
        uploadedFiles = []
      } = params;

      // Construct the analysis prompt
      const prompt = this.buildAnalysisPrompt({
        studentWork,
        assessmentCriteria,
        assignmentTitle,
        assignmentDescription,
        uploadedFiles
      });

      // Generate analysis using Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      // Parse the structured response
      return this.parseAnalysisResponse(analysisText);

    } catch (error) {
      console.error('Error analyzing student work with Gemini:', error);
      throw new Error('Failed to analyze student work');
    }
  }

  /**
   * Build the analysis prompt for Gemini
   */
  buildAnalysisPrompt(params) {
    const {
      studentWork,
      assessmentCriteria,
      assignmentTitle,
      assignmentDescription,
      uploadedFiles
    } = params;

    let fileInfo = '';
    if (uploadedFiles.length > 0) {
      fileInfo = `\n\nUploaded Files: ${uploadedFiles.length} file(s) submitted`;
    }

    return `
You are an educational AI assistant helping to evaluate student work progress. Please analyze the following student submission and provide a detailed assessment.

**Assignment Details:**
Title: ${assignmentTitle}
Description: ${assignmentDescription}

**Assessment Criteria:**
${assessmentCriteria}

**Student's Current Work:**
${studentWork || 'No text submission provided'}
${fileInfo}

**Instructions:**
Please evaluate this student's work and provide your response in the following JSON format:

{
  "progressPercentage": [number between 0-100],
  "overallFeedback": "[Brief overall assessment]",
  "completedAspects": [
    "[List of completed requirements]"
  ],
  "missingAspects": [
    "[List of missing or incomplete requirements]"
  ],
  "suggestions": [
    "[Specific suggestions for improvement]"
  ],
  "nextSteps": [
    "[Recommended next steps to complete the assignment]"
  ],
  "qualityAssessment": {
    "strengths": ["[List of strengths in the current work]"],
    "areasForImprovement": ["[Areas that need improvement]"]
  }
}

**Evaluation Criteria:**
1. Assess completion percentage based on how much of the required work is present
2. Consider the quality of work submitted so far
3. Evaluate alignment with the assessment criteria
4. Provide constructive, specific feedback
5. Be encouraging while being honest about areas needing improvement

Please respond ONLY with the JSON object, no additional text.
`;
  }

  /**
   * Parse Gemini's analysis response
   */
  parseAnalysisResponse(analysisText) {
    try {
      // Clean the response text to extract JSON
      let cleanedText = analysisText.trim();
      
      // Remove any markdown code block markers
      cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // Parse the JSON response
      const analysis = JSON.parse(cleanedText);
      
      // Validate the response structure
      if (!this.validateAnalysisResponse(analysis)) {
        throw new Error('Invalid analysis response structure');
      }
      
      return {
        success: true,
        data: analysis
      };
      
    } catch (error) {
      console.error('Error parsing Gemini analysis response:', error);
      
      // Return a fallback response
      return {
        success: false,
        data: {
          progressPercentage: 50,
          overallFeedback: 'Unable to analyze work automatically. Please review manually.',
          completedAspects: ['Work submitted for review'],
          missingAspects: ['Automatic analysis unavailable'],
          suggestions: ['Please review your work against the assignment criteria'],
          nextSteps: ['Continue working on the assignment requirements'],
          qualityAssessment: {
            strengths: ['Submission provided'],
            areasForImprovement: ['Manual review recommended']
          }
        }
      };
    }
  }

  /**
   * Validate the structure of Gemini's analysis response
   */
  validateAnalysisResponse(analysis) {
    const requiredFields = [
      'progressPercentage',
      'overallFeedback',
      'completedAspects',
      'missingAspects',
      'suggestions',
      'nextSteps',
      'qualityAssessment'
    ];
    
    // Check if all required fields are present
    for (const field of requiredFields) {
      if (!(field in analysis)) {
        return false;
      }
    }
    
    // Validate progress percentage
    if (typeof analysis.progressPercentage !== 'number' || 
        analysis.progressPercentage < 0 || 
        analysis.progressPercentage > 100) {
      return false;
    }
    
    // Validate arrays
    const arrayFields = ['completedAspects', 'missingAspects', 'suggestions', 'nextSteps'];
    for (const field of arrayFields) {
      if (!Array.isArray(analysis[field])) {
        return false;
      }
    }
    
    // Validate quality assessment structure
    if (!analysis.qualityAssessment || 
        !Array.isArray(analysis.qualityAssessment.strengths) ||
        !Array.isArray(analysis.qualityAssessment.areasForImprovement)) {
      return false;
    }
    
    return true;
  }

  /**
   * Generate assessment criteria from assignment description
   * @param {string} assignmentDescription - The assignment description
   * @returns {string} Generated assessment criteria
   */
  async generateAssessmentCriteria(assignmentDescription) {
    try {
      const prompt = `
Based on the following assignment description, generate a comprehensive assessment criteria/rubric that can be used to evaluate student work.

Assignment Description:
${assignmentDescription}

Please provide assessment criteria that includes:
1. Key requirements and deliverables
2. Quality standards
3. Evaluation points
4. Success indicators

Format the response as a clear, structured rubric that can be used for evaluation.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      console.error('Error generating assessment criteria:', error);
      return 'Standard assessment criteria: Completeness, accuracy, clarity, and adherence to requirements.';
    }
  }
}

export default new GeminiService();