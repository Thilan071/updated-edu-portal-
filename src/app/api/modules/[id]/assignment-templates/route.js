import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import ModuleService from '@/lib/moduleService';

// GET /api/modules/[id]/assignment-templates - Get assignment templates for a module
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator', 'student']);
    if (error) return error;

    const { id: moduleId } = await params;
    
    const assignmentTemplates = await ModuleService.getAssignmentTemplates(moduleId);
    
    return NextResponse.json({ assignmentTemplates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching assignment templates:', error);
    return NextResponse.json({ error: 'Failed to fetch assignment templates' }, { status: 500 });
  }
}

// POST /api/modules/[id]/assignment-templates - Create a new assignment template
export async function POST(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: moduleId } = await params;
    const body = await request.json();
    
    const { title, description, type, maxScore, instructions } = body;
    
    if (!title || !description || !type) {
      return NextResponse.json({ error: 'Title, description, and type are required' }, { status: 400 });
    }
    
    const assignmentData = {
      title,
      description,
      type, // 'assignment' or 'exam'
      maxScore: maxScore || 100,
      instructions: instructions || '',
      createdBy: user.id
    };
    
    const assignmentTemplate = await ModuleService.createAssignmentTemplate(moduleId, assignmentData);
    
    return NextResponse.json({ assignmentTemplate }, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment template:', error);
    return NextResponse.json({ error: 'Failed to create assignment template' }, { status: 500 });
  }
}