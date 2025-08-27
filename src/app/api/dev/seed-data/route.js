import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { UserService } from '@/lib/userService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// POST /api/dev/seed-data - Create sample data for development (admin only)
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin']);
    if (error) return error;

    // Create sample modules
    const module1 = await ModuleService.createModule({
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript programming including variables, functions, and control structures.',
      duration: '4 weeks',
      level: 'beginner',
      isActive: true,
      createdBy: user.email
    });

    const module2 = await ModuleService.createModule({
      title: 'React Components',
      description: 'Understanding React component architecture, props, state, and lifecycle methods.',
      duration: '6 weeks',
      level: 'intermediate',
      isActive: true,
      createdBy: user.email
    });

    const module3 = await ModuleService.createModule({
      title: 'Database Design',
      description: 'Fundamentals of database design, normalization, and SQL queries.',
      duration: '5 weeks',
      level: 'intermediate',
      isActive: true,
      createdBy: user.email
    });

    // Create a sample course
    const course = await ModuleService.createCourse({
      title: 'Full Stack Web Development',
      description: 'Complete course covering frontend and backend web development.',
      moduleIds: [module1.id, module2.id, module3.id],
      duration: '15 weeks',
      level: 'beginner',
      isActive: true,
      createdBy: user.email,
      educatorId: user.uid,
      educatorName: user.name
    });

    // Create sample assessments
    const assessment1 = await ModuleService.createAssessment({
      title: 'JavaScript Basics Quiz',
      description: 'Test your understanding of JavaScript fundamentals',
      moduleId: module1.id,
      type: 'quiz',
      maxScore: 100,
      duration: 60,
      isActive: true,
      createdBy: user.email
    });

    const assessment2 = await ModuleService.createAssessment({
      title: 'React Components Practical',
      description: 'Build a React component following best practices',
      moduleId: module2.id,
      type: 'practical',
      maxScore: 100,
      duration: 120,
      isActive: true,
      createdBy: user.email
    });

    const assessment3 = await ModuleService.createAssessment({
      title: 'Database Design Final Exam',
      description: 'Comprehensive exam covering database design principles',
      moduleId: module3.id,
      type: 'exam',
      maxScore: 100,
      duration: 180,
      isActive: true,
      createdBy: user.email
    });

    // Find a student user to enroll (you'll need to create one first)
    // For now, we'll just return the created data
    
    return NextResponse.json({
      message: 'Sample data created successfully',
      data: {
        modules: [module1, module2, module3],
        course: course,
        assessments: [assessment1, assessment2, assessment3]
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sample data:', error);
    return NextResponse.json({ error: 'Failed to create sample data' }, { status: 500 });
  }
}

// GET /api/dev/seed-data - Get information about seeding data
export async function GET(request) {
  return NextResponse.json({
    message: 'Use POST to create sample data for development',
    instructions: [
      '1. Make sure you are logged in as an admin',
      '2. Send a POST request to this endpoint',
      '3. Sample modules, courses, and assessments will be created',
      '4. You can then enroll students in the created course'
    ]
  });
}