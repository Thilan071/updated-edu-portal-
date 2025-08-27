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

    // Get submissions from main collection - simplest possible query to avoid index issues
    let query = adminDb.collection('submissions');
    
    // For now, get all submissions and filter in JavaScript to avoid index issues
    const submissionsSnapshot = await query.limit(500).get();
    const submissions = [];

    // Also get project assignments from the submissions collection  
    let projectAssignmentsQuery = adminDb.collection('submissions')
      .where('submissionType', '==', 'project_assignment');
    
    const projectAssignmentsSnapshot = await projectAssignmentsQuery.limit(500).get();

    // Process regular submissions
    for (const doc of submissionsSnapshot.docs) {
      const submissionData = doc.data();
      
      // Skip project assignments that are already handled separately
      if (submissionData.submissionType === 'project_assignment') {
        continue;
      }
      
      // Filter by all criteria in JavaScript to avoid index issues
      if (user.role === 'educator') {
        if (submissionData.educatorId && submissionData.educatorId !== user.uid) {
          continue;
        }
      } else if (educatorId) {
        if (submissionData.educatorId && submissionData.educatorId !== educatorId) {
          continue;
        }
      }
      
      // Apply other filters in JavaScript
      if (moduleId && submissionData.moduleId !== moduleId) {
        continue;
      }
      if (assignmentId && submissionData.assignmentId !== assignmentId) {
        continue;
      }
      if (status && submissionData.status !== status) {
        continue;
      }
      
      // Get student details
      const studentDoc = await adminDb.collection('users').doc(submissionData.studentId).get();
      const studentData = studentDoc.exists ? studentDoc.data() : null;

      // Get assignment details - check module subcollection first
      let assignmentData = null;
      try {
        const moduleAssignmentDoc = await adminDb.collection('modules')
          .doc(submissionData.moduleId)
          .collection('assignment_templates')
          .doc(submissionData.assignmentId)
          .get();
        
        if (moduleAssignmentDoc.exists) {
          assignmentData = moduleAssignmentDoc.data();
        } else {
          // Fallback to root collection
          const assignmentDoc = await adminDb.collection('assignment_templates')
            .doc(submissionData.assignmentId).get();
          if (assignmentDoc.exists) {
            assignmentData = assignmentDoc.data();
          }
        }
      } catch (assignmentError) {
        console.error('Error fetching assignment:', assignmentError);
      }

      // Get module details
      const moduleDoc = await adminDb.collection('modules').doc(submissionData.moduleId).get();
      const moduleData = moduleDoc.exists ? moduleDoc.data() : null;

      // Get reference solution data for this assignment
      let referenceSolution = null;
      try {
        // Simplified query to avoid index requirement - get all references for this assignment
        const referencesSnapshot = await adminDb.collection('assignment_references')
          .where('assignmentId', '==', submissionData.assignmentId)
          .get();
        
        if (!referencesSnapshot.empty) {
          // Sort in JavaScript to get the most recent
          const references = referencesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
          }));
          
          // Sort by creation date descending
          references.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
          });
          
          const referenceData = references[0];
          referenceSolution = {
            id: referenceData.id,
            fileName: referenceData.fileName,
            contentType: referenceData.contentAnalysis?.contentType || 'unknown',
            complexity: referenceData.contentAnalysis?.complexity || 'medium',
            suggestedScore: referenceData.maxScore || 100,
            hasTextExtraction: referenceData.textExtractionSuccessful || false,
            processingCompleted: referenceData.processingCompleted || false,
            createdAt: referenceData.createdAt,
            keyTopics: referenceData.contentAnalysis?.keyTopics || []
          };
        }
      } catch (referenceError) {
        console.error('Error fetching reference solution:', referenceError);
      }

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
        submissionType: submissionData.submissionType || 'regular',
        // Enhanced fields from student subcollection
        assignmentTitle: studentSubmissionData?.assignmentTitle || assignmentData?.title,
        moduleTitle: studentSubmissionData?.moduleTitle || moduleData?.title,
        maxPoints: studentSubmissionData?.maxPoints || assignmentData?.maxScore || 100,
        submissionTime: submissionData.submissionTime || submissionData.submittedAt,
        fileLocation: submissionData.fileLocation || submissionData.fileUrl,
        metadata: submissionData.metadata || {},
        student: studentData ? {
          id: submissionData.studentId,
          firstName: studentData.firstName || studentData.name?.split(' ')[0] || 'Unknown',
          lastName: studentData.lastName || studentData.name?.split(' ').slice(1).join(' ') || 'Student',
          email: studentData.email,
          studentId: studentData.studentId || studentData.uid
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
        } : null,
        referenceSolution: referenceSolution
      });
    }

    // Process project assignments
    for (const doc of projectAssignmentsSnapshot.docs) {
      const submissionData = doc.data();
      
      // Filter by educator if needed (for project assignments, educator info might be in assignment)
      if (user.role === 'educator') {
        // Check if this educator is associated with this submission
        // We'll be more permissive here since project assignments might not have educatorId set properly
        // For now, include all project assignments for educators
      } else if (educatorId) {
        if (submissionData.educatorId && submissionData.educatorId !== educatorId) {
          continue;
        }
      }
      
      // Apply other filters in JavaScript
      if (moduleId && submissionData.moduleId !== moduleId) {
        continue;
      }
      if (assignmentId && submissionData.assignmentId !== assignmentId) {
        continue;
      }
      if (status && submissionData.status !== status) {
        continue;
      }
      
      // Get student details
      const studentDoc = await adminDb.collection('users').doc(submissionData.studentId).get();
      const studentData = studentDoc.exists ? studentDoc.data() : null;

      // Get assignment details from module subcollection
      let assignmentData = null;
      try {
        const moduleAssignmentDoc = await adminDb.collection('modules')
          .doc(submissionData.moduleId)
          .collection('assignment_templates')
          .doc(submissionData.assignmentId)
          .get();
        
        if (moduleAssignmentDoc.exists) {
          assignmentData = moduleAssignmentDoc.data();
        }
      } catch (assignmentError) {
        console.error('Error fetching assignment for project assignment:', assignmentError);
      }

      // Get module details
      const moduleDoc = await adminDb.collection('modules').doc(submissionData.moduleId).get();
      const moduleData = moduleDoc.exists ? moduleDoc.data() : null;

      // Get reference solution data for this assignment
      let referenceSolution = null;
      try {
        // Simplified query to avoid index requirement - get all references for this assignment
        const referencesSnapshot = await adminDb.collection('assignment_references')
          .where('assignmentId', '==', submissionData.assignmentId)
          .get();
        
        if (!referencesSnapshot.empty) {
          // Sort in JavaScript to get the most recent
          const references = referencesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
          }));
          
          // Sort by creation date descending
          references.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
          });
          
          const referenceData = references[0];
          referenceSolution = {
            id: referenceData.id,
            fileName: referenceData.fileName,
            contentType: referenceData.contentAnalysis?.contentType || 'unknown',
            complexity: referenceData.contentAnalysis?.complexity || 'medium',
            suggestedScore: referenceData.maxScore || 100,
            hasTextExtraction: referenceData.textExtractionSuccessful || false,
            processingCompleted: referenceData.processingCompleted || false,
            createdAt: referenceData.createdAt,
            keyTopics: referenceData.contentAnalysis?.keyTopics || []
          };
        }
      } catch (referenceError) {
        console.error('Error fetching reference solution for project assignment:', referenceError);
      }

      submissions.push({
        id: doc.id,
        ...submissionData,
        submissionType: 'project_assignment',
        // Use existing fields from project assignment
        assignmentTitle: submissionData.assignmentTitle || assignmentData?.title,
        moduleTitle: submissionData.moduleTitle || moduleData?.title,
        maxPoints: submissionData.maxScore || assignmentData?.maxScore || 100,
        submissionTime: submissionData.submittedAt,
        fileLocation: submissionData.fileUrl,
        metadata: submissionData.metadata || {},
        student: studentData ? {
          id: submissionData.studentId,
          firstName: studentData.firstName || studentData.name?.split(' ')[0] || 'Unknown',
          lastName: studentData.lastName || studentData.name?.split(' ').slice(1).join(' ') || 'Student',
          email: studentData.email,
          studentId: studentData.studentId || studentData.uid
        } : null,
        assignment: {
          id: submissionData.assignmentId,
          title: submissionData.assignmentTitle || assignmentData?.title || 'Unknown Assignment',
          description: submissionData.assignmentDescription || assignmentData?.description || '',
          maxScore: submissionData.maxScore || assignmentData?.maxScore || 100
        },
        module: {
          id: submissionData.moduleId,
          title: submissionData.moduleTitle || moduleData?.title || moduleData?.name || 'Unknown Module',
          name: submissionData.moduleTitle || moduleData?.name || moduleData?.title || 'Unknown Module'
        },
        referenceSolution: referenceSolution
      });
    }

    // Sort all submissions by submission time
    submissions.sort((a, b) => {
      const dateA = new Date(a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : a.submittedAt);
      const dateB = new Date(b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : b.submittedAt);
      return dateB - dateA;
    });

    // Calculate statistics
    const stats = {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'submitted').length,
      aiGraded: submissions.filter(s => s.status === 'ai_graded' || s.aiGrade !== null).length,
      graded: submissions.filter(s => s.status === 'graded' || s.finalGrade !== null).length,
      needsReview: submissions.filter(s => (s.status === 'ai_graded' || s.aiGrade !== null) && (!s.aiConfidence || s.aiConfidence < 0.7)).length,
      aiProcessing: submissions.filter(s => s.aiProgress === 'processing').length,
      aiCompleted: submissions.filter(s => s.aiProgress === 'completed' || s.aiGrade !== null).length,
      aiFailed: submissions.filter(s => s.aiProgress === 'failed').length,
      projectAssignments: submissions.filter(s => s.submissionType === 'project_assignment').length,
      regularSubmissions: submissions.filter(s => s.submissionType !== 'project_assignment').length
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