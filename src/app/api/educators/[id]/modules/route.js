import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/educators/[id]/modules - Get modules assigned to an educator
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: educatorId } = await params;
    
    // Get educator's assigned modules from subcollection
    const snapshot = await adminDb.collection('users')
      .doc(educatorId)
      .collection('modules')
      .get();
    
    const assignedModuleIds = snapshot.docs.map(doc => doc.data().moduleId);
    
    // Get full module details
    const modules = [];
    if (assignedModuleIds.length > 0) {
      const modulesSnapshot = await adminDb.collection('modules')
        .where('__name__', 'in', assignedModuleIds)
        .get();
      
      modules.push(...modulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    }
    
    return NextResponse.json({ modules }, { status: 200 });
  } catch (error) {
    console.error('Error fetching educator modules:', error);
    return NextResponse.json({ error: 'Failed to fetch educator modules' }, { status: 500 });
  }
}

// POST /api/educators/[id]/modules - Assign modules to an educator
export async function POST(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin']);
    if (error) return error;

    const { id: educatorId } = await params;
    const { moduleIds } = await request.json();
    
    if (!Array.isArray(moduleIds)) {
      return NextResponse.json({ error: 'moduleIds must be an array' }, { status: 400 });
    }
    
    // Remove existing assignments from subcollection
    const existingSnapshot = await adminDb.collection('users')
      .doc(educatorId)
      .collection('modules')
      .get();
    
    const batch = adminDb.batch();
    
    // Delete existing assignments
    existingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Add new assignments to subcollection
    moduleIds.forEach(moduleId => {
      const docRef = adminDb.collection('users')
        .doc(educatorId)
        .collection('modules')
        .doc();
      batch.set(docRef, {
        moduleId,
        assignedAt: new Date(),
        assignedBy: user.uid
      });
    });
    
    await batch.commit();
    
    return NextResponse.json({ 
      message: 'Modules assigned successfully',
      assignedModules: moduleIds.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error assigning modules to educator:', error);
    return NextResponse.json({ error: 'Failed to assign modules' }, { status: 500 });
  }
}

// DELETE /api/educators/[id]/modules - Remove module assignments from an educator
export async function DELETE(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin']);
    if (error) return error;

    const { id: educatorId } = await params;
    const { moduleIds } = await request.json();
    
    if (!Array.isArray(moduleIds)) {
      return NextResponse.json({ error: 'moduleIds must be an array' }, { status: 400 });
    }
    
    // Remove specific module assignments from subcollection
    const snapshot = await adminDb.collection('users')
      .doc(educatorId)
      .collection('modules')
      .where('moduleId', 'in', moduleIds)
      .get();
    
    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return NextResponse.json({ 
      message: 'Module assignments removed successfully',
      removedModules: moduleIds.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error removing module assignments:', error);
    return NextResponse.json({ error: 'Failed to remove module assignments' }, { status: 500 });
  }
}