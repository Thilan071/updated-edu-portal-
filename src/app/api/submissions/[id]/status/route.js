import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authenticateAPIRequest } from '@/lib/auth-utils';

// PATCH /api/submissions/[id]/status - Update submission review status
export async function PATCH(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

    const { id } = params;
    const { reviewStatus, lastViewedBy, lastViewedAt } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    // Validate reviewStatus
    const validStatuses = ['pending', 'under_review', 'reviewed'];
    if (reviewStatus && !validStatuses.includes(reviewStatus)) {
      return NextResponse.json({ 
        error: 'Invalid review status. Must be one of: pending, under_review, reviewed' 
      }, { status: 400 });
    }

    // Check if submission exists
    const submissionRef = adminDb.collection('submissions').doc(id);
    const submissionDoc = await submissionRef.get();
    
    if (!submissionDoc.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    if (reviewStatus) {
      updateData.reviewStatus = reviewStatus;
    }

    if (lastViewedBy) {
      updateData.lastViewedBy = lastViewedBy;
    }

    if (lastViewedAt) {
      updateData.lastViewedAt = new Date(lastViewedAt);
    }

    // Update submission
    await submissionRef.update(updateData);

    // Get updated submission
    const updatedDoc = await submissionRef.get();
    const updatedSubmission = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ 
      message: 'Submission status updated successfully',
      submission: updatedSubmission 
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating submission status:', error);
    return NextResponse.json({ 
      error: 'Failed to update submission status' 
    }, { status: 500 });
  }
}