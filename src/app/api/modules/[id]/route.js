import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';
import { adminDb } from '@/lib/firebaseAdmin';

// GET /api/modules/[id] - Get a specific module
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student', 'educator', 'admin']);
    if (error) return error;

    const { id } = await params;
    const module = await ModuleService.getModuleById(id);
    
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json({ module }, { status: 200 });
  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json({ error: 'Failed to fetch module' }, { status: 500 });
  }
}

// PUT /api/modules/[id] - Update a specific module
export async function PUT(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

    const { id } = await params;
    const updateData = await request.json();
    
    // Check if module exists and user has permission to edit
    const existingModule = await ModuleService.getModuleById(id);
    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    
    // Only allow creator or admin to edit
    if (userData.role !== 'admin' && existingModule.createdBy !== decodedToken.uid) {
      return NextResponse.json({ error: 'Forbidden - You can only edit your own modules' }, { status: 403 });
    }
    
    const module = await ModuleService.updateModule(id, updateData);
    return NextResponse.json({ module }, { status: 200 });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
  }
}

// DELETE /api/modules/[id] - Delete a specific module
export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user is educator or admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || (userData.role !== 'educator' && userData.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden - Educator or Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    
    // Check if module exists and user has permission to delete
    const existingModule = await ModuleService.getModuleById(id);
    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    
    // Only allow creator or admin to delete
    if (userData.role !== 'admin' && existingModule.createdBy !== decodedToken.uid) {
      return NextResponse.json({ error: 'Forbidden - You can only delete your own modules' }, { status: 403 });
    }
    
    await ModuleService.deleteModule(id);
    return NextResponse.json({ message: 'Module deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
  }
}