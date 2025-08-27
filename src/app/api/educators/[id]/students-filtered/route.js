import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/educators/[id]/students-filtered - Get students filtered by batch and module
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: educatorId } = await params;
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const moduleId = searchParams.get('moduleId');
    
    console.log('Filtering students with:', { batchId, moduleId });
    
    let students = [];
    
    if (batchId) {
      // Get students in the specific batch
      const usersSnapshot = await adminDb.collection('users')
        .where('role', '==', 'student')
        .where('currentBatchId', '==', batchId)
        .get();
      
      for (const userDoc of usersSnapshot.docs) {
        const studentId = userDoc.id;
        const studentData = userDoc.data();
        
        // Get student's enrollments
        const enrollmentsSnapshot = await adminDb.collection('users')
          .doc(studentId)
          .collection('enrollments')
          .where('status', '==', 'active')
          .get();
        
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
        
        // Get student's progress for all modules
        const progressSnapshot = await adminDb.collection('student_progress')
          .where('studentId', '==', studentId)
          .get();
        
        const moduleProgress = progressSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // If moduleId is specified, filter progress for that module only
        let relevantProgress = moduleProgress;
        let totalModules = 1;
        let completedModules = 0;
        
        if (moduleId) {
          relevantProgress = moduleProgress.filter(p => p.moduleId === moduleId);
          totalModules = 1;
          completedModules = relevantProgress.filter(p => p.status === 'completed').length;
        } else {
          // Count all modules in the batch's program
          if (enrolledCourses.length > 0) {
            const programModuleIds = enrolledCourses[0].moduleIds || [];
            totalModules = programModuleIds.length;
            completedModules = moduleProgress.filter(p => 
              programModuleIds.includes(p.moduleId) && p.status === 'completed'
            ).length;
          }
        }
        
        students.push({
          id: studentId,
          firstName: studentData.firstName || '',
          lastName: studentData.lastName || '',
          email: studentData.email || '',
          studentId: studentData.studentId || '',
          currentBatchId: studentData.currentBatchId || '',
          currentBatchName: studentData.currentBatchName || '',
          enrolledCourses,
          moduleProgress: relevantProgress,
          totalModules,
          completedModules
        });
      }
    } else {
      // If no batch is selected, return all students
      const usersSnapshot = await adminDb.collection('users')
        .where('role', '==', 'student')
        .get();
      
      for (const userDoc of usersSnapshot.docs) {
        const studentId = userDoc.id;
        const studentData = userDoc.data();
        
        // Get student's enrollments
        const enrollmentsSnapshot = await adminDb.collection('users')
          .doc(studentId)
          .collection('enrollments')
          .where('status', '==', 'active')
          .get();
        
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
        
        // Get student's progress
        const progressSnapshot = await adminDb.collection('student_progress')
          .where('studentId', '==', studentId)
          .get();
        
        const moduleProgress = progressSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calculate total and completed modules
        let totalModules = 0;
        let completedModules = 0;
        
        if (moduleId) {
          const relevantProgress = moduleProgress.filter(p => p.moduleId === moduleId);
          totalModules = 1;
          completedModules = relevantProgress.filter(p => p.status === 'completed').length;
        } else {
          // Count all modules across all enrolled courses
          const allModuleIds = new Set();
          enrolledCourses.forEach(course => {
            if (course.moduleIds) {
              course.moduleIds.forEach(moduleId => allModuleIds.add(moduleId));
            }
          });
          totalModules = allModuleIds.size;
          completedModules = moduleProgress.filter(p => 
            allModuleIds.has(p.moduleId) && p.status === 'completed'
          ).length;
        }
        
        students.push({
          id: studentId,
          firstName: studentData.firstName || '',
          lastName: studentData.lastName || '',
          email: studentData.email || '',
          studentId: studentData.studentId || '',
          currentBatchId: studentData.currentBatchId || '',
          currentBatchName: studentData.currentBatchName || '',
          enrolledCourses,
          moduleProgress: moduleId ? moduleProgress.filter(p => p.moduleId === moduleId) : moduleProgress,
          totalModules,
          completedModules
        });
      }
    }
    
    return NextResponse.json({ data: students }, { status: 200 });
  } catch (error) {
    console.error('Error fetching filtered students:', error);
    return NextResponse.json({ error: 'Failed to fetch filtered students' }, { status: 500 });
  }
}
