import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/batches - Get all batches
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request);
    if (error) return error;

    const batches = await ModuleService.getBatches();
    return NextResponse.json({ batches }, { status: 200 });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}

// POST /api/batches - Create a new batch
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

    const batchData = await request.json();
    
    // Validate required fields
    if (!batchData.name || !batchData.academicYear) {
      return NextResponse.json({ error: 'Name and academic year are required' }, { status: 400 });
    }

    // Add creator information
    batchData.createdBy = user.uid;
    batchData.creatorName = user.name;
    
    const batch = await ModuleService.createBatch(batchData);
    return NextResponse.json({ batch }, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }
}