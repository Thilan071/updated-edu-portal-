import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// POST /api/enrollments - Enroll a student in a course
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { studentId, courseId, batchId } = await request.json();
    
    if (!studentId || !courseId) {
      return NextResponse.json({ 
        error: 'studentId and courseId are required' 
      }, { status: 400 });
    }

    // Verify the course exists
    const course = await ModuleService.getCourseById(courseId);
    if (!course) {
      return NextResponse.json({ 
        error: 'Course not found' 
      }, { status: 404 });
    }

    // Check if student is already enrolled
    const existingEnrollments = await ModuleService.getStudentEnrollments(studentId);
    const isAlreadyEnrolled = existingEnrollments.some(enrollment => enrollment.courseId === courseId);
    
    if (isAlreadyEnrolled) {
      return NextResponse.json({ 
        error: 'Student is already enrolled in this course' 
      }, { status: 400 });
    }

    // Enroll the student
    const enrollment = await ModuleService.enrollStudent(studentId, courseId, batchId);
    
    return NextResponse.json({ 
      message: 'Student enrolled successfully',
      enrollment 
    }, { status: 201 });
  } catch (error) {
    console.error('Error enrolling student:', error);
    return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 });
  }
}

// GET /api/enrollments - Get all enrollments (admin/educator only)
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');

    let enrollments = [];
    
    if (studentId) {
      enrollments = await ModuleService.getStudentEnrollments(studentId);
    } else if (courseId) {
      enrollments = await ModuleService.getCourseEnrollments(courseId);
    } else {
      // This would require a new method to get all enrollments
      return NextResponse.json({ 
        error: 'Please specify either studentId or courseId parameter' 
      }, { status: 400 });
    }

    return NextResponse.json({ enrollments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}