import { NextResponse } from 'next/server';
import { ModuleService } from '@/lib/moduleService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// GET /api/student/dashboard - Get student dashboard statistics
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student']);
    if (error) return error;

    // Get student's enrollments
    const enrollments = await ModuleService.getStudentEnrollments(user.uid);
    
    // Get all student progress
    const allProgress = await ModuleService.getStudentProgress(user.uid);
    
    // Calculate statistics
    let totalModules = 0;
    let completedModules = 0;
    let totalGrades = [];
    let recentActivities = [];
    let studyStreak = 0;
    
    // Process each enrollment
    for (const enrollment of enrollments) {
      const course = await ModuleService.getCourseById(enrollment.courseId);
      if (course && course.moduleIds) {
        totalModules += course.moduleIds.length;
        
        // Check completion for each module
        for (const moduleId of course.moduleIds) {
          const moduleProgress = allProgress.filter(p => p.moduleId === moduleId);
          const completion = await ModuleService.calculateModuleCompletion(user.uid, moduleId);
          
          if (completion && completion.percentage >= 70) {
            completedModules++;
          }
          
          // Collect grades
          moduleProgress.forEach(progress => {
            if (progress.score !== undefined) {
              totalGrades.push(progress.score);
              
              // Add to recent activities
              recentActivities.push({
                id: progress.id,
                type: 'assessment',
                title: `Assessment completed`,
                description: `Scored ${progress.score}% in ${progress.assessmentType || 'assessment'}`,
                date: progress.createdAt || progress.updatedAt,
                score: progress.score
              });
            }
          });
        }
      }
    }
    
    // Calculate average grade
    const averageGrade = totalGrades.length > 0 
      ? Math.round(totalGrades.reduce((sum, grade) => sum + grade, 0) / totalGrades.length)
      : 0;
    
    // Calculate study streak (simplified - based on recent activity)
    const recentActivityDates = recentActivities
      .map(activity => {
        const date = activity.date;
        if (date && date.toDate) {
          return date.toDate();
        } else if (date) {
          return new Date(date);
        }
        return null;
      })
      .filter(date => date !== null)
      .sort((a, b) => b - a);
    
    // Simple streak calculation - count consecutive days with activity
    if (recentActivityDates.length > 0) {
      const today = new Date();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      for (let i = 0; i < recentActivityDates.length; i++) {
        const daysDiff = Math.floor((today - recentActivityDates[i]) / oneDayMs);
        if (daysDiff === i) {
          studyStreak++;
        } else {
          break;
        }
      }
    }
    
    // Sort recent activities by date (most recent first)
    recentActivities.sort((a, b) => {
      const dateA = a.date && a.date.toDate ? a.date.toDate() : new Date(a.date || 0);
      const dateB = b.date && b.date.toDate ? b.date.toDate() : new Date(b.date || 0);
      return dateB - dateA;
    });
    
    // Limit to 5 most recent activities
    recentActivities = recentActivities.slice(0, 5);
    
    // Prepare stats cards data
    const statsCards = [
      {
        title: "Enrolled Modules",
        value: totalModules.toString(),
        change: "+2 this month",
        trend: "up"
      },
      {
        title: "Completed Assessments",
        value: allProgress.length.toString(),
        change: "+5 this week",
        trend: "up"
      },
      {
        title: "Average Grade",
        value: `${averageGrade}%`,
        change: averageGrade >= 70 ? "+2% from last month" : "Needs improvement",
        trend: averageGrade >= 70 ? "up" : "down"
      },
      {
        title: "Study Streak",
        value: `${studyStreak} days`,
        change: studyStreak > 0 ? "Keep it up!" : "Start your streak",
        trend: studyStreak > 0 ? "up" : "neutral"
      }
    ];

    return NextResponse.json({ 
      statsCards,
      recentActivities,
      summary: {
        totalModules,
        completedModules,
        averageGrade,
        studyStreak,
        totalAssessments: allProgress.length,
        enrolledCourses: enrollments.length
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching student dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}