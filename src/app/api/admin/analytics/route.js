import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/admin/analytics - Get comprehensive analytics data
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['admin']);
    if (error) return error;

    console.log('📊 Fetching analytics data...');

    // Get all required data in parallel
    const [
      studentsData,
      progressData,
      enrollmentsData,
      modulesData,
      assessmentsData,
      submissionsData
    ] = await Promise.all([
      getStudentsData(),
      getProgressData(),
      getEnrollmentsData(),
      getModulesData(),
      getAssessmentsData(),
      getSubmissionsData()
    ]);

    // Process the data for analytics
    const analytics = {
      progressTrend: calculateProgressTrend(progressData),
      assessmentCompletion: calculateAssessmentCompletion(assessmentsData, progressData),
      attendanceLogs: calculateAttendance(enrollmentsData, progressData),
      repeatAnalysis: calculateRepeats(progressData, assessmentsData),
      riskDistribution: calculateRiskDistribution(studentsData, progressData),
      studentProgressSnapshot: generateStudentSnapshot(studentsData, progressData)
    };

    console.log('✅ Analytics data processed successfully');

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper functions to fetch data from Firebase
async function getStudentsData() {
  const snapshot = await adminDb.collection('users')
    .where('role', '==', 'student')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function getProgressData() {
  const snapshot = await adminDb.collection('student_progress').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt) || new Date()
  }));
}

async function getEnrollmentsData() {
  const allEnrollments = [];
  const usersSnapshot = await adminDb.collection('users')
    .where('role', '==', 'student')
    .get();
  
  for (const userDoc of usersSnapshot.docs) {
    const enrollmentsSnapshot = await adminDb.collection('users')
      .doc(userDoc.id)
      .collection('enrollments')
      .get();
    
    enrollmentsSnapshot.docs.forEach(doc => {
      allEnrollments.push({
        id: doc.id,
        studentId: userDoc.id,
        ...doc.data()
      });
    });
  }
  
  return allEnrollments;
}

async function getModulesData() {
  const snapshot = await adminDb.collection('modules').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function getAssessmentsData() {
  const snapshot = await adminDb.collection('assessments').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function getSubmissionsData() {
  const snapshot = await adminDb.collection('submissions').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    submittedAt: doc.data().submittedAt?.toDate?.() || new Date(doc.data().submittedAt) || new Date()
  }));
}

// Analytics calculation functions
function calculateProgressTrend(progressData) {
  // Group progress by month over the last 5 months
  const now = new Date();
  const months = [];
  
  // Generate last 5 months
  for (let i = 4; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      date,
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      avg: 0,
      count: 0
    });
  }

  // Calculate average progress for each month
  progressData.forEach(progress => {
    if (progress.marks && progress.createdAt) {
      const progressDate = progress.createdAt;
      const monthIndex = months.findIndex(m => 
        progressDate.getMonth() === m.date.getMonth() &&
        progressDate.getFullYear() === m.date.getFullYear()
      );
      
      if (monthIndex !== -1) {
        months[monthIndex].avg += parseFloat(progress.marks);
        months[monthIndex].count += 1;
      }
    }
  });

  // Calculate averages
  return months.map(month => ({
    month: month.month,
    avg: month.count > 0 ? Math.round(month.avg / month.count) : 0
  }));
}

function calculateAssessmentCompletion(assessmentsData, progressData) {
  // Get modules with assessments
  const moduleStats = {};
  
  assessmentsData.forEach(assessment => {
    if (!moduleStats[assessment.moduleId]) {
      moduleStats[assessment.moduleId] = {
        moduleName: assessment.moduleTitle || assessment.moduleId,
        totalAssessments: 0,
        completedCount: 0
      };
    }
    moduleStats[assessment.moduleId].totalAssessments += 1;
  });

  // Count completed assessments
  progressData.forEach(progress => {
    if (progress.moduleId && progress.status === 'completed' && moduleStats[progress.moduleId]) {
      moduleStats[progress.moduleId].completedCount += 1;
    }
  });

  // Calculate completion percentages
  return Object.values(moduleStats).map(stat => ({
    module: stat.moduleName.length > 10 ? stat.moduleName.substring(0, 10) : stat.moduleName,
    completed: stat.totalAssessments > 0 ? 
      Math.round((stat.completedCount / stat.totalAssessments) * 100) : 0
  })).slice(0, 5); // Limit to top 5 modules
}

function calculateAttendance(enrollmentsData, progressData) {
  // Calculate participation based on progress submissions
  const moduleParticipation = {};
  
  // Count expected vs actual participation
  enrollmentsData.forEach(enrollment => {
    if (enrollment.courseId) {
      const studentProgress = progressData.filter(p => p.studentId === enrollment.studentId);
      
      studentProgress.forEach(progress => {
        if (progress.moduleId) {
          if (!moduleParticipation[progress.moduleId]) {
            moduleParticipation[progress.moduleId] = {
              moduleName: progress.moduleTitle || progress.moduleId,
              total: 0,
              attended: 0
            };
          }
          moduleParticipation[progress.moduleId].total += 1;
          if (progress.status === 'completed' || progress.marks > 0) {
            moduleParticipation[progress.moduleId].attended += 1;
          }
        }
      });
    }
  });

  return Object.values(moduleParticipation)
    .filter(item => item.total > 0)
    .map(item => ({
      module: item.moduleName.length > 10 ? item.moduleName.substring(0, 10) : item.moduleName,
      total: item.total,
      attended: item.attended
    }))
    .slice(0, 5); // Limit to top 5 modules
}

function calculateRepeats(progressData, assessmentsData) {
  // Count students who have multiple attempts at same assessment
  const repeatCounts = {};
  const studentAssessments = {};

  progressData.forEach(progress => {
    if (progress.studentId && progress.assessmentId) {
      const key = `${progress.studentId}-${progress.assessmentId}`;
      if (!studentAssessments[key]) {
        studentAssessments[key] = {
          moduleId: progress.moduleId,
          count: 0
        };
      }
      studentAssessments[key].count += 1;
    }
  });

  // Count repeats by module
  Object.values(studentAssessments).forEach(attempt => {
    if (attempt.count > 1 && attempt.moduleId) {
      const moduleName = attempt.moduleId;
      if (!repeatCounts[moduleName]) {
        repeatCounts[moduleName] = 0;
      }
      repeatCounts[moduleName] += 1;
    }
  });

  return Object.entries(repeatCounts).map(([moduleId, repeats]) => ({
    module: moduleId.length > 10 ? moduleId.substring(0, 10) : moduleId,
    repeats
  })).slice(0, 5);
}

function calculateRiskDistribution(studentsData, progressData) {
  // Calculate risk levels based on student performance
  const riskLevels = { low: 0, medium: 0, high: 0 };

  studentsData.forEach(student => {
    const studentProgress = progressData.filter(p => p.studentId === student.id);
    
    if (studentProgress.length === 0) {
      riskLevels.high += 1; // No progress = high risk
      return;
    }

    const avgScore = studentProgress
      .filter(p => p.marks && p.marks > 0)
      .reduce((sum, p, _, arr) => sum + (parseFloat(p.marks) / arr.length), 0);

    if (avgScore >= 70) {
      riskLevels.low += 1;
    } else if (avgScore >= 50) {
      riskLevels.medium += 1;
    } else {
      riskLevels.high += 1;
    }
  });

  return [
    { name: "Low", value: riskLevels.low },
    { name: "Medium", value: riskLevels.medium },
    { name: "High", value: riskLevels.high }
  ];
}

function generateStudentSnapshot(studentsData, progressData) {
  return studentsData.slice(0, 10).map(student => {
    const studentProgress = progressData.filter(p => p.studentId === student.id);
    
    const avgScore = studentProgress.length > 0 
      ? studentProgress
          .filter(p => p.marks && p.marks > 0)
          .reduce((sum, p, _, arr) => arr.length > 0 ? sum + (parseFloat(p.marks) / arr.length) : 0, 0)
      : 0;

    let risk = "High";
    if (avgScore >= 70) risk = "Low";
    else if (avgScore >= 50) risk = "Medium";

    return {
      id: student.studentId || student.id,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
      avg: Math.round(avgScore),
      risk
    };
  });
}