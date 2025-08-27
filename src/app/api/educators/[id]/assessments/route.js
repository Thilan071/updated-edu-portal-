import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/educators/[id]/assessments - Get assessments assigned by educator
export async function GET(request, { params }) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (error) return error;

    const { id: educatorId } = await params;
    
    // Get assessments created by this educator
    const assessmentsSnapshot = await adminDb.collection('assessments')
      .where('educatorId', '==', educatorId)
      .get();
    
    const assessments = [];
    
    for (const assessmentDoc of assessmentsSnapshot.docs) {
      const assessmentData = assessmentDoc.data();
      
      // Get module details if moduleId exists
      let moduleDetails = null;
      if (assessmentData.moduleId) {
        const moduleDoc = await adminDb.collection('modules').doc(assessmentData.moduleId).get();
        if (moduleDoc.exists) {
          moduleDetails = {
            id: moduleDoc.id,
            ...moduleDoc.data()
          };
        }
      }
      
      // Get student submissions for this assessment
      const submissionsSnapshot = await adminDb.collection('student_progress')
        .where('assessmentId', '==', assessmentDoc.id)
        .get();
      
      const submissions = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const totalSubmissions = submissions.length;
      const pendingSubmissions = submissions.filter(s => s.status === 'pending' || !s.status).length;
      const completedSubmissions = submissions.filter(s => s.status === 'completed').length;
      
      assessments.push({
        id: assessmentDoc.id,
        ...assessmentData,
        module: moduleDetails,
        submissions,
        stats: {
          totalSubmissions,
          pendingSubmissions,
          completedSubmissions
        }
      });
    }
    
    return NextResponse.json({ assessments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching educator assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch educator assessments' }, { status: 500 });
  }
}