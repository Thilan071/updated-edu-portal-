import { NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';

export async function GET() {
  try {
    const pendingStudents = await UserService.getPendingStudents();
    
    return NextResponse.json(pendingStudents);
  } catch (error) {
    console.error('Error fetching pending students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
