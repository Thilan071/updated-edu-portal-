import { NextResponse } from 'next/server';
import ModuleService from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/modules - Get all modules
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request);
    if (error) return error;

    const modules = await ModuleService.getModules();
    return NextResponse.json({ modules }, { status: 200 });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
  }
}

// POST /api/modules - Create a new module
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

    const moduleData = await request.json();
    
    // Validate required fields
    if (!moduleData.title || !moduleData.description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Add creator information
    moduleData.createdBy = user.uid;
    moduleData.creatorName = user.name;
    
    const module = await ModuleService.createModule(moduleData);
    return NextResponse.json({ module }, { status: 201 });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
  }
}