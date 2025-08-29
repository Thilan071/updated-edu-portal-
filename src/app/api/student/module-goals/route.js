import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';
import { adminDb } from '@/lib/firebaseAdmin';

// GET /api/student/module-goals - Get all goals for a specific module (predefined + AI-generated)
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
    const moduleId = searchParams.get('moduleId');
    const studentId = searchParams.get('studentId') || user.uid;

    if (!moduleId) {
      return NextResponse.json({ 
        error: 'moduleId parameter is required' 
      }, { status: 400 });
    }

    // Students can only access their own goals unless they're educators/admins
    if (user.role === 'student' && user.uid !== studentId) {
      return NextResponse.json({ 
        error: 'Access denied. Students can only view their own goals' 
      }, { status: 403 });
    }

    try {
      // Get module information
      const moduleDoc = await adminDb.collection('modules').doc(moduleId).get();
      if (!moduleDoc.exists) {
        return NextResponse.json({ 
          error: 'Module not found' 
        }, { status: 404 });
      }
      const moduleData = { id: moduleDoc.id, ...moduleDoc.data() };

      // Get predefined goals for this module (simplified query)
      let predefinedGoals = [];
      try {
        const predefinedGoalsSnapshot = await adminDb
          .collection('modules')
          .doc(moduleId)
          .collection('predefined_goals')
          .get();

        predefinedGoals = predefinedGoalsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'predefined'
          }))
          .filter(goal => goal.isActive !== false) // Filter active goals
          .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order
      } catch (predefinedError) {
        console.warn('Error fetching predefined goals:', predefinedError);
        predefinedGoals = [];
      }

      // Get AI-generated goals for this student and module (simplified query)
      let aiGoals = [];
      try {
        const aiGoalsSnapshot = await adminDb
          .collection('users')
          .doc(studentId)
          .collection('goals')
          .get();

        aiGoals = aiGoalsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'ai_generated'
          }))
          .filter(goal => goal.moduleId === moduleId && goal.type === 'ai_generated')
          .sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return bDate - aDate;
          });
      } catch (aiError) {
        console.warn('Error fetching AI goals:', aiError);
        aiGoals = [];
      }

      // Get student's goal progress (simplified query)
      let progressMap = {};
      try {
        const goalProgressSnapshot = await adminDb
          .collection('goalProgress')
          .where('userId', '==', studentId)
          .get();

        goalProgressSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Filter by module name to match current module
          if (data.moduleName === moduleData.title || data.moduleName === moduleData.name) {
            progressMap[data.goalId] = {
              completed: data.completed || false,
              progress: data.progress || 0,
              lastUpdated: data.lastUpdated
            };
          }
        });
      } catch (progressError) {
        console.warn('Error fetching goal progress:', progressError);
        progressMap = {};
      }

      // Combine goals with progress information
      const allGoals = [...predefinedGoals, ...aiGoals].map(goal => ({
        ...goal,
        progress: progressMap[goal.id] || { completed: false, progress: 0 }
      }));

      // Calculate overall progress for this module
      const totalGoals = allGoals.length;
      const completedGoals = allGoals.filter(goal => goal.progress.completed).length;
      const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      return NextResponse.json({ 
        success: true,
        module: moduleData,
        goals: {
          predefined: predefinedGoals.map(goal => ({
            ...goal,
            progress: progressMap[goal.id] || { completed: false, progress: 0 }
          })),
          aiGenerated: aiGoals.map(goal => ({
            ...goal,
            progress: progressMap[goal.id] || { completed: false, progress: 0 }
          })),
          all: allGoals
        },
        stats: {
          totalGoals,
          completedGoals,
          overallProgress,
          predefinedGoalsCount: predefinedGoals.length,
          aiGoalsCount: aiGoals.length
        }
      }, { status: 200 });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to fetch module goals',
        details: dbError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error fetching module goals:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch module goals',
      details: error.message 
    }, { status: 500 });
  }
}

// POST /api/student/module-goals - Save AI-generated goals to user's subcollection
export async function POST(request) {
  try {
    const authResult = await authenticateAPIRequest(request, ['student']);
    if (!authResult.success) {
      return NextResponse.json({ 
        error: authResult.error 
      }, { status: authResult.error === 'Unauthorized' ? 401 : 403 });
    }
    const user = authResult.user;

    const { moduleId, goals } = await request.json();

    if (!moduleId || !goals || !Array.isArray(goals)) {
      return NextResponse.json({ 
        error: 'moduleId and goals array are required' 
      }, { status: 400 });
    }

    try {
      // Get module information
      const moduleDoc = await adminDb.collection('modules').doc(moduleId).get();
      if (!moduleDoc.exists) {
        return NextResponse.json({ 
          error: 'Module not found' 
        }, { status: 404 });
      }
      const moduleData = moduleDoc.data();

      // Save goals to user's goals subcollection
      const batch = adminDb.batch();
      const savedGoals = [];

      for (const goal of goals) {
        const goalRef = adminDb
          .collection('users')
          .doc(user.uid)
          .collection('goals')
          .doc();

        const goalData = {
          id: goalRef.id,
          moduleId: moduleId,
          moduleName: moduleData.title || moduleData.name,
          title: goal.goal_title || goal.title,
          description: goal.goal_description || goal.description,
          category: goal.category || 'ai_generated',
          difficulty: goal.difficulty || 'intermediate',
          priority: goal.priority_level || goal.priority || 'medium',
          estimatedHours: goal.estimated_hours || 5,
          type: 'ai_generated',
          source: 'ml_api',
          isActive: true,
          completed: false,
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        batch.set(goalRef, goalData);
        savedGoals.push(goalData);
      }

      await batch.commit();

      return NextResponse.json({ 
        success: true,
        message: `Successfully saved ${savedGoals.length} AI-generated goals`,
        savedGoals: savedGoals
      }, { status: 201 });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to save AI-generated goals',
        details: dbError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error saving AI-generated goals:', error);
    return NextResponse.json({ 
      error: 'Failed to save AI-generated goals',
      details: error.message 
    }, { status: 500 });
  }
}