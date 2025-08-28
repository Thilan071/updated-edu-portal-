import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/participation/analytics - Get participation analytics for graphs and statistics
export async function GET(request) {
  try {
    const authResult = await authenticateAPIRequest(request, ['admin', 'educator']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const timeRange = searchParams.get('timeRange') || '30'; // days

    console.log('📊 Fetching participation analytics...');

    // Get participation data
    let participationQuery = adminDb.collection('participation');
    
    if (moduleId && moduleId !== 'all') {
      participationQuery = participationQuery.where('moduleId', '==', moduleId);
    }

    const participationSnapshot = await participationQuery.get();
    const participationData = participationSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get modules data for reference
    const modulesSnapshot = await adminDb.collection('modules').get();
    const modulesData = modulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate analytics
    const analytics = {
      attendanceOverview: calculateAttendanceOverview(participationData),
      moduleComparison: calculateModuleComparison(participationData, modulesData),
      attendanceTrends: calculateAttendanceTrends(participationData),
      participationDistribution: calculateParticipationDistribution(participationData),
      sessionAnalysis: calculateSessionAnalysis(participationData),
      riskAnalysis: calculateRiskAnalysis(participationData)
    };

    console.log('✅ Participation analytics calculated successfully');

    return NextResponse.json({
      success: true,
      analytics,
      totalRecords: participationData.length
    });

  } catch (error) {
    console.error('❌ Error fetching participation analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper functions for analytics calculations
function calculateAttendanceOverview(participationData) {
  if (participationData.length === 0) return {};

  const totalStudents = participationData.length;
  const totalSessions = participationData.reduce((sum, p) => sum + p.totalSessions, 0);
  const totalAttended = participationData.reduce((sum, p) => sum + p.attendedSessions, 0);
  const overallAttendanceRate = Math.round((totalAttended / totalSessions) * 100);

  const statusDistribution = participationData.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalStudents,
    totalSessions,
    totalAttended,
    overallAttendanceRate,
    statusDistribution: [
      { status: 'Good', count: statusDistribution.good || 0, color: '#10b981' },
      { status: 'Warning', count: statusDistribution.warning || 0, color: '#f59e0b' },
      { status: 'Critical', count: statusDistribution.critical || 0, color: '#ef4444' }
    ]
  };
}

function calculateModuleComparison(participationData, modulesData) {
  const moduleStats = {};
  
  participationData.forEach(p => {
    if (!moduleStats[p.moduleId]) {
      moduleStats[p.moduleId] = {
        moduleName: p.moduleName,
        students: 0,
        totalSessions: 0,
        attendedSessions: 0,
        avgParticipationScore: 0
      };
    }
    
    moduleStats[p.moduleId].students += 1;
    moduleStats[p.moduleId].totalSessions += p.totalSessions;
    moduleStats[p.moduleId].attendedSessions += p.attendedSessions;
    moduleStats[p.moduleId].avgParticipationScore += p.averageParticipationScore || 0;
  });

  return Object.values(moduleStats).map(stat => ({
    module: stat.moduleName.length > 15 ? stat.moduleName.substring(0, 15) + '...' : stat.moduleName,
    attendanceRate: Math.round((stat.attendedSessions / stat.totalSessions) * 100),
    avgParticipation: Math.round(stat.avgParticipationScore / stat.students * 10) / 10,
    studentCount: stat.students
  }));
}

function calculateAttendanceTrends(participationData) {
  // Calculate weekly attendance trends (last 12 weeks)
  const weeklyData = {};
  const currentDate = new Date();
  
  // Initialize last 12 weeks
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - (i * 7));
    const weekKey = `Week ${12 - i}`;
    weeklyData[weekKey] = { attended: 0, total: 0 };
  }

  // Sample data generation for trends (in real implementation, this would use actual session dates)
  participationData.forEach(participation => {
    const attendanceRecords = participation.attendanceRecords || [];
    const sessionsPerWeek = Math.ceil(participation.totalSessions / 12);
    
    Object.keys(weeklyData).forEach((week, index) => {
      const weekSessions = attendanceRecords.slice(index * sessionsPerWeek, (index + 1) * sessionsPerWeek);
      weeklyData[week].total += weekSessions.length;
      weeklyData[week].attended += weekSessions.filter(s => s.attended).length;
    });
  });

  return Object.entries(weeklyData).map(([week, data]) => ({
    week,
    attendanceRate: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0,
    totalSessions: data.total,
    attendedSessions: data.attended
  }));
}

function calculateParticipationDistribution(participationData) {
  const ranges = [
    { label: '90-100%', min: 90, max: 100, count: 0 },
    { label: '80-89%', min: 80, max: 89, count: 0 },
    { label: '70-79%', min: 70, max: 79, count: 0 },
    { label: '60-69%', min: 60, max: 69, count: 0 },
    { label: '50-59%', min: 50, max: 59, count: 0 },
    { label: 'Below 50%', min: 0, max: 49, count: 0 }
  ];

  participationData.forEach(p => {
    const attendanceRate = p.attendancePercentage;
    const range = ranges.find(r => attendanceRate >= r.min && attendanceRate <= r.max);
    if (range) range.count++;
  });

  return ranges;
}

function calculateSessionAnalysis(participationData) {
  if (participationData.length === 0) return {};

  // Analyze by session number to find patterns
  const sessionStats = {};
  const maxSessions = Math.max(...participationData.map(p => p.totalSessions));

  for (let sessionNum = 1; sessionNum <= Math.min(maxSessions, 20); sessionNum++) {
    sessionStats[sessionNum] = { attended: 0, total: 0 };
  }

  participationData.forEach(participation => {
    const attendanceRecords = participation.attendanceRecords || [];
    attendanceRecords.forEach(record => {
      if (record.sessionNumber <= 20 && sessionStats[record.sessionNumber]) {
        sessionStats[record.sessionNumber].total++;
        if (record.attended) {
          sessionStats[record.sessionNumber].attended++;
        }
      }
    });
  });

  return Object.entries(sessionStats).map(([sessionNum, data]) => ({
    session: `Session ${sessionNum}`,
    attendanceRate: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0,
    totalStudents: data.total
  })).slice(0, 10); // Show first 10 sessions
}

function calculateRiskAnalysis(participationData) {
  const riskFactors = {
    criticalAttendance: participationData.filter(p => p.attendancePercentage < 50).length,
    warningAttendance: participationData.filter(p => p.attendancePercentage >= 50 && p.attendancePercentage < 75).length,
    lowParticipation: participationData.filter(p => (p.averageParticipationScore || 0) < 2).length,
    consistentAbsence: participationData.filter(p => {
      const records = p.attendanceRecords || [];
      const recentRecords = records.slice(-5); // Last 5 sessions
      const recentAttendance = recentRecords.filter(r => r.attended).length;
      return recentAttendance <= 2;
    }).length
  };

  const totalStudents = participationData.length;

  return {
    riskFactors,
    riskPercentages: {
      criticalAttendance: totalStudents > 0 ? Math.round((riskFactors.criticalAttendance / totalStudents) * 100) : 0,
      warningAttendance: totalStudents > 0 ? Math.round((riskFactors.warningAttendance / totalStudents) * 100) : 0,
      lowParticipation: totalStudents > 0 ? Math.round((riskFactors.lowParticipation / totalStudents) * 100) : 0,
      consistentAbsence: totalStudents > 0 ? Math.round((riskFactors.consistentAbsence / totalStudents) * 100) : 0
    },
    recommendedActions: generateRecommendations(riskFactors, totalStudents)
  };
}

function generateRecommendations(riskFactors, totalStudents) {
  const recommendations = [];

  if (riskFactors.criticalAttendance > 0) {
    recommendations.push({
      priority: 'high',
      action: `${riskFactors.criticalAttendance} students have critical attendance (<50%)`,
      suggestion: 'Schedule immediate intervention meetings'
    });
  }

  if (riskFactors.warningAttendance > totalStudents * 0.3) {
    recommendations.push({
      priority: 'medium',
      action: 'High number of students with warning-level attendance',
      suggestion: 'Implement attendance improvement program'
    });
  }

  if (riskFactors.lowParticipation > 0) {
    recommendations.push({
      priority: 'medium',
      action: `${riskFactors.lowParticipation} students have low participation scores`,
      suggestion: 'Review engagement strategies and class activities'
    });
  }

  return recommendations;
}