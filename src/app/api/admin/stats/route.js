import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/admin/stats - Get system-wide statistics for admin dashboard
export async function GET(request) {
  try {
    const authResult = await authenticateAPIRequest(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    console.log('📊 Fetching admin system statistics...');

    // Get all required data in parallel
    const [
      studentsData,
      educatorsData,
      modulesData,
      participationData,
      enrollmentsData,
      progressData,
      assessmentsData
    ] = await Promise.all([
      getStudentsStats(),
      getEducatorsStats(),
      getModulesStats(),
      getParticipationStats(),
      getEnrollmentsStats(),
      getProgressStats(),
      getAssessmentsStats()
    ]);

    // Calculate comprehensive system statistics
    const stats = {
      overview: {
        totalStudents: studentsData.total,
        activeStudents: studentsData.active,
        totalEducators: educatorsData.total,
        activeEducators: educatorsData.active,
        totalModules: modulesData.total,
        activeModules: modulesData.active,
        systemUptime: calculateUptime()
      },
      participation: {
        totalParticipationRecords: participationData.total,
        averageAttendanceRate: participationData.averageAttendance,
        criticalRiskStudents: participationData.criticalRisk,
        warningLevelStudents: participationData.warningLevel,
        goodStandingStudents: participationData.goodStanding
      },
      academic: {
        totalEnrollments: enrollmentsData.total,
        activeEnrollments: enrollmentsData.active,
        completedModules: progressData.completedModules,
        averageProgress: progressData.averageProgress,
        totalAssessments: assessmentsData.total,
        completedAssessments: assessmentsData.completed
      },
      performance: {
        systemAverageGPA: progressData.averageGPA,
        passRate: progressData.passRate,
        retentionRate: calculateRetentionRate(studentsData, enrollmentsData),
        engagementScore: calculateEngagementScore(participationData, progressData)
      }
    };

    console.log('✅ Admin statistics calculated successfully');
    console.log('📊 Stats summary:', {
      totalStudents: stats.overview.totalStudents,
      totalModules: stats.overview.totalModules,
      systemAverage: stats.participation.averageAttendanceRate,
      criticalRiskStudents: stats.participation.criticalRiskStudents,
      warningLevelStudents: stats.participation.warningLevelStudents
    });

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error fetching admin statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper functions to fetch and calculate statistics
async function getStudentsStats() {
  const snapshot = await adminDb.collection('users')
    .where('role', '==', 'student')
    .get();
  
  const students = snapshot.docs.map(doc => doc.data());
  const activeStudents = students.filter(student => 
    student.status === 'approved' || student.status === 'active'
  );

  return {
    total: students.length,
    active: activeStudents.length,
    data: students
  };
}

async function getEducatorsStats() {
  const snapshot = await adminDb.collection('users')
    .where('role', '==', 'educator')
    .get();
  
  const educators = snapshot.docs.map(doc => doc.data());
  const activeEducators = educators.filter(educator => 
    educator.status === 'approved' || educator.status === 'active'
  );

  return {
    total: educators.length,
    active: activeEducators.length,
    data: educators
  };
}

async function getModulesStats() {
  const snapshot = await adminDb.collection('modules').get();
  const modules = snapshot.docs.map(doc => doc.data());
  
  // Consider modules with session tracking as active
  const activeModules = modules.filter(module => 
    module.hasParticipationTracking === true
  );

  return {
    total: modules.length,
    active: activeModules.length,
    data: modules
  };
}

async function getParticipationStats() {
  const snapshot = await adminDb.collection('participation').get();
  const participation = snapshot.docs.map(doc => doc.data());
  
  if (participation.length === 0) {
    return {
      total: 0,
      averageAttendance: 0,
      criticalRisk: 0,
      warningLevel: 0,
      goodStanding: 0
    };
  }

  const averageAttendance = Math.round(
    participation.reduce((sum, p) => sum + (p.attendancePercentage || 0), 0) / participation.length
  );

  const criticalRisk = participation.filter(p => p.status === 'critical').length;
  const warningLevel = participation.filter(p => p.status === 'warning').length;
  const goodStanding = participation.filter(p => p.status === 'good').length;

  return {
    total: participation.length,
    averageAttendance,
    criticalRisk,
    warningLevel,
    goodStanding,
    data: participation
  };
}

async function getEnrollmentsStats() {
  let totalEnrollments = 0;
  let activeEnrollments = 0;

  // Get enrollments from all users
  const usersSnapshot = await adminDb.collection('users')
    .where('role', '==', 'student')
    .get();

  for (const userDoc of usersSnapshot.docs) {
    const enrollmentsSnapshot = await adminDb.collection('users')
      .doc(userDoc.id)
      .collection('enrollments')
      .get();
    
    totalEnrollments += enrollmentsSnapshot.size;
    
    // Count active enrollments (assuming enrollments without end date are active)
    enrollmentsSnapshot.docs.forEach(doc => {
      const enrollment = doc.data();
      if (!enrollment.completedAt && !enrollment.droppedAt) {
        activeEnrollments++;
      }
    });
  }

  return {
    total: totalEnrollments,
    active: activeEnrollments
  };
}

async function getProgressStats() {
  const snapshot = await adminDb.collection('student_progress').get();
  const progress = snapshot.docs.map(doc => doc.data());
  
  if (progress.length === 0) {
    return {
      completedModules: 0,
      averageProgress: 0,
      averageGPA: 0,
      passRate: 0
    };
  }

  const completedModules = progress.filter(p => p.status === 'completed').length;
  
  // Calculate average progress (marks)
  const progressWithMarks = progress.filter(p => p.marks && p.marks > 0);
  const averageProgress = progressWithMarks.length > 0 
    ? Math.round(progressWithMarks.reduce((sum, p) => sum + parseFloat(p.marks), 0) / progressWithMarks.length)
    : 0;

  // Calculate average GPA (assuming marks are out of 100 and converting to 4.0 scale)
  const averageGPA = progressWithMarks.length > 0
    ? Math.round((averageProgress / 100 * 4.0) * 100) / 100
    : 0;

  // Calculate pass rate (70% or higher)
  const passedAssessments = progressWithMarks.filter(p => parseFloat(p.marks) >= 70).length;
  const passRate = progressWithMarks.length > 0
    ? Math.round((passedAssessments / progressWithMarks.length) * 100)
    : 0;

  return {
    completedModules,
    averageProgress,
    averageGPA,
    passRate,
    data: progress
  };
}

async function getAssessmentsStats() {
  const snapshot = await adminDb.collection('assessments').get();
  const assessments = snapshot.docs.map(doc => doc.data());
  
  // Count completed assessments based on submissions or progress
  const progressSnapshot = await adminDb.collection('student_progress').get();
  const completedAssessments = progressSnapshot.docs.filter(doc => {
    const progress = doc.data();
    return progress.status === 'completed' || (progress.marks && progress.marks > 0);
  }).length;

  return {
    total: assessments.length,
    completed: completedAssessments,
    data: assessments
  };
}

// Calculate system uptime (simplified - in real system would track actual uptime)
function calculateUptime() {
  // For demo purposes, assume 99.9% uptime
  return {
    percentage: 99.9,
    lastDowntime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    totalDowntime: '2 hours' // this month
  };
}

// Calculate retention rate
function calculateRetentionRate(studentsData, enrollmentsData) {
  if (studentsData.total === 0) return 0;
  
  // Simple retention calculation: active enrollments vs total students
  const retentionRate = Math.round((enrollmentsData.active / studentsData.total) * 100);
  return Math.min(retentionRate, 100); // Cap at 100%
}

// Calculate engagement score based on participation and progress
function calculateEngagementScore(participationData, progressData) {
  if (participationData.total === 0) return 0;
  
  // Weighted score: 60% attendance + 40% academic progress
  const attendanceScore = participationData.averageAttendance;
  const academicScore = progressData.averageProgress;
  
  const engagementScore = Math.round((attendanceScore * 0.6) + (academicScore * 0.4));
  return engagementScore;
}