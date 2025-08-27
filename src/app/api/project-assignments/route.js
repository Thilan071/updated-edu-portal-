import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/project-assignments - Get project assignments for the current user
export async function GET(request) {
  try {
    const authResult = await authenticateAPIRequest(request, ['student', 'educator', 'admin']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const userRole = user.role || 'student';

    if (userRole === 'student') {
      // For students, return their own project assignments
      const projectAssignmentsSnapshot = await adminDb.collection('users').doc(user.uid)
        .collection('Project Assignment')
        .orderBy('submittedAt', 'desc')
        .get();

      const projectAssignments = [];
      for (const doc of projectAssignmentsSnapshot.docs) {
        const data = doc.data();
        projectAssignments.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.()?.toISOString() || data.submittedAt
        });
      }

      return NextResponse.json({ projectAssignments }, { status: 200 });
    } else {
      // For educators and admins, return all project assignments from all students
      console.log('🔍 Fetching all project assignments for educator/admin');
      
      // Get all submissions from the main submissions collection that are project assignments
      const submissionsSnapshot = await adminDb.collection('submissions')
        .where('submissionType', '==', 'project_assignment')
        .orderBy('submittedAt', 'desc')
        .get();

      const projectAssignments = [];
      const studentDetailsCache = new Map();

      for (const doc of submissionsSnapshot.docs) {
        const data = doc.data();
        
        // Get student details if not cached
        let studentDetails = studentDetailsCache.get(data.studentId);
        if (!studentDetails) {
          try {
            const studentDoc = await adminDb.collection('users').doc(data.studentId).get();
            if (studentDoc.exists) {
              const studentData = studentDoc.data();
              studentDetails = {
                name: studentData.name || studentData.displayName || 'Unknown Student',
                email: studentData.email || 'No email',
                studentId: studentData.studentId || data.studentId,
                profilePicture: studentData.profilePicture || null
              };
              studentDetailsCache.set(data.studentId, studentDetails);
            } else {
              studentDetails = {
                name: 'Unknown Student',
                email: 'No email',
                studentId: data.studentId,
                profilePicture: null
              };
            }
          } catch (studentError) {
            console.error('Error fetching student details:', studentError);
            studentDetails = {
              name: 'Unknown Student',
              email: 'No email',
              studentId: data.studentId,
              profilePicture: null
            };
          }
        }

        projectAssignments.push({
          id: doc.id,
          ...data,
          studentDetails,
          submittedAt: data.submittedAt?.toDate?.()?.toISOString() || data.submittedAt,
          gradedAt: data.gradedAt?.toDate?.()?.toISOString() || data.gradedAt,
          dueDate: data.dueDate?.toDate?.()?.toISOString() || data.dueDate
        });
      }

      console.log(`✅ Found ${projectAssignments.length} project assignments`);

      return NextResponse.json({ 
        projectAssignments,
        totalCount: projectAssignments.length,
        pendingReview: projectAssignments.filter(p => !p.isGraded).length,
        aiGraded: projectAssignments.filter(p => p.aiGrade !== null).length,
        finalGraded: projectAssignments.filter(p => p.finalGrade !== null).length
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error in project assignments GET:', error);
    return NextResponse.json({ error: 'Failed to get project assignments' }, { status: 500 });
  }
}

// POST /api/project-assignments - Submit a new project assignment
export async function POST(request) {
  try {
    console.log('🚀 Project assignments POST route hit');
    
    const authResult = await authenticateAPIRequest(request, ['student']);
    if (!authResult.success) {
      console.log('❌ Authentication error:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user;

    console.log('✅ User authenticated:', user.uid);

    const { 
      assignmentId, 
      moduleId, 
      submissionText, 
      fileUrl, 
      fileName,
      fileSize,
      aiAnalysis
    } = await request.json();

    console.log('📝 Request data:', { assignmentId, moduleId, submissionText: !!submissionText, fileUrl: !!fileUrl });

    // Validate required fields
    if (!assignmentId || !moduleId) {
      return NextResponse.json({ error: 'Assignment ID and Module ID are required' }, { status: 400 });
    }

    if (!submissionText && !fileUrl) {
      return NextResponse.json({ error: 'Either submission text or file URL is required' }, { status: 400 });
    }

    // Check if assignment exists and is active
    console.log('🔍 Checking assignment in module subcollection...');
    const assignmentDoc = await adminDb.collection('modules').doc(moduleId)
      .collection('assignment_templates').doc(assignmentId).get();
    
    if (!assignmentDoc.exists) {
      console.log('❌ Assignment not found');
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignmentData = assignmentDoc.data();
    console.log('📋 Assignment data:', { title: assignmentData.title, isActive: assignmentData.isActive });
    
    if (!assignmentData.isActive) {
      return NextResponse.json({ error: 'Assignment is not active' }, { status: 400 });
    }

    // Get module details
    const moduleDoc = await adminDb.collection('modules').doc(moduleId).get();
    const moduleData = moduleDoc.exists ? moduleDoc.data() : null;

    // Check if student already submitted this project assignment
    const existingProjectAssignment = await adminDb.collection('users').doc(user.uid)
      .collection('Project Assignment')
      .where('assignmentId', '==', assignmentId)
      .where('moduleId', '==', moduleId)
      .get();

    if (!existingProjectAssignment.empty) {
      return NextResponse.json({ error: 'Project assignment already submitted for this assignment' }, { status: 400 });
    }

    // Create project assignment data
    const projectAssignmentData = {
      studentId: user.uid,
      assignmentId,
      moduleId,
      assignmentTitle: assignmentData.title || 'Unknown Assignment',
      assignmentDescription: assignmentData.description || '',
      moduleTitle: moduleData?.title || moduleData?.name || 'Unknown Module',
      maxScore: assignmentData.maxScore || assignmentData.maxPoints || 100,
      dueDate: assignmentData.dueDate || null,
      
      // Submission details
      submissionText: submissionText || '',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      
      // Status and timestamps
      status: 'submitted',
      submittedAt: new Date(),
      type: 'project_assignment',
      
      // AI Analysis if available
      aiAnalysis: aiAnalysis || null,
      aiProgressPercentage: aiAnalysis?.progressPercentage || null,
      
      // Grading fields
      aiGrade: null,
      finalGrade: null,
      educatorFeedback: '',
      isGraded: false,
      gradedAt: null,
      gradedBy: null,
      
      // Additional metadata
      metadata: {
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        submissionMethod: 'web_portal',
        submissionVersion: 1
      },
      
      // Course and academic context
      educatorId: assignmentData.educatorId || assignmentData.createdBy || null,
      academicYear: new Date().getFullYear(),
      semester: Math.ceil((new Date().getMonth() + 1) / 6) // Simple semester calculation
    };

    console.log('💾 Creating project assignment in subcollection...');

    // Create project assignment in user's subcollection
    const projectAssignmentRef = await adminDb.collection('users').doc(user.uid)
      .collection('Project Assignment').add(projectAssignmentData);

    const projectAssignmentId = projectAssignmentRef.id;
    console.log('✅ Project assignment created with ID:', projectAssignmentId);

    // Also create in main submissions collection for educator access
    const mainSubmissionData = {
      ...projectAssignmentData,
      projectAssignmentId: projectAssignmentId,
      submissionType: 'project_assignment'
    };

    const mainSubmissionRef = await adminDb.collection('submissions').add(mainSubmissionData);
    console.log('✅ Main submission created with ID:', mainSubmissionRef.id);
    
    // Update the project assignment with main submission ID
    await projectAssignmentRef.update({
      mainSubmissionId: mainSubmissionRef.id
    });

    // Update student's submissions subcollection as well for backwards compatibility
    const studentSubmissionData = {
      ...mainSubmissionData,
      submissionId: mainSubmissionRef.id,
      projectAssignmentId: projectAssignmentId
    };

    await adminDb.collection('users').doc(user.uid)
      .collection('submissions').doc(mainSubmissionRef.id).set(studentSubmissionData);

    console.log('🎉 Project assignment submission complete!');

    return NextResponse.json({ 
      message: 'Project assignment submitted successfully',
      projectAssignmentId: projectAssignmentId,
      submissionId: mainSubmissionRef.id,
      projectAssignment: { 
        id: projectAssignmentId, 
        ...projectAssignmentData,
        mainSubmissionId: mainSubmissionRef.id
      }
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error submitting project assignment:', error);
    return NextResponse.json({ error: 'Failed to submit project assignment' }, { status: 500 });
  }
}
