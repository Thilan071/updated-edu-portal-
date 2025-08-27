import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/submissions - Get all submissions for educator or specific student submissions
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator', 'student']);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const moduleId = searchParams.get('moduleId');
    const studentId = searchParams.get('studentId');
    const educatorId = searchParams.get('educatorId');

    let query = adminDb.collection('submissions');

    // Filter based on user role and parameters
    if (user.role === 'student') {
      query = query.where('studentId', '==', user.uid);
    } else if (educatorId) {
      query = query.where('educatorId', '==', educatorId);
    }

    if (assignmentId) {
      query = query.where('assignmentId', '==', assignmentId);
    }

    if (moduleId) {
      query = query.where('moduleId', '==', moduleId);
    }

    if (studentId && (user.role === 'admin' || user.role === 'educator')) {
      query = query.where('studentId', '==', studentId);
    }

    const submissionsSnapshot = await query.orderBy('submittedAt', 'desc').get();
    const submissions = [];

    for (const doc of submissionsSnapshot.docs) {
      const submissionData = doc.data();
      
      // Get student details
      const studentDoc = await adminDb.collection('users').doc(submissionData.studentId).get();
      const studentData = studentDoc.exists ? studentDoc.data() : null;

      // Get assignment details
      const assignmentDoc = await adminDb.collection('assignment_templates')
        .doc(submissionData.assignmentId).get();
      const assignmentData = assignmentDoc.exists ? assignmentDoc.data() : null;

      // Get module details
      const moduleDoc = await adminDb.collection('modules').doc(submissionData.moduleId).get();
      const moduleData = moduleDoc.exists ? moduleDoc.data() : null;

      submissions.push({
        id: doc.id,
        ...submissionData,
        student: studentData ? {
          id: submissionData.studentId,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          email: studentData.email,
          studentId: studentData.studentId
        } : null,
        assignment: assignmentData ? {
          id: submissionData.assignmentId,
          title: assignmentData.title,
          description: assignmentData.description
        } : null,
        module: moduleData ? {
          id: submissionData.moduleId,
          title: moduleData.title,
          name: moduleData.name
        } : null
      });
    }

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// POST /api/submissions - Create a new submission
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student']);
    if (error) return error;

    const { assignmentId, moduleId, submissionText, fileUrl, submissionType = 'pdf' } = await request.json();

    if (!assignmentId || !moduleId) {
      return NextResponse.json({ error: 'Assignment ID and Module ID are required' }, { status: 400 });
    }

    if (!submissionText && !fileUrl) {
      return NextResponse.json({ error: 'Either submission text or file URL is required' }, { status: 400 });
    }

    // Check if assignment exists and is active
    const assignmentDoc = await adminDb.collection('assignment_templates').doc(assignmentId).get();
    if (!assignmentDoc.exists) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignmentData = assignmentDoc.data();
    if (!assignmentData.isActive) {
      return NextResponse.json({ error: 'Assignment is not active' }, { status: 400 });
    }

    // Check if student already submitted
    const existingSubmission = await adminDb.collection('submissions')
      .where('studentId', '==', user.uid)
      .where('assignmentId', '==', assignmentId)
      .where('moduleId', '==', moduleId)
      .get();

    if (!existingSubmission.empty) {
      return NextResponse.json({ error: 'Submission already exists for this assignment' }, { status: 400 });
    }

    // Get educator ID from assignment
    const educatorId = assignmentData.educatorId || assignmentData.createdBy;

    // Create submission
    const submissionData = {
      studentId: user.uid,
      assignmentId,
      moduleId,
      educatorId,
      submissionText: submissionText || '',
      fileUrl: fileUrl || '',
      submissionType,
      status: 'submitted',
      submittedAt: new Date(),
      aiGrade: null,
      aiAnalysis: null,
      aiProgress: 'pending', // pending, processing, completed, failed
      finalGrade: null,
      educatorFeedback: '',
      isGraded: false,
      gradedAt: null,
      gradedBy: null,
      reviewStatus: 'pending', // pending, under_review, reviewed
      lastViewedBy: null,
      lastViewedAt: null,
      submissionVersion: 1,
      fileLocation: fileUrl || '', // Store file location for easy access
      submissionTime: new Date(), // Explicit submission time field
      metadata: {
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        submissionMethod: 'web_portal'
      }
    };

    // Create submission in main collection
    const submissionRef = await adminDb.collection('submissions').add(submissionData);
    const submissionId = submissionRef.id;

    // Also store in student's subcollection for easy access
    const studentSubmissionData = {
      ...submissionData,
      submissionId: submissionId,
      assignmentTitle: assignmentData.title || 'Unknown Assignment',
      moduleTitle: '', // Will be populated below
      maxPoints: assignmentData.maxScore || assignmentData.maxPoints || 100
    };

    // Get module title for student subcollection
    try {
      const moduleDoc = await adminDb.collection('modules').doc(moduleId).get();
      if (moduleDoc.exists) {
        studentSubmissionData.moduleTitle = moduleDoc.data().title || moduleDoc.data().name || 'Unknown Module';
      }
    } catch (moduleError) {
      console.error('Error fetching module data:', moduleError);
    }

    // Store in student's submissions subcollection
    await adminDb.collection('users').doc(user.uid)
      .collection('submissions').doc(submissionId).set(studentSubmissionData);

    return NextResponse.json({ 
      message: 'Submission created successfully',
      submissionId: submissionId,
      submission: { id: submissionId, ...submissionData }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}