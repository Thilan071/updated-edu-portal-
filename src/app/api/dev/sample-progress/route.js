import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// POST /api/dev/sample-progress - Create sample student progress data
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { studentId, courseId } = await request.json();
    
    if (!studentId || !courseId) {
      return NextResponse.json({ 
        error: 'studentId and courseId are required' 
      }, { status: 400 });
    }

    // Get the course and its modules
    const course = await ModuleService.getCourseById(courseId);
    if (!course || !course.moduleIds) {
      return NextResponse.json({ 
        error: 'Course not found or has no modules' 
      }, { status: 404 });
    }

    const progressRecords = [];

    // Create sample progress for each module
    for (const moduleId of course.moduleIds) {
      // Get assessments for this module
      const assessments = await ModuleService.getAssessmentsByModule(moduleId);
      
      for (const assessment of assessments) {
        // Create random but realistic progress data
        const score = Math.floor(Math.random() * 30) + 70; // Score between 70-100
        
        const progressData = {
          studentId: studentId,
          moduleId: moduleId,
          assessmentId: assessment.id,
          assessmentType: assessment.type,
          score: score,
          maxScore: assessment.maxScore || 100,
          completedAt: new Date(),
          feedback: score >= 90 ? 'Excellent work!' : 
                   score >= 80 ? 'Good job, keep it up!' : 
                   score >= 70 ? 'Satisfactory, room for improvement' : 
                   'Needs more practice'
        };
        
        const progress = await ModuleService.recordStudentProgress(progressData);
        progressRecords.push(progress);
      }
    }

    return NextResponse.json({
      message: 'Sample progress data created successfully',
      progressRecords: progressRecords
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sample progress:', error);
    return NextResponse.json({ error: 'Failed to create sample progress' }, { status: 500 });
  }
}

// GET /api/dev/sample-progress - Get information about creating sample progress
export async function GET(request) {
  return NextResponse.json({
    message: 'Use POST to create sample progress data for a student',
    instructions: [
      '1. Make sure you are logged in as an admin or educator',
      '2. Send a POST request with studentId and courseId',
      '3. Sample progress records will be created for all assessments in the course',
      '4. Random but realistic scores will be assigned'
    ],
    example: {
      studentId: 'student-firebase-uid',
      courseId: 'course-firebase-id'
    }
  });
}