import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/student/enrollments - Get student's enrolled courses and modules
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student']);
    if (error) return error;

    // Get student's enrollments
    const enrollments = await ModuleService.getStudentEnrollments(user.uid);
    
    // Get detailed course information for each enrollment
    const enrolledCourses = [];
    for (const enrollment of enrollments) {
      const course = await ModuleService.getCourseById(enrollment.courseId);
      if (course) {
        // Get modules for this course
        const modules = [];
        if (course.moduleIds && Array.isArray(course.moduleIds)) {
          for (const moduleId of course.moduleIds) {
            const module = await ModuleService.getModuleById(moduleId);
            if (module) {
              // Get student progress for this module
              const progress = await ModuleService.getStudentProgress(user.uid, moduleId);
              const completion = await ModuleService.calculateModuleCompletion(user.uid, moduleId);
              
              modules.push({
                ...module,
                progress: progress || [],
                completion: completion || { percentage: 0, status: 'not_started' }
              });
            }
          }
        }
        
        enrolledCourses.push({
          ...course,
          enrollment,
          modules
        });
      }
    }

    return NextResponse.json({ 
      enrollments: enrolledCourses,
      totalCourses: enrolledCourses.length,
      totalModules: enrolledCourses.reduce((acc, course) => acc + course.modules.length, 0)
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}