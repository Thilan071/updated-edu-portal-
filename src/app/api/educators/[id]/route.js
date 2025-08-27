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
        { error: 'Educator ID is required' },
        { status: 400 }
      );
    }

    await UserService.deleteUser(id);
    return NextResponse.json(
      { success: true, message: 'Educator deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting educator:', error);
    return NextResponse.json(
      { error: 'Failed to delete educator' },
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
        { error: 'Educator ID is required' },
        { status: 400 }
      );
    }

    const updatedEducator = await UserService.updateUser(id, {
      ...body,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json(
      { success: true, data: updatedEducator },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating educator:', error);
    return NextResponse.json(
      { error: 'Failed to update educator' },
      { status: 500 }
    );
  }
}