import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// POST /api/educator/module-feedback - Create or update module feedback
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

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

    // Check if feedback already exists
    const existingFeedbackQuery = await adminDb.collection('module_feedback')
      .where('studentId', '==', studentId)
      .where('moduleId', '==', moduleId)
      .where('educatorId', '==', user.uid)
      .limit(1)
      .get();

    const feedbackData = {
      studentId: studentId,
      moduleId: moduleId,
      educatorId: user.uid,
      educatorName: `${user.firstName || 'Unknown'} ${user.lastName || 'User'}`,
      feedback: feedback.trim(),
      isRepeatModule: Boolean(isRepeatModule),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let feedbackRef;
    
    if (!existingFeedbackQuery.empty) {
      // Update existing feedback
      const existingDoc = existingFeedbackQuery.docs[0];
      feedbackRef = existingDoc.ref;
      delete feedbackData.createdAt; // Don't update creation time
      await feedbackRef.update(feedbackData);
    } else {
      // Create new feedback record
      feedbackRef = adminDb.collection('module_feedback').doc();
      feedbackData.id = feedbackRef.id;
      await feedbackRef.set(feedbackData);
    }

    // Get the updated feedback record
    const updatedDoc = await feedbackRef.get();
    const updatedFeedback = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ 
      success: true,
      feedback: updatedFeedback,
      message: 'Module feedback saved successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error saving module feedback:', error);
    return NextResponse.json({ 
      error: 'Failed to save module feedback',
      details: error.message 
    }, { status: 500 });
  }
}

// GET /api/educator/module-feedback - Get module feedback for student/module
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin', 'student']);
    if (error) return error;

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

    let query = adminDb.collection('module_feedback');

    // Apply filters - use simple queries to avoid index requirements
    if (studentId && moduleId) {
      // Most common case - specific student and module
      query = query.where('studentId', '==', studentId).where('moduleId', '==', moduleId);
    } else if (studentId) {
      query = query.where('studentId', '==', studentId);
    } else if (moduleId) {
      query = query.where('moduleId', '==', moduleId);
    }

    // For educators, only show their own feedback unless they're admin
    if (user.role === 'educator') {
      // We'll filter this after getting the results to avoid complex compound queries
    }

    let snapshot;
    try {
      // Get results without ordering to avoid index requirements
      snapshot = await query.get();
    } catch (indexError) {
      console.error('Error fetching feedback:', indexError);
      return Response.json({ success: false, error: 'Failed to fetch feedback' }, { status: 500 });
    }
    
    const feedbacks = [];
    for (const doc of snapshot.docs) {
      const feedbackData = { id: doc.id, ...doc.data() };
      
      // Filter by educator if needed (post-query filtering)
      if (user.role === 'educator' && feedbackData.educatorId !== user.uid) {
        continue;
      }
      
      // Filter by repeat modules if requested
      if (onlyRepeatModules && !feedbackData.isRepeatModule) {
        continue;
      }
      
      // Get module details
      try {
        const moduleDoc = await adminDb.collection('modules').doc(feedbackData.moduleId).get();
        if (moduleDoc.exists) {
          feedbackData.moduleTitle = moduleDoc.data().title || moduleDoc.data().name;
        }
      } catch (err) {
        console.warn('Failed to get module details:', err);
      }
      
      // Get student details (only if not the student themselves)
      if (user.role !== 'student') {
        try {
          const studentDoc = await adminDb.collection('users').doc(feedbackData.studentId).get();
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
