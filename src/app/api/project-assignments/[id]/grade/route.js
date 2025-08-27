import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// POST /api/project-assignments/[id]/grade - Grade a project assignment
export async function POST(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id } = await params;
    const { finalGrade, educatorFeedback, studentId } = await request.json();

    if (finalGrade === undefined || finalGrade < 0 || finalGrade > 100) {
      return NextResponse.json({ error: 'Valid final grade (0-100) is required' }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get project assignment details
    const projectDoc = await adminDb.collection('users').doc(studentId)
      .collection('Project Assignment').doc(id).get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project assignment not found' }, { status: 404 });
    }

    const projectData = projectDoc.data();

    // Update grading data
    const gradingData = {
      finalGrade: finalGrade,
      educatorFeedback: educatorFeedback || '',
      isGraded: true,
      gradedAt: new Date(),
      gradedBy: user.uid,
      status: 'graded'
    };

    // Update in user's project assignments subcollection
    await adminDb.collection('users').doc(studentId)
      .collection('Project Assignment').doc(id).update(gradingData);

    // Update main submissions collection
    if (projectData.mainSubmissionId) {
      await adminDb.collection('submissions').doc(projectData.mainSubmissionId).update(gradingData);
    }

    // Update student's submissions subcollection
    const studentSubmissionQuery = await adminDb.collection('users').doc(studentId)
      .collection('submissions')
      .where('projectAssignmentId', '==', id)
      .get();

    if (!studentSubmissionQuery.empty) {
      const submissionDoc = studentSubmissionQuery.docs[0];
      await adminDb.collection('users').doc(studentId)
        .collection('submissions').doc(submissionDoc.id).update(gradingData);
    }

    // Update student progress record
    const progressData = {
      studentId: studentId,
      moduleId: projectData.moduleId,
      assignmentId: projectData.assignmentId,
      score: finalGrade,
      submissionId: projectData.mainSubmissionId,
      projectAssignmentId: id,
      completedAt: new Date(),
      status: 'completed',
      type: 'project_assignment'
    };

    // Check if progress record already exists
    const existingProgress = await adminDb.collection('student_progress')
      .where('studentId', '==', studentId)
      .where('assignmentId', '==', projectData.assignmentId)
      .where('moduleId', '==', projectData.moduleId)
      .get();

    if (existingProgress.empty) {
      await adminDb.collection('student_progress').add(progressData);
    } else {
      const progressDoc = existingProgress.docs[0];
      await adminDb.collection('student_progress').doc(progressDoc.id).update({
        score: finalGrade,
        projectAssignmentId: id,
        completedAt: new Date(),
        status: 'completed',
        type: 'project_assignment'
      });
    }

    return NextResponse.json({
      message: 'Project assignment graded successfully',
      finalGrade: finalGrade,
      projectAssignmentId: id
    }, { status: 200 });
  } catch (error) {
    console.error('Error grading project assignment:', error);
    return NextResponse.json({ error: 'Failed to grade project assignment' }, { status: 500 });
  }
}

// GET /api/project-assignments/[id]/grade - Get grading status
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student', 'educator', 'admin']);
    if (error) return error;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    // Determine which student's data to fetch
    let targetStudentId = user.uid;
    if ((user.role === 'educator' || user.role === 'admin') && studentId) {
      targetStudentId = studentId;
    }

    // Get project assignment details
    const projectDoc = await adminDb.collection('users').doc(targetStudentId)
      .collection('Project Assignment').doc(id).get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project assignment not found' }, { status: 404 });
    }

    const projectData = projectDoc.data();

    const gradingInfo = {
      isGraded: projectData.isGraded || false,
      finalGrade: projectData.finalGrade || null,
      aiGrade: projectData.aiGrade || null,
      educatorFeedback: projectData.educatorFeedback || '',
      gradedAt: projectData.gradedAt || null,
      gradedBy: projectData.gradedBy || null,
      maxScore: projectData.maxScore || 100
    };

    // If graded by someone, get grader details
    if (projectData.gradedBy) {
      try {
        const graderDoc = await adminDb.collection('users').doc(projectData.gradedBy).get();
        if (graderDoc.exists) {
          const graderData = graderDoc.data();
          gradingInfo.graderName = `${graderData.firstName || ''} ${graderData.lastName || ''}`.trim();
          gradingInfo.graderEmail = graderData.email;
        }
      } catch (graderError) {
        console.error('Error fetching grader details:', graderError);
      }
    }

    return NextResponse.json({ gradingInfo }, { status: 200 });
  } catch (error) {
    console.error('Error fetching grading information:', error);
    return NextResponse.json({ error: 'Failed to fetch grading information' }, { status: 500 });
  }
}
