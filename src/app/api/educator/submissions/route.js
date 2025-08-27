import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/educator/submissions - Get all submissions for educator with enhanced data
export async function GET(request) {
  try {
    const authResult = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const educatorId = searchParams.get('educatorId') || user.uid;
    const moduleId = searchParams.get('moduleId');
    const assignmentId = searchParams.get('assignmentId');
    const status = searchParams.get('status');

    // Get submissions from main collection
    let query = adminDb.collection('submissions');
    
    // Filter by educator
    if (user.role === 'educator') {
      query = query.where('educatorId', '==', user.uid);
    } else if (educatorId) {
      query = query.where('educatorId', '==', educatorId);
    }

    // Apply additional filters
    if (moduleId) {
      query = query.where('moduleId', '==', moduleId);
    }
    if (assignmentId) {
      query = query.where('assignmentId', '==', assignmentId);
    }
    if (status) {
      query = query.where('status', '==', status);
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

      // Get student's submission from subcollection for additional metadata
      let studentSubmissionData = null;
      try {
        const studentSubmissionDoc = await adminDb.collection('users')
          .doc(submissionData.studentId)
          .collection('submissions')
          .doc(doc.id)
          .get();
        
        if (studentSubmissionDoc.exists) {
          studentSubmissionData = studentSubmissionDoc.data();
        }
      } catch (subError) {
        console.error('Error fetching student submission data:', subError);
      }

      submissions.push({
        id: doc.id,
        ...submissionData,
        // Enhanced fields from student subcollection
        assignmentTitle: studentSubmissionData?.assignmentTitle || assignmentData?.title,
        moduleTitle: studentSubmissionData?.moduleTitle || moduleData?.title,
        maxPoints: studentSubmissionData?.maxPoints || assignmentData?.maxScore || 100,
        submissionTime: submissionData.submissionTime || submissionData.submittedAt,
        fileLocation: submissionData.fileLocation || submissionData.fileUrl,
        metadata: submissionData.metadata || {},
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
          description: assignmentData.description,
          maxScore: assignmentData.maxScore || assignmentData.maxPoints || 100
        } : null,
        module: moduleData ? {
          id: submissionData.moduleId,
          title: moduleData.title,
          name: moduleData.name
        } : null
      });
    }

    // Calculate statistics
    const stats = {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'submitted').length,
      aiGraded: submissions.filter(s => s.status === 'ai_graded').length,
      graded: submissions.filter(s => s.status === 'graded').length,
      needsReview: submissions.filter(s => s.status === 'ai_graded' && (!s.aiConfidence || s.aiConfidence < 0.7)).length,
      aiProcessing: submissions.filter(s => s.aiProgress === 'processing').length,
      aiCompleted: submissions.filter(s => s.aiProgress === 'completed').length,
      aiFailed: submissions.filter(s => s.aiProgress === 'failed').length
    };

    return NextResponse.json({ 
      submissions,
      stats,
      total: submissions.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching educator submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}