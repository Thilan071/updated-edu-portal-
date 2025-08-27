import { NextResponse } from 'next/server';
import ModuleService from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/assessments - Get assessments (filtered by module or educator)
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const educatorId = searchParams.get('educatorId');

    let assessments = [];

    if (moduleId) {
      assessments = await ModuleService.getAssessmentsByModule(moduleId);
    } else if (user.role === 'educator') {
      assessments = await ModuleService.getAssessmentsByEducator(user.uid);
    } else if (user.role === 'admin') {
      // Admin can see all assessments - we'll need to implement this in ModuleService
      if (educatorId) {
        assessments = await ModuleService.getAssessmentsByEducator(educatorId);
      } else {
        // For now, return empty array - could implement getAllAssessments later
        assessments = [];
      }
    }

    return NextResponse.json({ assessments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

// POST /api/assessments - Create a new assessment
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

    const assessmentData = await request.json();
    
    // Validate required fields
    if (!assessmentData.title || !assessmentData.moduleId || !assessmentData.type) {
      return NextResponse.json({ 
        error: 'Title, moduleId, and type are required' 
      }, { status: 400 });
    }

    // Validate assessment type
    if (!['exam', 'practical', 'assignment', 'quiz'].includes(assessmentData.type)) {
      return NextResponse.json({ 
        error: 'Type must be one of: exam, practical, assignment, quiz' 
      }, { status: 400 });
    }

    // Validate that module exists
    const module = await ModuleService.getModuleById(assessmentData.moduleId);
    if (!module) {
      return NextResponse.json({ 
        error: 'Module not found' 
      }, { status: 400 });
    }

    // Add creator information
    assessmentData.educatorId = user.uid;
    assessmentData.educatorName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    assessmentData.maxScore = assessmentData.maxScore || 100; // Default to 100
    
    const assessment = await ModuleService.createAssessment(assessmentData);
    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}