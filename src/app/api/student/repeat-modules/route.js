import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/student/repeat-modules - Get modules where student scored below 50%
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student', 'educator', 'admin']);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    let studentId = searchParams.get('studentId');
    
    // Students can only view their own repeat modules
    if (user.role === 'student') {
      studentId = user.uid;
    } else if (!studentId) {
      return NextResponse.json({ 
        error: 'studentId parameter is required for educators and admins' 
      }, { status: 400 });
    }

    try {
      // Get student progress where marks/score < 50
      const progressQuery = adminDb.collection('student_progress')
        .where('studentId', '==', studentId);
      
      const progressSnapshot = await progressQuery.get();
      
      const repeatModules = [];
      
      for (const doc of progressSnapshot.docs) {
        const progressData = doc.data();
        const score = progressData.marks || progressData.score || 0;
        
        // Only include modules with score below 50%
        if (score < 50) {
          try {
            // Get module details
            const moduleDoc = await adminDb.collection('modules').doc(progressData.moduleId).get();
            if (moduleDoc.exists) {
              const moduleData = moduleDoc.data();
              
              repeatModules.push({
                moduleId: progressData.moduleId,
                moduleName: moduleData.title || moduleData.name,
                lastScore: score,
                currentAttempt: progressData.attemptNumber || 2, // Default to 2nd attempt
                gradedAt: progressData.gradedAt,
                status: progressData.status,
                progress: 0 // Will be calculated separately if needed
              });
            }
          } catch (moduleError) {
            console.warn('Failed to get module details for:', progressData.moduleId, moduleError);
          }
        }
      }

      // Sort by score (lowest first) to prioritize modules that need most attention
      repeatModules.sort((a, b) => a.lastScore - b.lastScore);

      return NextResponse.json({ 
        success: true,
        repeatModules: repeatModules,
        count: repeatModules.length
      }, { status: 200 });

    } catch (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json({ 
        error: 'Failed to query student progress',
        details: queryError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error fetching repeat modules:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch repeat modules',
      details: error.message 
    }, { status: 500 });
  }
}
