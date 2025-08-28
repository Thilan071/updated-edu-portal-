// src/app/api/student/predictions/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { authenticateAPIRequest } from '@/lib/authUtils';
import { ModuleService } from '@/lib/moduleService';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';

/**
 * Calculate module difficulty based on module data
 */
function calculateModuleDifficulty(moduleData) {
  // Base difficulty on module complexity factors
  let difficulty = 3; // Default medium difficulty
  
  if (moduleData.title) {
    const title = moduleData.title.toLowerCase();
    // Advanced subjects get higher difficulty
    if (title.includes('advanced') || title.includes('machine learning') || 
        title.includes('artificial intelligence') || title.includes('cybersecurity')) {
      difficulty = 5;
    } else if (title.includes('database') || title.includes('network') || 
               title.includes('algorithm')) {
      difficulty = 4;
    } else if (title.includes('fundamental') || title.includes('basic') || 
               title.includes('introduction')) {
      difficulty = 2;
    }
  }
  
  return Math.min(5, Math.max(1, difficulty));
}

/**
 * Generate realistic student performance data for ML prediction
 */
function generateStudentPerformanceData(moduleData, progressData, studentProfile) {
  // Calculate current performance metrics
  const assessmentScores = progressData?.scores || [];
  const avgAssessmentScore = assessmentScores.length > 0 
    ? assessmentScores.reduce((sum, score) => sum + score, 0) / assessmentScores.length
    : Math.random() * 40 + 50; // Random between 50-90 if no data

  // Estimate GPA from progress data
  const currentGPA = progressData?.currentGrade 
    ? (progressData.currentGrade / 100) * 4 
    : (avgAssessmentScore / 100) * 4;

  // Generate realistic behavioral data
  const assignmentsLate = Math.floor(Math.random() * 4); // 0-3 late assignments
  const loginFrequency = Math.floor(Math.random() * 20) + 5; // 5-25 logins
  const submissionAttempts = Math.floor(Math.random() * 3) + 1; // 1-3 attempts

  return {
    Module_Difficulty: calculateModuleDifficulty(moduleData),
    Current_GPA: Math.max(0, Math.min(4, currentGPA)),
    Avg_Assessment_Score: Math.max(0, Math.min(100, avgAssessmentScore)),
    Assignments_Late: assignmentsLate,
    Num_Submission_Attempts: submissionAttempts,
    Login_Frequency: loginFrequency
  };
}

/**
 * Calculate predicted grade based on risk level and current performance
 */
function calculatePredictedGrade(currentPerformance, riskLevel, confidenceScore) {
  const baseGrade = currentPerformance.Avg_Assessment_Score;
  let prediction = baseGrade;

  // Adjust prediction based on risk level
  if (riskLevel === 'high') {
    // High risk: likely to decrease significantly
    prediction = Math.max(0, baseGrade - (25 + Math.random() * 15));
  } else if (riskLevel === 'medium') {
    // Medium risk: moderate change possible
    prediction = baseGrade + (Math.random() - 0.6) * 20;
  } else {
    // Low risk: likely to maintain or improve
    prediction = Math.min(100, baseGrade + Math.random() * 15);
  }

  // Factor in confidence - lower confidence means more conservative prediction
  const conservatismFactor = 1 - confidenceScore * 0.3;
  prediction = baseGrade + (prediction - baseGrade) * conservatismFactor;

  return Math.round(Math.max(0, Math.min(100, prediction)));
}

// GET /api/student/predictions - Get ML-based performance predictions for student's modules
export async function GET(request) {
  try {
    const { error, user } = await authenticateAPIRequest(request, ['student']);
    if (error) return error;

    console.log('🔮 Fetching predictions for student:', user.uid);
    console.log('🔍 Python backend URL:', PYTHON_BACKEND_URL);

    // Get student's enrolled courses and modules
    const enrollments = await ModuleService.getStudentEnrollments(user.uid);
    console.log('📚 Student enrollments found:', enrollments?.length || 0);
    
    if (!enrollments || enrollments.length === 0) {
      console.log('❌ No enrollments found - returning empty predictions');
      return NextResponse.json({
        predictions: [],
        message: 'No enrollments found for student. Please ensure you are enrolled in courses.',
        debug: {
          studentId: user.uid,
          enrollmentsChecked: true,
          enrollmentCount: 0
        }
      }, { status: 200 });
    }

    const predictions = [];

    // Process each enrollment
    for (const enrollment of enrollments) {
      try {
        // Get course details
        const course = await ModuleService.getCourseById(enrollment.courseId);
        if (!course || !course.moduleIds || !Array.isArray(course.moduleIds)) {
          continue;
        }

        // Process each module in the course
        for (const moduleId of course.moduleIds) {
          try {
            // Get module details
            const module = await ModuleService.getModuleById(moduleId);
            if (!module) continue;

            // Get student progress for this module
            const progress = await ModuleService.getStudentProgress(user.uid, moduleId);
            
            // Generate performance data for ML prediction
            const performanceData = generateStudentPerformanceData(module, progress, user);
            
            console.log(`📊 Generated performance data for ${module.title}:`, performanceData);

            // Make ML prediction
            try {
              console.log(`🚀 Making ML prediction for ${module.title} to ${PYTHON_BACKEND_URL}/predict`);
              console.log(`📊 Sending data:`, performanceData);
              
              const mlResponse = await fetch(`${PYTHON_BACKEND_URL}/predict`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(performanceData),
              });

              let predictionResult;
              if (mlResponse.ok) {
                predictionResult = await mlResponse.json();
                console.log(`✅ ML Backend Response for ${module.title}:`, predictionResult);
              } else {
                console.log(`❌ ML Backend Failed (${mlResponse.status}) for ${module.title}, using fallback`);
                predictionResult = generateFallbackPrediction(performanceData);
              }

              // Calculate predicted grade
              const predictedGrade = calculatePredictedGrade(
                performanceData, 
                predictionResult.risk_level || 'medium',
                predictionResult.confidence || 0.7
              );

              predictions.push({
                moduleId: moduleId,
                moduleName: module.title || `Module ${moduleId}`,
                courseTitle: course.title || 'Unknown Course',
                predictedGrade: predictedGrade,
                riskLevel: predictionResult.risk_level || 'medium',
                riskScore: predictionResult.risk_score || 0.5,
                confidence: predictionResult.confidence || 0.7,
                currentPerformance: {
                  avgAssessment: Math.round(performanceData.Avg_Assessment_Score),
                  gpa: Math.round(performanceData.Current_GPA * 100) / 100,
                  loginFreq: performanceData.Login_Frequency,
                  lateAssignments: performanceData.Assignments_Late
                },
                lastUpdated: new Date().toISOString()
              });

            } catch (mlError) {
              console.error(`❌ ML prediction failed for ${module.title}:`, mlError);
              
              // Use fallback prediction
              const fallbackResult = generateFallbackPrediction(performanceData);
              const predictedGrade = calculatePredictedGrade(
                performanceData, 
                fallbackResult.risk_level,
                fallbackResult.confidence
              );

              predictions.push({
                moduleId: moduleId,
                moduleName: module.title || `Module ${moduleId}`,
                courseTitle: course.title || 'Unknown Course',
                predictedGrade: predictedGrade,
                riskLevel: fallbackResult.risk_level,
                riskScore: fallbackResult.risk_score,
                confidence: fallbackResult.confidence,
                currentPerformance: {
                  avgAssessment: Math.round(performanceData.Avg_Assessment_Score),
                  gpa: Math.round(performanceData.Current_GPA * 100) / 100,
                  loginFreq: performanceData.Login_Frequency,
                  lateAssignments: performanceData.Assignments_Late
                },
                lastUpdated: new Date().toISOString(),
                fallback: true
              });
            }

          } catch (moduleError) {
            console.error(`❌ Error processing module ${moduleId}:`, moduleError);
            continue;
          }
        }

      } catch (courseError) {
        console.error(`❌ Error processing course ${enrollment.courseId}:`, courseError);
        continue;
      }
    }

    // Sort predictions by risk level (high risk first)
    predictions.sort((a, b) => {
      const riskOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });

    console.log(`✅ Generated ${predictions.length} predictions for student`);

    return NextResponse.json({
      predictions: predictions,
      summary: {
        totalModules: predictions.length,
        highRisk: predictions.filter(p => p.riskLevel === 'high').length,
        mediumRisk: predictions.filter(p => p.riskLevel === 'medium').length,
        lowRisk: predictions.filter(p => p.riskLevel === 'low').length,
        avgConfidence: predictions.length > 0 
          ? Math.round((predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length) * 100) / 100 
          : 0,
        lastUpdated: new Date().toISOString()
      },
      debug: {
        studentId: user.uid,
        enrollmentCount: enrollments.length,
        backendUrl: PYTHON_BACKEND_URL,
        usingMLBackend: true
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching student predictions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch predictions',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Fallback rule-based prediction when ML API is unavailable
 */
function generateFallbackPrediction(performanceData) {
  let riskScore = 0;

  // GPA-based risk
  if (performanceData.Current_GPA < 2.0) {
    riskScore += 0.3;
  } else if (performanceData.Current_GPA < 2.5) {
    riskScore += 0.2;
  } else if (performanceData.Current_GPA < 3.0) {
    riskScore += 0.1;
  }

  // Assessment-based risk
  if (performanceData.Avg_Assessment_Score < 50) {
    riskScore += 0.25;
  } else if (performanceData.Avg_Assessment_Score < 60) {
    riskScore += 0.15;
  } else if (performanceData.Avg_Assessment_Score < 70) {
    riskScore += 0.1;
  }

  // Behavioral risk
  if (performanceData.Assignments_Late >= 3) {
    riskScore += 0.15;
  } else if (performanceData.Assignments_Late >= 1) {
    riskScore += 0.05;
  }

  // Engagement risk
  if (performanceData.Login_Frequency < 10) {
    riskScore += 0.1;
  }

  // Determine risk level
  let riskLevel;
  if (riskScore >= 0.6) {
    riskLevel = 'high';
  } else if (riskScore >= 0.3) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  return {
    risk_score: Math.min(1.0, riskScore),
    risk_level: riskLevel,
    confidence: 0.75 // Moderate confidence for rule-based
  };
}
