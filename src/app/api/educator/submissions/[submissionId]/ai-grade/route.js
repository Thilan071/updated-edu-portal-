import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';
import geminiGradingService from '@/lib/geminiGradingService';

// POST /api/educator/submissions/[submissionId]/ai-grade - Grade submission using AI with reference solution
export async function POST(request, { params }) {
  try {
    const authResult = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user;

    const { submissionId } = await params;
    
    console.log('🤖 Starting AI grading for submission:', submissionId);

    // Get submission details
    const submissionDoc = await adminDb.collection('submissions').doc(submissionId).get();
    
    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submissionData = submissionDoc.data();
    
    // Check authorization
    if (user.role === 'educator' && submissionData.educatorId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get assignment details
    let assignmentDoc;
    if (submissionData.moduleId) {
      assignmentDoc = await adminDb.collection('modules').doc(submissionData.moduleId)
        .collection('assignment_templates').doc(submissionData.assignmentId).get();
    } else {
      assignmentDoc = await adminDb.collection('assignment_templates').doc(submissionData.assignmentId).get();
    }

    if (!assignmentDoc.exists) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignmentData = assignmentDoc.data();

    // Get reference solution for this assignment
    const referencesSnapshot = await adminDb.collection('assignment_references')
      .where('assignmentId', '==', submissionData.assignmentId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    let referenceSolution = '';
    let gradingCriteria = '';
    let maxScore = assignmentData.maxScore || 100;

    if (!referencesSnapshot.empty) {
      const referenceData = referencesSnapshot.docs[0].data();
      referenceSolution = referenceData.referenceText || '';
      gradingCriteria = referenceData.gradingCriteria || '';
      maxScore = referenceData.maxScore || maxScore;
      
      console.log('✅ Found reference solution for assignment');
    } else {
      console.log('⚠️ No reference solution found, using assignment description');
      // If no reference solution, use assignment description as criteria
      gradingCriteria = assignmentData.description || 'Standard grading criteria';
    }

    // Prepare grading parameters
    const gradingParams = {
      studentSubmission: submissionData.submissionText || submissionData.submission || '',
      referenceSolution: referenceSolution,
      assignmentTitle: assignmentData.title || 'Assignment',
      assignmentDescription: assignmentData.description || '',
      gradingCriteria: gradingCriteria,
      maxScore: maxScore,
      studentFileUrl: submissionData.fileUrl || submissionData.fileLocation || '',
      referenceFileUrl: referencesSnapshot.empty ? '' : referencesSnapshot.docs[0].data().referenceFileUrl || ''
    };

    console.log('📊 Grading with parameters:', {
      hasReferenceSolution: !!referenceSolution,
      hasGradingCriteria: !!gradingCriteria,
      maxScore: maxScore
    });

    // Grade the submission using Gemini AI
    const gradingResult = await geminiGradingService.gradeSubmission(gradingParams);

    if (!gradingResult.success) {
      return NextResponse.json({ 
        error: 'AI grading failed',
        details: gradingResult.error 
      }, { status: 500 });
    }

    const aiGrading = gradingResult.data;

    // Update submission with AI grading
    const updateData = {
      aiGrade: aiGrading.score,
      aiPercentage: aiGrading.percentage,
      aiLetterGrade: aiGrading.grade,
      aiOverallFeedback: aiGrading.overallFeedback,
      aiDetailedAnalysis: aiGrading.detailedAnalysis,
      aiComparisonWithReference: aiGrading.comparisonWithReference,
      aiStrengths: aiGrading.strengths,
      aiAreasForImprovement: aiGrading.areasForImprovement,
      aiSpecificFeedback: aiGrading.specificFeedback,
      aiRecommendations: aiGrading.recommendations,
      aiConfidence: aiGrading.confidence,
      aiRubricBreakdown: aiGrading.rubricBreakdown,
      aiGradedAt: new Date(),
      aiGradedBy: user.uid,
      aiGradingMethod: aiGrading.gradingMethod || 'gemini_ai_comparison',
      hasReferenceSolution: !!referenceSolution,
      status: 'ai_graded',
      updatedAt: new Date()
    };

    // Update main submission
    await adminDb.collection('submissions').doc(submissionId).update(updateData);

    // Update student's submission copy if it exists
    try {
      const studentSubmissionDoc = await adminDb.collection('users')
        .doc(submissionData.studentId)
        .collection('submissions')
        .doc(submissionId)
        .get();

      if (studentSubmissionDoc.exists) {
        await adminDb.collection('users')
          .doc(submissionData.studentId)
          .collection('submissions')
          .doc(submissionId)
          .update(updateData);
      }
    } catch (studentUpdateError) {
      console.error('Error updating student submission copy:', studentUpdateError);
    }

    // If this is a project assignment, update the project assignment record too
    if (submissionData.submissionType === 'project_assignment' && submissionData.projectAssignmentId) {
      try {
        await adminDb.collection('users')
          .doc(submissionData.studentId)
          .collection('Project Assignment')
          .doc(submissionData.projectAssignmentId)
          .update({
            ...updateData,
            finalGrade: aiGrading.score, // Set as final grade for project assignments
            isGraded: true,
            gradedAt: new Date(),
            gradedBy: user.uid
          });
      } catch (projectUpdateError) {
        console.error('Error updating project assignment:', projectUpdateError);
      }
    }

    console.log('✅ AI grading completed successfully');

    return NextResponse.json({
      message: 'Submission graded successfully with AI',
      submissionId: submissionId,
      grading: {
        score: aiGrading.score,
        percentage: aiGrading.percentage,
        grade: aiGrading.grade,
        overallFeedback: aiGrading.overallFeedback,
        confidence: aiGrading.confidence,
        hasReferenceSolution: !!referenceSolution
      },
      submission: {
        id: submissionId,
        ...submissionData,
        ...updateData
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error in AI grading:', error);
    return NextResponse.json({ 
      error: 'Failed to grade submission with AI',
      details: error.message 
    }, { status: 500 });
  }
}

// GET /api/educator/submissions/[submissionId]/ai-grade - Get AI grading details
export async function GET(request, { params }) {
  try {
    const authResult = await authenticateAPIRequest(request, ['educator', 'admin', 'student']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user;

    const { submissionId } = await params;

    // Get submission with AI grading details
    const submissionDoc = await adminDb.collection('submissions').doc(submissionId).get();
    
    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submissionData = submissionDoc.data();
    
    // Check authorization
    if (user.role === 'educator' && submissionData.educatorId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (user.role === 'student' && submissionData.studentId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Extract AI grading information
    const aiGrading = {
      score: submissionData.aiGrade,
      percentage: submissionData.aiPercentage,
      grade: submissionData.aiLetterGrade,
      overallFeedback: submissionData.aiOverallFeedback,
      detailedAnalysis: submissionData.aiDetailedAnalysis,
      comparisonWithReference: submissionData.aiComparisonWithReference,
      strengths: submissionData.aiStrengths,
      areasForImprovement: submissionData.aiAreasForImprovement,
      specificFeedback: submissionData.aiSpecificFeedback,
      recommendations: submissionData.aiRecommendations,
      confidence: submissionData.aiConfidence,
      rubricBreakdown: submissionData.aiRubricBreakdown,
      gradedAt: submissionData.aiGradedAt?.toDate?.()?.toISOString() || submissionData.aiGradedAt,
      gradedBy: submissionData.aiGradedBy,
      gradingMethod: submissionData.aiGradingMethod,
      hasReferenceSolution: submissionData.hasReferenceSolution || false
    };

    return NextResponse.json({
      submissionId: submissionId,
      aiGrading: aiGrading,
      hasAiGrading: !!(submissionData.aiGrade !== null && submissionData.aiGrade !== undefined)
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching AI grading details:', error);
    return NextResponse.json({ error: 'Failed to fetch AI grading details' }, { status: 500 });
  }
}
