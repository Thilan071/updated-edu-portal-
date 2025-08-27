import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { db } from '../../../../lib/firebaseAdmin';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const userId = session.user.id;
    
    // Get user's enrollments to find courses
    const enrollmentsRef = db.collection('users').doc(userId).collection('enrollments');
    const enrollmentsSnapshot = await enrollmentsRef.where('status', '==', 'active').get();
    
    const grades = [];
    
    // For each enrollment, check for grades/assessments
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      
      // Check for grades in the enrollment document
      if (enrollment.grades && Array.isArray(enrollment.grades)) {
        grades.push(...enrollment.grades.map(grade => ({
          ...grade,
          courseId: enrollment.courseId,
          courseName: enrollment.courseName,
          enrollmentId: enrollmentDoc.id
        })));
      }
      
      // You can also check for assessments/grades in a subcollection if needed
      const gradesRef = enrollmentDoc.ref.collection('grades');
      const gradesSnapshot = await gradesRef.get();
      
      gradesSnapshot.docs.forEach(gradeDoc => {
        grades.push({
          id: gradeDoc.id,
          ...gradeDoc.data(),
          courseId: enrollment.courseId,
          courseName: enrollment.courseName,
          enrollmentId: enrollmentDoc.id
        });
      });
    }
    
    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching student grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}