import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import ModuleService from '@/lib/moduleService';

// GET /api/modules/[id]/assignment-templates/[assignmentId] - Get specific assignment template
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator', 'student']);
    if (error) return error;

    const { id: moduleId, assignmentId } = await params;
    
    const assignmentTemplate = await ModuleService.getAssignmentTemplateById(moduleId, assignmentId);
    
    if (!assignmentTemplate) {
      return NextResponse.json({ error: 'Assignment template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ assignmentTemplate }, { status: 200 });
  } catch (error) {
    console.error('Error fetching assignment template:', error);
    return NextResponse.json({ error: 'Failed to fetch assignment template' }, { status: 500 });
  }
}

// PUT /api/modules/[id]/assignment-templates/[assignmentId] - Update assignment template
export async function PUT(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: moduleId, assignmentId } = await params;
    const body = await request.json();
    
    const assignmentTemplate = await ModuleService.updateAssignmentTemplate(moduleId, assignmentId, body);
    
    if (!assignmentTemplate) {
      return NextResponse.json({ error: 'Assignment template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ assignmentTemplate }, { status: 200 });
  } catch (error) {
    console.error('Error updating assignment template:', error);
    return NextResponse.json({ error: 'Failed to update assignment template' }, { status: 500 });
  }
}

// DELETE /api/modules/[id]/assignment-templates/[assignmentId] - Delete assignment template
export async function DELETE(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: moduleId, assignmentId } = await params;
    
    const success = await ModuleService.deleteAssignmentTemplate(moduleId, assignmentId);
    
    if (!success) {
      return NextResponse.json({ error: 'Assignment template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Assignment template deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting assignment template:', error);
    return NextResponse.json({ error: 'Failed to delete assignment template' }, { status: 500 });
  }
}