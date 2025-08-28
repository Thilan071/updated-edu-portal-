import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/participation - Get participation data with filtering options
export async function GET(request) {
  try {
    const authResult = await authenticateAPIRequest(request, ['admin', 'educator', 'student']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error === 'Unauthorized' ? 401 : 403 }
      );
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 50;

    let query = adminDb.collection('participation');

    // Filter based on user role
    if (user.role === 'student') {
      query = query.where('studentId', '==', user.uid);
    } else if (studentId && (user.role === 'admin' || user.role === 'educator')) {
      query = query.where('studentId', '==', studentId);
    }

    // Apply filters
    if (moduleId && moduleId !== 'all') {
      query = query.where('moduleId', '==', moduleId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    // Execute query
    const participationSnapshot = await query
      .limit(limit)
      .get();

    const participationData = participationSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString() || doc.data().lastUpdated,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
    }));

    return NextResponse.json({
      success: true,
      participation: participationData,
      total: participationData.length
    });

  } catch (error) {
    console.error('Error fetching participation data:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch participation data', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/participation - Create or update participation record
export async function POST(request) {
  try {
    const authResult = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    const { 
      studentId, 
      moduleId, 
      sessionNumber, 
      attended, 
      attendanceTime, 
      lateMinutes = 0, 
      participationScore = 0 
    } = await request.json();

    if (!studentId || !moduleId || sessionNumber === undefined) {
      return NextResponse.json(
        { success: false, error: 'Student ID, Module ID, and Session Number are required' },
        { status: 400 }
      );
    }

    // Find existing participation record
    const participationQuery = await adminDb.collection('participation')
      .where('studentId', '==', studentId)
      .where('moduleId', '==', moduleId)
      .get();

    let participationDoc;
    let participationData;

    if (!participationQuery.empty) {
      // Update existing record
      participationDoc = participationQuery.docs[0];
      participationData = participationDoc.data();
      
      // Update the specific session in attendanceRecords
      const attendanceRecords = participationData.attendanceRecords || [];
      const sessionIndex = attendanceRecords.findIndex(r => r.sessionNumber === sessionNumber);
      
      if (sessionIndex !== -1) {
        attendanceRecords[sessionIndex] = {
          sessionNumber,
          attended,
          attendanceTime: attended ? attendanceTime || new Date() : null,
          lateMinutes: attended ? lateMinutes : 0,
          participationScore: attended ? participationScore : 0
        };
      } else {
        attendanceRecords.push({
          sessionNumber,
          attended,
          attendanceTime: attended ? attendanceTime || new Date() : null,
          lateMinutes: attended ? lateMinutes : 0,
          participationScore: attended ? participationScore : 0
        });
      }
      
      // Recalculate statistics
      const totalSessions = participationData.totalSessions;
      const attendedSessions = attendanceRecords.filter(r => r.attended).length;
      const attendancePercentage = Math.round((attendedSessions / totalSessions) * 100);
      const avgParticipationScore = attendanceRecords.reduce((sum, r) => sum + r.participationScore, 0) / totalSessions;
      
      const updateData = {
        attendanceRecords,
        attendedSessions,
        missedSessions: totalSessions - attendedSessions,
        attendancePercentage,
        averageParticipationScore: Math.round(avgParticipationScore * 10) / 10,
        totalParticipationPoints: Math.round(avgParticipationScore * totalSessions),
        status: attendancePercentage >= 75 ? 'good' : attendancePercentage >= 50 ? 'warning' : 'critical',
        lastUpdated: new Date()
      };
      
      await adminDb.collection('participation').doc(participationDoc.id).update(updateData);
      
      return NextResponse.json({
        success: true,
        message: 'Participation record updated successfully',
        participation: { id: participationDoc.id, ...participationData, ...updateData }
      });
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Participation record not found for this student and module' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error updating participation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update participation record' },
      { status: 500 }
    );
  }
}