import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// POST /api/educator/module-feedback - Create or update module feedback in student_progress
export async function POST(request) {
  try {
    const authResult = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (!authResult.success) {
      return NextResponse.json({ 
        error: authResult.error 
      }, { status: authResult.error === 'Unauthorized' ? 401 : 403 });
    }
    const user = authResult.user;

    const { studentId, moduleId, feedback, isRepeatModule } = await request.json();
    
    // Validate required fields
    if (!studentId || !moduleId || !feedback) {
      return NextResponse.json({ 
        error: 'studentId, moduleId, and feedback are required' 
      }, { status: 400 });
    }

    // Check if module exists
    const moduleDoc = await adminDb.collection('modules').doc(moduleId).get();
    if (!moduleDoc.exists) {
      return NextResponse.json({ error: 'Module not found' }, { status: 400 });
    }

    // Check if student exists
    const studentDoc = await adminDb.collection('users').doc(studentId).get();
    if (!studentDoc.exists || studentDoc.data().role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 400 });
    }

    // Check if student progress record exists for this module
    const existingProgressQuery = await adminDb.collection('student_progress')
      .where('studentId', '==', studentId)
      .where('moduleId', '==', moduleId)
      .limit(1)
      .get();

    const feedbackData = {
      educatorFeedback: feedback.trim(),
      isRepeatModule: Boolean(isRepeatModule),
      feedbackEducatorId: user.uid,
      feedbackEducatorName: `${user.firstName || 'Unknown'} ${user.lastName || 'User'}`,
      feedbackUpdatedAt: new Date()
    };

    let progressRef;
    let updatedProgress;
    
    if (!existingProgressQuery.empty) {
      // Update existing progress record with feedback
      const existingDoc = existingProgressQuery.docs[0];
      progressRef = existingDoc.ref;
      await progressRef.update({
        ...feedbackData,
        updatedAt: new Date()
      });
      
      // Get the updated record
      const updatedDoc = await progressRef.get();
      updatedProgress = { id: updatedDoc.id, ...updatedDoc.data() };
    } else {
      // Create new progress record with feedback (and default values)
      progressRef = adminDb.collection('student_progress').doc();
      const progressData = {
        id: progressRef.id,
        studentId: studentId,
        moduleId: moduleId,
        marks: 0, // Default mark - can be updated later
        score: 0, // Default score - can be updated later
        status: 'not_started',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...feedbackData,
        feedbackCreatedAt: new Date()
      };
      
      await progressRef.set(progressData);
      updatedProgress = { id: progressRef.id, ...progressData };
    }

    return NextResponse.json({ 
      success: true,
      feedback: {
        id: updatedProgress.id,
        studentId: updatedProgress.studentId,
        moduleId: updatedProgress.moduleId,
        feedback: updatedProgress.educatorFeedback,
        isRepeatModule: updatedProgress.isRepeatModule,
        educatorId: updatedProgress.feedbackEducatorId,
        educatorName: updatedProgress.feedbackEducatorName,
        createdAt: updatedProgress.feedbackCreatedAt || updatedProgress.createdAt,
        updatedAt: updatedProgress.feedbackUpdatedAt
      },
      message: 'Module feedback saved successfully in student progress'
    }, { status: 200 });

  } catch (error) {
    console.error('Error saving module feedback:', error);
    return NextResponse.json({ 
      error: 'Failed to save module feedback',
      details: error.message 
    }, { status: 500 });
  }
}

// GET /api/educator/module-feedback - Get module feedback from student_progress collection
export async function GET(request) {
  try {
    const authResult = await authenticateAPIRequest(request, ['educator', 'admin', 'student']);
    if (!authResult.success) {
      return NextResponse.json({ 
        error: authResult.error 
      }, { status: authResult.error === 'Unauthorized' ? 401 : 403 });
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const moduleId = searchParams.get('moduleId');
    const onlyRepeatModules = searchParams.get('onlyRepeatModules') === 'true';

    // For students, they can only access their own feedback
    if (user.role === 'student' && user.uid !== studentId) {
      return NextResponse.json({ 
        error: 'Access denied. Students can only view their own feedback' 
      }, { status: 403 });
    }

    let query = adminDb.collection('student_progress');

    // Apply filters - use simple queries to avoid index requirements
    if (studentId && moduleId) {
      // Most common case - specific student and module
      query = query.where('studentId', '==', studentId).where('moduleId', '==', moduleId);
    } else if (studentId) {
      query = query.where('studentId', '==', studentId);
    } else if (moduleId) {
      query = query.where('moduleId', '==', moduleId);
    }

    let snapshot;
    try {
      // Get results without ordering to avoid index requirements
      snapshot = await query.get();
    } catch (indexError) {
      console.error('Error fetching student progress:', indexError);
      return NextResponse.json({ success: false, error: 'Failed to fetch feedback' }, { status: 500 });
    }
    
    const feedbacks = [];
    for (const doc of snapshot.docs) {
      const progressData = { id: doc.id, ...doc.data() };
      
      // Only include records that have feedback
      if (!progressData.educatorFeedback) {
        continue;
      }
      
      // Filter by educator if needed (only show feedback from current educator unless admin)
      if (user.role === 'educator' && progressData.feedbackEducatorId !== user.uid) {
        continue;
      }
      
      // Filter by repeat modules if requested
      if (onlyRepeatModules && !progressData.isRepeatModule) {
        continue;
      }
      
      // Transform to feedback format
      const feedbackData = {
        id: progressData.id,
        studentId: progressData.studentId,
        moduleId: progressData.moduleId,
        feedback: progressData.educatorFeedback,
        isRepeatModule: progressData.isRepeatModule || false,
        educatorId: progressData.feedbackEducatorId,
        educatorName: progressData.feedbackEducatorName,
        createdAt: progressData.feedbackCreatedAt || progressData.createdAt,
        updatedAt: progressData.feedbackUpdatedAt || progressData.updatedAt
      };
      
      // Get module details
      try {
        const moduleDoc = await adminDb.collection('modules').doc(progressData.moduleId).get();
        if (moduleDoc.exists) {
          feedbackData.moduleTitle = moduleDoc.data().title || moduleDoc.data().name;
        }
      } catch (err) {
        console.warn('Failed to get module details:', err);
      }
      
      // Get student details (only if not the student themselves)
      if (user.role !== 'student') {
        try {
          const studentDoc = await adminDb.collection('users').doc(progressData.studentId).get();
          if (studentDoc.exists) {
            const studentData = studentDoc.data();
            feedbackData.studentName = `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim();
          }
        } catch (err) {
          console.warn('Failed to get student details:', err);
        }
      }
      
      feedbacks.push(feedbackData);
    }

    // Sort in JavaScript if we couldn't sort in the query
    feedbacks.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime - aTime;
    });

    return NextResponse.json({ 
      success: true,
      feedbacks: feedbacks
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching module feedback:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch module feedback',
      details: error.message 
    }, { status: 500 });
  }
}
