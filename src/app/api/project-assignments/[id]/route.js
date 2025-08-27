import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/project-assignments/[id] - Get specific project assignment
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student', 'educator', 'admin']);
    if (error) return error;

    const { id } = await params;

    let projectAssignment = null;

    // For students, get from their subcollection
    if (user.role === 'student') {
      const projectDoc = await adminDb.collection('users').doc(user.uid)
        .collection('Project Assignment').doc(id).get();
      
      if (projectDoc.exists) {
        projectAssignment = { id: projectDoc.id, ...projectDoc.data() };
      }
    } else {
      // For educators/admin, get from main submissions collection
      const submissionDoc = await adminDb.collection('submissions')
        .where('projectAssignmentId', '==', id)
        .get();
      
      if (!submissionDoc.empty) {
        const doc = submissionDoc.docs[0];
        projectAssignment = { id: doc.id, ...doc.data() };
      }
    }

    if (!projectAssignment) {
      return NextResponse.json({ error: 'Project assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ projectAssignment }, { status: 200 });
  } catch (error) {
    console.error('Error fetching project assignment:', error);
    return NextResponse.json({ error: 'Failed to fetch project assignment' }, { status: 500 });
  }
}

// PUT /api/project-assignments/[id] - Update project assignment (for resubmissions)
export async function PUT(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student']);
    if (error) return error;

    const { id } = await params;
    const updateData = await request.json();

    // Get existing project assignment
    const projectDoc = await adminDb.collection('users').doc(user.uid)
      .collection('Project Assignment').doc(id).get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project assignment not found' }, { status: 404 });
    }

    const currentData = projectDoc.data();

    // Check if resubmission is allowed (not graded or specifically allowed)
    if (currentData.isGraded && !updateData.allowResubmission) {
      return NextResponse.json({ error: 'Cannot update graded assignment' }, { status: 400 });
    }

    // Prepare update data
    const updatedProjectData = {
      ...updateData,
      lastUpdatedAt: new Date(),
      submissionVersion: (currentData.submissionVersion || 1) + 1,
      resubmitted: true
    };

    // Update in user's subcollection
    await adminDb.collection('users').doc(user.uid)
      .collection('Project Assignment').doc(id).update(updatedProjectData);

    // Update in main submissions collection if it exists
    if (currentData.mainSubmissionId) {
      await adminDb.collection('submissions').doc(currentData.mainSubmissionId)
        .update(updatedProjectData);
    }

    // Update in student's submissions subcollection
    const studentSubmissionQuery = await adminDb.collection('users').doc(user.uid)
      .collection('submissions')
      .where('projectAssignmentId', '==', id)
      .get();

    if (!studentSubmissionQuery.empty) {
      const submissionDoc = studentSubmissionQuery.docs[0];
      await adminDb.collection('users').doc(user.uid)
        .collection('submissions').doc(submissionDoc.id).update(updatedProjectData);
    }

    return NextResponse.json({ 
      message: 'Project assignment updated successfully',
      projectAssignment: { id, ...currentData, ...updatedProjectData }
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating project assignment:', error);
    return NextResponse.json({ error: 'Failed to update project assignment' }, { status: 500 });
  }
}

// DELETE /api/project-assignments/[id] - Delete project assignment (admin only)
export async function DELETE(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin']);
    if (error) return error;

    const { id } = await params;
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get project assignment data
    const projectDoc = await adminDb.collection('users').doc(studentId)
      .collection('Project Assignment').doc(id).get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project assignment not found' }, { status: 404 });
    }

    const projectData = projectDoc.data();

    // Delete from user's subcollection
    await adminDb.collection('users').doc(studentId)
      .collection('Project Assignment').doc(id).delete();

    // Delete from main submissions collection
    if (projectData.mainSubmissionId) {
      await adminDb.collection('submissions').doc(projectData.mainSubmissionId).delete();
    }

    // Delete from student's submissions subcollection
    const studentSubmissionQuery = await adminDb.collection('users').doc(studentId)
      .collection('submissions')
      .where('projectAssignmentId', '==', id)
      .get();

    if (!studentSubmissionQuery.empty) {
      const submissionDoc = studentSubmissionQuery.docs[0];
      await adminDb.collection('users').doc(studentId)
        .collection('submissions').doc(submissionDoc.id).delete();
    }

    return NextResponse.json({ 
      message: 'Project assignment deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project assignment:', error);
    return NextResponse.json({ error: 'Failed to delete project assignment' }, { status: 500 });
  }
}
