import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/educators/[id]/students - Get students enrolled in educator's modules
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: educatorId } = await params;
    
    // Get educator's assigned modules
    const modulesSnapshot = await adminDb.collection('users')
      .doc(educatorId)
      .collection('modules')
      .get();
    
    const assignedModuleIds = modulesSnapshot.docs.map(doc => doc.data().moduleId);
    
    if (assignedModuleIds.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }
    
    // Get all enrollments for courses that contain these modules
    const coursesSnapshot = await adminDb.collection('programs')
      .where('moduleIds', 'array-contains-any', assignedModuleIds)
      .get();
    
    const courseIds = coursesSnapshot.docs.map(doc => doc.id);
    
    if (courseIds.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }
    
    // Get all users (students) and check their enrollments
    const usersSnapshot = await adminDb.collection('users')
      .where('role', '==', 'student')
      .get();
    
    const enrolledStudents = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const studentId = userDoc.id;
      const studentData = userDoc.data();
      
      // Check if student has enrollments in any of the courses
      const enrollmentsSnapshot = await adminDb.collection('users')
        .doc(studentId)
        .collection('enrollments')
        .where('courseId', 'in', courseIds)
        .get();
      
      if (!enrollmentsSnapshot.empty) {
        // Get student's progress for educator's modules
        const progressSnapshot = await adminDb.collection('student_progress')
          .where('studentId', '==', studentId)
          .where('moduleId', 'in', assignedModuleIds)
          .get();
        
        const moduleProgress = progressSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Get enrolled courses details
        const enrolledCourses = [];
        for (const enrollmentDoc of enrollmentsSnapshot.docs) {
          const enrollment = enrollmentDoc.data();
          const courseDoc = await adminDb.collection('programs').doc(enrollment.courseId).get();
          if (courseDoc.exists) {
            enrolledCourses.push({
              id: courseDoc.id,
              ...courseDoc.data(),
              enrolledAt: enrollment.enrolledAt
            });
          }
        }
        
        enrolledStudents.push({
          id: studentId,
          firstName: studentData.firstName || '',
          lastName: studentData.lastName || '',
          email: studentData.email || '',
          enrolledCourses,
          moduleProgress,
          totalModules: assignedModuleIds.length,
          completedModules: moduleProgress.filter(p => p.status === 'completed').length
        });
      }
    }
    
    return NextResponse.json({ data: enrolledStudents }, { status: 200 });
  } catch (error) {
    console.error('Error fetching educator students:', error);
    return NextResponse.json({ error: 'Failed to fetch educator students' }, { status: 500 });
  }
}