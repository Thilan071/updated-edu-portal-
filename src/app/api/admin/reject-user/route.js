import { NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';

// POST /api/admin/reject-user  { userId: "<firestore doc id>" }
export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // Reject the user (delete from Firebase)
    const success = await UserService.rejectUser(userId);

    if (!success) {
      return NextResponse.json({ message: 'Failed to reject user' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'User rejected and removed successfully'
    }, { status: 200 });
  } catch (err) {
    console.error('[reject-user] error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}