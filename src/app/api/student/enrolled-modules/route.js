import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import { adminDb } from '@/lib/firebaseAdmin';
import { ModuleService } from '@/lib/moduleService';

// GET /api/student/enrolled-modules - Get student's enrolled modules with goal statistics
export async function GET(request) {
  try {
    const authResult = await authenticateAPIRequest(request, ['student', 'educator', 'admin']);
    if (!authResult.success) {
      return NextResponse.json({ 
        error: authResult.error 
      }, { status: authResult.error === 'Unauthorized' ? 401 : 403 });
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || user.uid;

    // Students can only access their own data unless they're educators/admins
    if (user.role === 'student' && user.uid !== studentId) {
      return NextResponse.json({ 
        error: 'Access denied. Students can only view their own modules' 
      }, { status: 403 });
    }

    try {
      // Get student's enrollments
      const enrollments = await ModuleService.getStudentEnrollments(studentId);
      
      if (!enrollments || enrollments.length === 0) {
        return NextResponse.json({ 
          success: true,
          modules: [],
          totalModules: 0,
          message: 'No enrolled modules found'
        }, { status: 200 });
      }

      const enrolledModules = [];
      
      // Process each enrollment to get modules
      for (const enrollment of enrollments) {
        const course = await ModuleService.getCourseById(enrollment.courseId);
        
        if (course && course.moduleIds && Array.isArray(course.moduleIds)) {
          for (const moduleId of course.moduleIds) {
            const moduleData = await ModuleService.getModuleById(moduleId);
            
            if (moduleData) {
              // Get predefined goals count (simplified)
              let predefinedGoalsCount = 0;
              try {
                const predefinedGoalsSnapshot = await adminDb
                  .collection('modules')
                  .doc(moduleId)
                  .collection('predefined_goals')
                  .get();
                predefinedGoalsCount = predefinedGoalsSnapshot.docs.filter(doc => doc.data().isActive !== false).length;
              } catch (predefinedError) {
                console.warn('Error fetching predefined goals count:', predefinedError);
                predefinedGoalsCount = 0;
              }

              // Get AI-generated goals count for this student (simplified)
              let aiGoalsCount = 0;
              try {
                const aiGoalsSnapshot = await adminDb
                  .collection('users')
                  .doc(studentId)
                  .collection('goals')
                  .get();
                aiGoalsCount = aiGoalsSnapshot.docs.filter(doc => {
                  const data = doc.data();
                  return data.moduleId === moduleId && data.type === 'ai_generated';
                }).length;
              } catch (aiError) {
                console.warn('Error fetching AI goals count:', aiError);
                aiGoalsCount = 0;
              }

              // Get goal progress for this module (simplified)
              let completedGoals = 0;
              try {
                const goalProgressSnapshot = await adminDb
                  .collection('goalProgress')
                  .where('userId', '==', studentId)
                  .get();
                completedGoals = goalProgressSnapshot.docs.filter(doc => {
                  const data = doc.data();
                  const moduleName = moduleData.title || moduleData.name;
                  return data.moduleName === moduleName && data.completed === true;
                }).length;
              } catch (progressError) {
                console.warn('Error fetching goal progress:', progressError);
                completedGoals = 0;
              }

              const totalGoals = predefinedGoalsCount + aiGoalsCount;
              const progressPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

              // Get student progress for this module
              let studentProgress = [];
              let completion = { percentage: 0, status: 'not_started' };
              try {
                studentProgress = await ModuleService.getStudentProgress(studentId, moduleId) || [];
                completion = await ModuleService.calculateModuleCompletion(studentId, moduleId) || { percentage: 0, status: 'not_started' };
              } catch (progressError) {
                console.warn('Error fetching module progress:', progressError);
              }

              enrolledModules.push({
                id: moduleId,
                title: moduleData.title || moduleData.name,
                description: moduleData.description,
                difficulty: moduleData.difficulty || 'intermediate',
                estimatedHours: moduleData.estimatedHours || 0,
                courseTitle: course.title || course.name,
                courseId: course.id,
                goals: {
                  predefinedCount: predefinedGoalsCount,
                  aiGeneratedCount: aiGoalsCount,
                  totalCount: totalGoals,
                  completedCount: completedGoals,
                  progressPercentage: progressPercentage
                },
                progress: studentProgress,
                completion: completion,
                enrollment: enrollment
              });
            }
          }
        }
      }

      // Calculate overall statistics
      const totalModules = enrolledModules.length;
      const totalGoals = enrolledModules.reduce((sum, module) => sum + module.goals.totalCount, 0);
      const totalCompletedGoals = enrolledModules.reduce((sum, module) => sum + module.goals.completedCount, 0);
      const overallProgress = totalGoals > 0 ? Math.round((totalCompletedGoals / totalGoals) * 100) : 0;

      // Sort modules by course and then by title
      enrolledModules.sort((a, b) => {
        if (a.courseTitle !== b.courseTitle) {
          return a.courseTitle.localeCompare(b.courseTitle);
        }
        return a.title.localeCompare(b.title);
      });

      return NextResponse.json({ 
        success: true,
        modules: enrolledModules,
        statistics: {
          totalModules,
          totalGoals,
          totalCompletedGoals,
          overallProgress,
          modulesWithGoals: enrolledModules.filter(m => m.goals.totalCount > 0).length,
          modulesCompleted: enrolledModules.filter(m => m.completion.status === 'completed').length
        }
      }, { status: 200 });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to fetch enrolled modules',
        details: dbError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error fetching enrolled modules:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch enrolled modules',
      details: error.message 
    }, { status: 500 });
  }
}