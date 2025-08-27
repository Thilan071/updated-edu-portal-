import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';
import geminiGradingService from '@/lib/geminiGradingService';

// POST /api/educator/assignments/[assignmentId]/batch-grade - Grade all submissions for an assignment
export async function POST(request, { params }) {
  try {
    const authResult = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user;

    const { assignmentId } = await params;
    const { moduleId } = await request.json();
    
    console.log('🚀 Starting batch AI grading for assignment:', assignmentId);

    // Get assignment details
    let assignmentDoc;
    if (moduleId) {
      assignmentDoc = await adminDb.collection('modules').doc(moduleId)
        .collection('assignment_templates').doc(assignmentId).get();
    } else {
      assignmentDoc = await adminDb.collection('assignment_templates').doc(assignmentId).get();
    }

    if (!assignmentDoc.exists) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignmentData = assignmentDoc.data();

    // Check authorization
    if (user.role === 'educator' && assignmentData.educatorId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get reference solution
    const referencesSnapshot = await adminDb.collection('assignment_references')
      .where('assignmentId', '==', assignmentId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (referencesSnapshot.empty) {
      return NextResponse.json({ 
        error: 'No reference solution found. Please upload a reference solution first.' 
      }, { status: 400 });
    }

    const referenceData = referencesSnapshot.docs[0].data();

    // Get all submissions for this assignment
    const submissionsSnapshot = await adminDb.collection('submissions')
      .where('assignmentId', '==', assignmentId)
      .where('status', 'in', ['submitted', 'pending'])
      .get();

    if (submissionsSnapshot.empty) {
      return NextResponse.json({ 
        message: 'No submissions found for grading',
        gradedCount: 0 
      }, { status: 200 });
    }

    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📊 Found ${submissions.length} submissions to grade`);

    // Prepare grading parameters
    const gradingParams = {
      referenceSolution: referenceData.referenceText || '',
      assignmentTitle: assignmentData.title || 'Assignment',
      assignmentDescription: assignmentData.description || '',
      gradingCriteria: referenceData.gradingCriteria || '',
      maxScore: referenceData.maxScore || assignmentData.maxScore || 100,
      referenceFileUrl: referenceData.referenceFileUrl || ''
    };

    // Grade submissions in batch
    const gradingResults = await geminiGradingService.gradeBatch(submissions, referenceData.referenceText, gradingParams);

    // Update all submissions with grading results
    const updatePromises = gradingResults.map(async (result) => {
      if (!result.success) {
        console.error(`Failed to grade submission ${result.submissionId}:`, result.error);
        return { submissionId: result.submissionId, success: false, error: result.error };
      }

      const aiGrading = result.grading;
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
        aiGradingMethod: 'gemini_ai_batch_comparison',
        hasReferenceSolution: true,
        status: 'ai_graded',
        updatedAt: new Date()
      };

      try {
        // Update main submission
        await adminDb.collection('submissions').doc(result.submissionId).update(updateData);

        // Update student's submission copy if it exists
        const submission = submissions.find(s => s.id === result.submissionId);
        if (submission) {
          try {
            const studentSubmissionDoc = await adminDb.collection('users')
              .doc(submission.studentId)
              .collection('submissions')
              .doc(result.submissionId)
              .get();

            if (studentSubmissionDoc.exists) {
              await adminDb.collection('users')
                .doc(submission.studentId)
                .collection('submissions')
                .doc(result.submissionId)
                .update(updateData);
            }
          } catch (studentUpdateError) {
            console.error('Error updating student submission copy:', studentUpdateError);
          }

          // Update project assignment if applicable
          if (submission.submissionType === 'project_assignment' && submission.projectAssignmentId) {
            try {
              await adminDb.collection('users')
                .doc(submission.studentId)
                .collection('Project Assignment')
                .doc(submission.projectAssignmentId)
                .update({
                  ...updateData,
                  finalGrade: aiGrading.score,
                  isGraded: true,
                  gradedAt: new Date(),
                  gradedBy: user.uid
                });
            } catch (projectUpdateError) {
              console.error('Error updating project assignment:', projectUpdateError);
            }
          }
        }

        return { submissionId: result.submissionId, success: true };
      } catch (updateError) {
        console.error(`Error updating submission ${result.submissionId}:`, updateError);
        return { submissionId: result.submissionId, success: false, error: updateError.message };
      }
    });

    const updateResults = await Promise.all(updatePromises);
    const successCount = updateResults.filter(r => r.success).length;
    const failureCount = updateResults.filter(r => !r.success).length;

    console.log(`✅ Batch grading completed: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      message: 'Batch AI grading completed',
      totalSubmissions: submissions.length,
      successfullyGraded: successCount,
      failed: failureCount,
      gradingResults: gradingResults.map(r => ({
        submissionId: r.submissionId,
        studentId: r.studentId,
        success: r.success,
        score: r.success ? r.grading.score : null,
        percentage: r.success ? r.grading.percentage : null,
        grade: r.success ? r.grading.grade : null,
        error: r.error || null
      })),
      updateResults: updateResults
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error in batch AI grading:', error);
    return NextResponse.json({ 
      error: 'Failed to perform batch AI grading',
      details: error.message 
    }, { status: 500 });
  }
}
