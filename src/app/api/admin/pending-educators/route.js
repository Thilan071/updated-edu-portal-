import { NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';

export async function GET() {
  try {
    const pendingEducators = await UserService.getPendingEducators();
    
    return NextResponse.json(pendingEducators);
  } catch (error) {
    console.error('Error fetching pending educators:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}