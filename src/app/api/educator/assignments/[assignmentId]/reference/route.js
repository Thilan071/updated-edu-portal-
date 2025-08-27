import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// POST /api/educator/assignments/[assignmentId]/reference - Upload reference assignment solution
export async function POST(request, { params }) {
  try {
    const authResult = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user;

    const { assignmentId } = await params;
    const { 
      referenceText, 
      referenceFileUrl, 
      fileName, 
      fileSize,
      gradingCriteria,
      maxScore,
      moduleId
    } = await request.json();

    if (!referenceText && !referenceFileUrl) {
      return NextResponse.json({ 
        error: 'Either reference text or reference file is required' 
      }, { status: 400 });
    }

    // Get assignment details to verify ownership
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

    // Check if user is authorized to update this assignment
    if (user.role === 'educator' && assignmentData.educatorId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create reference solution data
    const referenceData = {
      assignmentId,
      moduleId: moduleId || null,
      educatorId: user.uid,
      referenceText: referenceText || '',
      referenceFileUrl: referenceFileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      gradingCriteria: gradingCriteria || '',
      maxScore: maxScore || assignmentData.maxScore || 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignmentTitle: assignmentData.title || 'Unknown Assignment',
      assignmentDescription: assignmentData.description || ''
    };

    // Store reference solution in assignment_references collection
    const referenceRef = await adminDb.collection('assignment_references').add(referenceData);

    // Update the assignment to link to reference solution
    const updateData = {
      hasReferenceSolution: true,
      referenceSolutionId: referenceRef.id,
      updatedAt: new Date()
    };

    if (moduleId) {
      await adminDb.collection('modules').doc(moduleId)
        .collection('assignment_templates').doc(assignmentId).update(updateData);
    } else {
      await adminDb.collection('assignment_templates').doc(assignmentId).update(updateData);
    }

    return NextResponse.json({
      message: 'Reference solution uploaded successfully',
      referenceId: referenceRef.id,
      reference: {
        id: referenceRef.id,
        ...referenceData
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading reference solution:', error);
    return NextResponse.json({ error: 'Failed to upload reference solution' }, { status: 500 });
  }
}

// GET /api/educator/assignments/[assignmentId]/reference - Get reference assignment solution
export async function GET(request, { params }) {
  try {
    const authResult = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user;

    const { assignmentId } = await params;
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    // Get reference solution for this assignment
    const referencesSnapshot = await adminDb.collection('assignment_references')
      .where('assignmentId', '==', assignmentId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (referencesSnapshot.empty) {
      return NextResponse.json({ error: 'No reference solution found' }, { status: 404 });
    }

    const referenceDoc = referencesSnapshot.docs[0];
    const referenceData = referenceDoc.data();

    // Check authorization
    if (user.role === 'educator' && referenceData.educatorId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      reference: {
        id: referenceDoc.id,
        ...referenceData,
        createdAt: referenceData.createdAt?.toDate?.()?.toISOString() || referenceData.createdAt,
        updatedAt: referenceData.updatedAt?.toDate?.()?.toISOString() || referenceData.updatedAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching reference solution:', error);
    return NextResponse.json({ error: 'Failed to fetch reference solution' }, { status: 500 });
  }
}

// PUT /api/educator/assignments/[assignmentId]/reference - Update reference assignment solution
export async function PUT(request, { params }) {
  try {
    const authResult = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user;

    const { assignmentId } = await params;
    const updates = await request.json();

    // Get existing reference solution
    const referencesSnapshot = await adminDb.collection('assignment_references')
      .where('assignmentId', '==', assignmentId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (referencesSnapshot.empty) {
      return NextResponse.json({ error: 'No reference solution found' }, { status: 404 });
    }

    const referenceDoc = referencesSnapshot.docs[0];
    const referenceData = referenceDoc.data();

    // Check authorization
    if (user.role === 'educator' && referenceData.educatorId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update reference solution
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await adminDb.collection('assignment_references').doc(referenceDoc.id).update(updateData);

    return NextResponse.json({
      message: 'Reference solution updated successfully',
      reference: {
        id: referenceDoc.id,
        ...referenceData,
        ...updateData
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating reference solution:', error);
    return NextResponse.json({ error: 'Failed to update reference solution' }, { status: 500 });
  }
}
