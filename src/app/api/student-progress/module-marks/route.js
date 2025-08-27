import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// POST /api/student-progress/module-marks - Update module marks directly
export async function POST(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['educator', 'admin']);
    if (error) return error;

    const { studentId, moduleId, marks } = await request.json();
    
    // Validate required fields
    if (!studentId || !moduleId || marks === undefined) {
      return NextResponse.json({ 
        error: 'studentId, moduleId, and marks are required' 
      }, { status: 400 });
    }

    // Validate marks is between 0 and 100
    if (marks < 0 || marks > 100) {
      return NextResponse.json({ 
        error: 'Marks must be between 0 and 100' 
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

    // Check if progress record already exists
    const existingProgressQuery = await adminDb.collection('student_progress')
      .where('studentId', '==', studentId)
      .where('moduleId', '==', moduleId)
      .limit(1)
      .get();

    const progressData = {
      studentId: studentId,
      moduleId: moduleId,
      marks: marks,
      score: marks,
      status: marks >= 40 ? 'completed' : 'in_progress',
      gradedBy: user.uid,
      graderName: `${user.firstName || 'Unknown'} ${user.lastName || 'User'}`,
      gradedAt: new Date(),
      updatedAt: new Date()
    };

    let progressRef;
    
    if (!existingProgressQuery.empty) {
      // Update existing progress
      const existingDoc = existingProgressQuery.docs[0];
      progressRef = existingDoc.ref;
      await progressRef.update(progressData);
    } else {
      // Create new progress record
      progressRef = adminDb.collection('student_progress').doc();
      progressData.id = progressRef.id;
      progressData.createdAt = new Date();
      await progressRef.set(progressData);
    }

    // Get the updated progress record
    const updatedDoc = await progressRef.get();
    const updatedProgress = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ 
      success: true,
      progress: updatedProgress,
      message: 'Module marks updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating module marks:', error);
    return NextResponse.json({ 
      error: 'Failed to update module marks',
      details: error.message 
    }, { status: 500 });
  }
}
