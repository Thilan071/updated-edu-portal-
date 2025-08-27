import { NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/students - Get all students (admin only)
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin']);
    if (error) return error;

    const students = await UserService.getAllStudents();
    return NextResponse.json({ data: students }, { status: 200 });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

// POST /api/students - Create a new student (admin only)
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin']);
    if (error) return error;

    const studentData = await request.json();
    
    // Validate required fields
    if (!studentData.firstName || !studentData.lastName || !studentData.email || !studentData.password) {
      return NextResponse.json({ 
        error: 'First name, last name, email, and password are required' 
      }, { status: 400 });
    }

    // Set role and approval status
    studentData.role = 'student';
    studentData.isApproved = true; // Admin-created students are auto-approved
    
    const student = await UserService.createUser(studentData);
    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}