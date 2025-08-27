import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import ModuleService from '@/lib/moduleService';

// POST /api/modules/[id]/assignment-templates/[assignmentId]/activate - Activate assignment with due date
export async function POST(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: moduleId, assignmentId } = await params;
    const body = await request.json();
    
    const { dueDate } = body;
    
    if (!dueDate) {
      return NextResponse.json({ error: 'Due date is required' }, { status: 400 });
    }
    
    const assignmentTemplate = await ModuleService.activateAssignment(moduleId, assignmentId, dueDate, user.uid);
    
    if (!assignmentTemplate) {
      return NextResponse.json({ error: 'Assignment template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Assignment activated successfully',
      assignmentTemplate 
    }, { status: 200 });
  } catch (error) {
    console.error('Error activating assignment:', error);
    return NextResponse.json({ error: 'Failed to activate assignment' }, { status: 500 });
  }
}

// DELETE /api/modules/[id]/assignment-templates/[assignmentId]/activate - Deactivate assignment
export async function DELETE(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: moduleId, assignmentId } = await params;
    
    const assignmentTemplate = await ModuleService.deactivateAssignment(moduleId, assignmentId);
    
    if (!assignmentTemplate) {
      return NextResponse.json({ error: 'Assignment template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Assignment deactivated successfully',
      assignmentTemplate 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deactivating assignment:', error);
    return NextResponse.json({ error: 'Failed to deactivate assignment' }, { status: 500 });
  }
}