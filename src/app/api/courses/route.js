import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/courses - Get all courses or courses by educator
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request);
    if (error) return error;

    let courses;
    
    // If educator, get only their courses; if admin, get all courses; if student, get enrolled courses
    if (user.role === 'educator') {
      courses = await ModuleService.getCoursesByEducator(user.uid);
    } else if (user.role === 'admin') {
      courses = await ModuleService.getCourses();
    } else if (user.role === 'student') {
      // Get enrolled courses for students
      const enrollments = await ModuleService.getStudentEnrollments(user.uid);
      const courseIds = enrollments.map(e => e.courseId);
      courses = [];
      for (const courseId of courseIds) {
        const course = await ModuleService.getCourseById(courseId);
        if (course) courses.push(course);
      }
    } else {
      courses = [];
    }

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST /api/courses - Create a new course
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

    const requestData = await request.json();
    
    // Validate required fields
    if (!requestData.title || !requestData.description || !requestData.modules || !Array.isArray(requestData.modules)) {
      return NextResponse.json({ 
        error: 'Title, description, and modules array are required' 
      }, { status: 400 });
    }

    // Validate that all modules exist
    for (const moduleId of requestData.modules) {
      const module = await ModuleService.getModuleById(moduleId);
      if (!module) {
        return NextResponse.json({ 
          error: `Module with ID ${moduleId} not found` 
        }, { status: 400 });
      }
    }

    // Prepare course data with correct field structure
    const courseData = {
      title: requestData.title,
      description: requestData.description,
      moduleIds: requestData.modules, // Store as moduleIds instead of modules
      duration: requestData.duration || '3 months', // Default duration
      level: requestData.level || 'beginner', // Default level
      isActive: requestData.isActive !== undefined ? requestData.isActive : true, // Default to active
      createdBy: user.email, // Use user's email as createdBy
      educatorId: user.uid,
      educatorName: user.name
    };
    
    const course = await ModuleService.createCourse(courseData);
    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}