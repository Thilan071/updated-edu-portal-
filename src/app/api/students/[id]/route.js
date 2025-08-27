import { NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { authenticateAPIRequest } from '@/lib/authUtils';

export async function DELETE(request, { params }) {
  try {
    // Authenticate and check if user is admin
    const authResult = await authenticateAPIRequest(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    await UserService.deleteUser(id);
    return NextResponse.json(
      { success: true, message: 'Student deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Authenticate and check if user is admin
    const authResult = await authenticateAPIRequest(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const updatedStudent = await UserService.updateUser(id, {
      ...body,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json(
      { success: true, data: updatedStudent },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}