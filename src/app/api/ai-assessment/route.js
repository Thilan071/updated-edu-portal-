import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import GeminiService from '../../../lib/geminiService';
import ModuleService from '../../../lib/moduleService';

/**
 * GET - Analyze student work using Gemini AI
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Ensure user is a student
    if (session.user.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can request AI assessment' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      assignmentId,
      moduleId,
      studentWork,
      uploadedFiles = [],
      assessmentCriteria
    } = body;

    // Validate required fields
    if (!assignmentId || !moduleId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: assignmentId, moduleId' },
        { status: 400 }
      );
    }

    const studentId = session.user.id;

    // Get assignment details
    const assignment = await ModuleService.getAssignmentTemplate(assignmentId);
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Generate assessment criteria if not provided
    let criteria = assessmentCriteria;
    if (!criteria && assignment.description) {
      criteria = await GeminiService.generateAssessmentCriteria(assignment.description);
    }

    // Prepare analysis parameters
    const analysisParams = {
      studentWork: studentWork || '',
      assessmentCriteria: criteria || 'Standard assessment criteria: Completeness, accuracy, clarity, and adherence to requirements.',
      assignmentTitle: assignment.title || 'Assignment',
      assignmentDescription: assignment.description || '',
      uploadedFiles
    };

    // Analyze work with Gemini
    const analysisResult = await GeminiService.analyzeStudentWork(analysisParams);

    if (!analysisResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to analyze work', details: analysisResult.data },
        { status: 500 }
      );
    }

    // Store the AI analysis result
    const aiAssessmentData = {
      studentId,
      assignmentId,
      moduleId,
      analysisResult: analysisResult.data,
      studentWork,
      uploadedFiles,
      assessmentCriteria: criteria,
      analyzedAt: new Date()
    };

    // Save AI assessment to database
    await ModuleService.saveAIAssessment(aiAssessmentData);

    // Update self-assessment with AI-suggested progress
    const selfAssessmentData = {
      progressPercentage: analysisResult.data.progressPercentage,
      workUploaded: uploadedFiles.length > 0 || (studentWork && studentWork.trim().length > 0),
      notes: `AI Analysis: ${analysisResult.data.overallFeedback}`,
      fileUrl: uploadedFiles.length > 0 ? uploadedFiles[0] : '',
      aiGenerated: true
    };

    await ModuleService.updateStudentSelfAssessment(
      studentId,
      moduleId,
      assignmentId,
      selfAssessmentData
    );

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisResult.data,
        suggestedProgress: analysisResult.data.progressPercentage,
        selfAssessmentUpdated: true
      }
    });

  } catch (error) {
    console.error('Error in AI assessment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve previous AI assessment
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const moduleId = searchParams.get('moduleId');

    if (!assignmentId || !moduleId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: assignmentId, moduleId' },
        { status: 400 }
      );
    }

    const studentId = session.user.id;

    // Get previous AI assessment
    const aiAssessment = await ModuleService.getAIAssessment(studentId, moduleId, assignmentId);

    if (!aiAssessment) {
      return NextResponse.json(
        { success: false, error: 'No AI assessment found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: aiAssessment
    });

  } catch (error) {
    console.error('Error retrieving AI assessment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}