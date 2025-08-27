import { NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/educators - Get all educators (admin only)
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin']);
    if (error) return error;

    const educators = await UserService.getAllEducators();
    return NextResponse.json({ data: educators }, { status: 200 });
  } catch (error) {
    console.error('Error fetching educators:', error);
    return NextResponse.json({ error: 'Failed to fetch educators' }, { status: 500 });
  }
}

// POST /api/educators - Create a new educator (admin only)
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin']);
    if (error) return error;

    const educatorData = await request.json();
    
    // Validate required fields
    if (!educatorData.firstName || !educatorData.lastName || !educatorData.email || !educatorData.password) {
      return NextResponse.json({ 
        error: 'First name, last name, email, and password are required' 
      }, { status: 400 });
    }

    // Set role and approval status
    educatorData.role = 'educator';
    educatorData.isApproved = true; // Admin-created educators are auto-approved
    
    const educator = await UserService.createUser(educatorData);
    return NextResponse.json({ educator }, { status: 201 });
  } catch (error) {
    console.error('Error creating educator:', error);
    return NextResponse.json({ error: 'Failed to create educator' }, { status: 500 });
  }
}