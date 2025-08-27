import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/student-self-assessment - Get student's self-assessment progress
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student']);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const moduleId = searchParams.get('moduleId');

    if (!assignmentId || !moduleId) {
      return NextResponse.json({ 
        error: 'assignmentId and moduleId are required' 
      }, { status: 400 });
    }

    const selfAssessment = await ModuleService.getStudentSelfAssessment(
      user.uid, 
      moduleId, 
      assignmentId
    );

    return NextResponse.json({ selfAssessment }, { status: 200 });
  } catch (error) {
    console.error('Error fetching self-assessment:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch self-assessment' 
    }, { status: 500 });
  }
}

// POST /api/student-self-assessment - Update student's self-assessment progress
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student']);
    if (error) return error;

    const body = await request.json();
    const { assignmentId, moduleId, progressPercentage, notes, workUploaded, fileUrl } = body;

    // Validate required fields
    if (!assignmentId || !moduleId || progressPercentage === undefined) {
      return NextResponse.json({ 
        error: 'assignmentId, moduleId, and progressPercentage are required' 
      }, { status: 400 });
    }

    // Validate progress percentage is between 0 and 100
    if (progressPercentage < 0 || progressPercentage > 100) {
      return NextResponse.json({ 
        error: 'Progress percentage must be between 0 and 100' 
      }, { status: 400 });
    }

    // Validate that module and assignment exist
    const module = await ModuleService.getModuleById(moduleId);
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 400 });
    }

    const assignment = await ModuleService.getAssignmentTemplateById(moduleId, assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 400 });
    }

    const selfAssessmentData = {
      studentId: user.uid,
      assignmentId,
      moduleId,
      progressPercentage,
      notes: notes || '',
      workUploaded: workUploaded || false,
      fileUrl: fileUrl || '',
      lastUpdated: new Date()
    };

    const selfAssessment = await ModuleService.updateStudentSelfAssessment(selfAssessmentData);
    
    return NextResponse.json({ selfAssessment }, { status: 200 });
  } catch (error) {
    console.error('Error updating self-assessment:', error);
    return NextResponse.json({ 
      error: 'Failed to update self-assessment' 
    }, { status: 500 });
  }
}