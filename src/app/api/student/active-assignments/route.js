import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import ModuleService from '@/lib/moduleService';

// GET /api/student/active-assignments - Get active assignments for the current student
export async function GET(request) {
  try {
    const { success, error, user } = await authenticateAPIRequest(request, ['student']);
    if (!success) {
      return NextResponse.json({ error: error || 'Authentication failed' }, { status: 401 });
    }

    // Validate user ID
    const studentId = user.uid || user.id;
    if (!studentId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const activeAssignments = await ModuleService.getActiveAssignmentsByStudent(studentId);
    
    // Sort by due date (earliest first)
    const sortedAssignments = activeAssignments.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    return NextResponse.json({ assignments: sortedAssignments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching active assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch active assignments' }, { status: 500 });
  }
}