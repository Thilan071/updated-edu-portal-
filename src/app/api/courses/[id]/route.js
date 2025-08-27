import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/courses/[id] - Get a specific course
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request);
    if (error) return error;

    const { id } = await params;
    const course = await ModuleService.getCourseById(id);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check permissions - students can only see enrolled courses
    if (user.role === 'student') {
      const enrollments = await ModuleService.getStudentEnrollments(user.uid);
      const isEnrolled = enrollments.some(e => e.courseId === id);
      if (!isEnrolled) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    // Educators can only see their own courses (unless admin)
    else if (user.role === 'educator' && course.educatorId !== user.uid) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ course }, { status: 200 });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

// PUT /api/courses/[id] - Update a specific course
export async function PUT(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

    const { id } = await params;
    const updateData = await request.json();
    
    // Check if course exists
    const existingCourse = await ModuleService.getCourseById(id);
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Only allow creator or admin to update
    if (user.role !== 'admin' && existingCourse.educatorId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden - You can only update your own courses' }, { status: 403 });
    }

    // Validate modules if provided
    if (updateData.modules && Array.isArray(updateData.modules)) {
      for (const moduleId of updateData.modules) {
        const module = await ModuleService.getModuleById(moduleId);
        if (!module) {
          return NextResponse.json({ 
            error: `Module with ID ${moduleId} not found` 
          }, { status: 400 });
        }
      }
    }
    
    const updatedCourse = await ModuleService.updateCourse(id, updateData);
    return NextResponse.json({ course: updatedCourse }, { status: 200 });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

// DELETE /api/courses/[id] - Delete a specific course
export async function DELETE(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

    const { id } = await params;
    
    // Check if course exists
    const existingCourse = await ModuleService.getCourseById(id);
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Only allow creator or admin to delete
    if (user.role !== 'admin' && existingCourse.educatorId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden - You can only delete your own courses' }, { status: 403 });
    }
    
    await ModuleService.deleteCourse(id);
    return NextResponse.json({ message: 'Course deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}