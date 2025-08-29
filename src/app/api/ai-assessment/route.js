// app/api/ai-assessment/route.js
import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import AIAssessmentService from '@/lib/aiAssessmentService';
import ModuleService from '@/lib/moduleService';

// POST /api/ai-assessment - Generate AI assessment for student work
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student']);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const requestData = await request.json();
    const {
      moduleId,
      assignmentId,
      submissionText = '',
      fileUrl = null,
      fileName = null
    } = requestData;

    // Validate required fields
    if (!moduleId || !assignmentId) {
      return NextResponse.json({
        success: false,
        error: 'moduleId and assignmentId are required'
      }, { status: 400 });
    }

    console.log('🤖 Processing AI assessment request:', {
      studentId: user.uid,
      moduleId,
      assignmentId,
      hasSubmission: submissionText.length > 0,
      hasFile: !!fileUrl
    });

    // Check if student has submission text or uploaded file
    if (!submissionText.trim() && !fileUrl) {
      return NextResponse.json({
        success: false,
        error: 'Either submission text or uploaded file is required for AI assessment'
      }, { status: 400 });
    }

    // Generate AI assessment
    const assessmentResult = await AIAssessmentService.generateAIAssessment({
      studentId: user.uid,
      moduleId,
      assignmentId,
      submissionText,
      fileUrl,
      fileName
    });

    if (!assessmentResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate AI assessment: ' + assessmentResult.error
      }, { status: 500 });
    }

    console.log('✅ AI assessment generated successfully:', {
      assessmentId: assessmentResult.data.id,
      progress: assessmentResult.data.progressPercentage,
      grade: assessmentResult.data.aiGrade
    });

    // Record progress in student_progress collection
    try {
      const progressData = AIAssessmentService.generateProgressData(assessmentResult.data);
      const savedProgress = await ModuleService.recordStudentProgress(progressData);
      
      console.log('📊 Progress recorded to Firebase:', savedProgress.id);
      
      // Add progress reference to assessment result
      assessmentResult.data.progressId = savedProgress.id;
    } catch (progressError) {
      console.error('❌ Error recording progress:', progressError);
      // Continue without failing the request - assessment was successful
    }

    return NextResponse.json({
      success: true,
      data: {
        assessment: assessmentResult.data,
        message: 'AI assessment completed successfully'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error in AI assessment endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during AI assessment'
    }, { status: 500 });
  }
}

// GET /api/ai-assessment - Get existing AI assessment
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student', 'educator', 'admin']);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId') || user.uid;

    // Students can only access their own assessments
    if (user.role === 'student' && studentId !== user.uid) {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 });
    }

    if (!moduleId || !assignmentId) {
      return NextResponse.json({
        success: false,
        error: 'moduleId and assignmentId are required'
      }, { status: 400 });
    }

    console.log('🔍 Fetching AI assessment:', { studentId, moduleId, assignmentId });

    const assessment = await AIAssessmentService.getAIAssessment(studentId, moduleId, assignmentId);

    if (!assessment) {
      return NextResponse.json({
        success: false,
        error: 'No AI assessment found for this assignment'
      }, { status: 404 });
    }

    console.log('✅ AI assessment found:', assessment.id);

    return NextResponse.json({
      success: true,
      data: assessment
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching AI assessment:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PATCH /api/ai-assessment - Update AI assessment
export async function PATCH(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student']);
    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const requestData = await request.json();
    const { assessmentId, ...updateData } = requestData;

    if (!assessmentId) {
      return NextResponse.json({
        success: false,
        error: 'assessmentId is required'
      }, { status: 400 });
    }

    console.log('🔄 Updating AI assessment:', assessmentId);

    // First get the assessment to verify ownership
    const existingAssessment = await AIAssessmentService.getAIAssessment(
      user.uid, 
      updateData.moduleId, 
      updateData.assignmentId
    );

    if (!existingAssessment || existingAssessment.id !== assessmentId) {
      return NextResponse.json({
        success: false,
        error: 'Assessment not found or access denied'
      }, { status: 404 });
    }

    const updatedAssessment = await AIAssessmentService.updateAIAssessment(assessmentId, {
      ...updateData,
      studentId: user.uid // Ensure student can't change ownership
    });

    console.log('✅ AI assessment updated:', assessmentId);

    return NextResponse.json({
      success: true,
      data: updatedAssessment
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error updating AI assessment:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}