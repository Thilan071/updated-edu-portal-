import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/student-progress - Get student progress
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student', 'educator', 'admin']);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const moduleId = searchParams.get('moduleId');

    let targetStudentId = studentId;
    
    // Students can only view their own progress, educators and admins can view any student's progress
    if (user.role === 'student') {
      targetStudentId = user.uid;
    } else if (!studentId && (user.role === 'educator' || user.role === 'admin')) {
      return NextResponse.json({ error: 'studentId parameter is required for educators and admins' }, { status: 400 });
    }

    const progress = await ModuleService.getStudentProgress(targetStudentId, moduleId);
    
    // If moduleId is provided, also calculate completion status
    let completion = null;
    if (moduleId) {
      completion = await ModuleService.calculateModuleCompletion(targetStudentId, moduleId);
    }

    return NextResponse.json({ progress, completion }, { status: 200 });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    return NextResponse.json({ error: 'Failed to fetch student progress' }, { status: 500 });
  }
}

// POST /api/student-progress - Record student progress
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

    const progressData = await request.json();
    
    // Validate required fields
    if (!progressData.studentId || !progressData.moduleId || !progressData.assessmentId || progressData.score === undefined) {
      return NextResponse.json({ 
        error: 'studentId, moduleId, assessmentId, and score are required' 
      }, { status: 400 });
    }

    // Validate score is between 0 and 100
    if (progressData.score < 0 || progressData.score > 100) {
      return NextResponse.json({ 
        error: 'Score must be between 0 and 100' 
      }, { status: 400 });
    }

    // Validate that student, module, and assessment exist
    // Note: We'll trust that the studentId is valid since it comes from authenticated educators/admins

    const module = await ModuleService.getModuleById(progressData.moduleId);
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 400 });
    }

    const assessment = await ModuleService.getAssessmentById(progressData.assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 400 });
    }

    // Add grader information
    progressData.gradedBy = user.uid;
    progressData.graderName = `${user.firstName || 'Unknown'} ${user.lastName || 'User'}`;
    progressData.gradedAt = new Date();
    
    const progress = await ModuleService.recordStudentProgress(progressData);
    
    // Calculate updated module completion
    const completion = await ModuleService.calculateModuleCompletion(progressData.studentId, progressData.moduleId);
    
    return NextResponse.json({ progress, completion }, { status: 201 });
  } catch (error) {
    console.error('Error recording student progress:', error);
    return NextResponse.json({ error: 'Failed to record student progress' }, { status: 500 });
  }
}