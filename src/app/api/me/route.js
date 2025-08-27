import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import { findUserById } from '@/lib/userService';

// GET /api/me - Get current user profile
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request);
    if (error) return error;

    // Fetch complete user data from database
    const fullUserData = await findUserById(user.uid);
    
    if (!fullUserData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: fullUserData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}