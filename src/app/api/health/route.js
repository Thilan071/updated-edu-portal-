import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { adminDb } from '../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// Python backend URL
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';

// GET - Retrieve health check history for a student
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || session.user.uid;
    
    // Debug logging
    console.log('=== HEALTH CHECK DEBUG ===');
    console.log('Session user object:', JSON.stringify(session.user, null, 2));
    console.log('Auth UID:', session.user.uid);
    console.log('Resolved studentId:', studentId);
    console.log('========================');
    
    // Verify user can access this data
    if (session.user.role === 'student' && studentId !== session.user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get health check history from user's subcollection
    const healthChecksRef = adminDb.collection('users').doc(studentId).collection('healthChecks');
    const querySnapshot = await healthChecksRef.orderBy('createdAt', 'desc').limit(10).get();
    
    const healthChecks = [];
    querySnapshot.forEach((doc) => {
      healthChecks.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({
      success: true,
      data: healthChecks
    });

  } catch (error) {
    console.error('Health check GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve health check data' },
      { status: 500 }
    );
  }
}

// POST - Submit new health check and get recommendations
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mood, stress, procrastination, sleepHours } = body;

    // Debug logging for POST method
    console.log('=== HEALTH CHECK POST DEBUG ===');
    console.log('Session user object:', JSON.stringify(session.user, null, 2));
    console.log('Auth UID:', session.user.uid);
    console.log('User ID:', session.user.id);
    console.log('===============================');

    // Validate required fields
    if (!mood || !stress || !procrastination || sleepHours === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: mood, stress, procrastination, sleepHours' },
        { status: 400 }
      );
    }

    // Convert string values to appropriate types
    const stressLevel = parseInt(stress);
    const procrastinationLevel = parseInt(procrastination);
    const sleepHoursFloat = parseFloat(sleepHours);

    // Call Python backend for health predictions
    const pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/api/health/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mood: mood,
        stress_level: stressLevel,
        procrastination_level: procrastinationLevel,
        sleep_hours: sleepHoursFloat
      })
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json();
      throw new Error(`Python backend error: ${errorData.message || 'Unknown error'}`);
    }

    const pythonData = await pythonResponse.json();
    console.log('=== PYTHON BACKEND RESPONSE DEBUG ===');
    console.log('Full Python response:', JSON.stringify(pythonData, null, 2));
    console.log('=====================================');
    
    const result = pythonData.result || {};
    
    console.log('=== RESULT OBJECT DEBUG ===');
    console.log('result keys:', Object.keys(result));
    console.log('result.result keys:', result.result ? Object.keys(result.result) : 'result.result is undefined');
    console.log('result.study_plan:', result.study_plan);
    console.log('result.result.study_plan:', result.result?.study_plan);
    console.log('============================');

    // Helper function to convert plan strings to arrays
    const parsePlanToArray = (planString) => {
      if (!planString || typeof planString !== 'string') {
        console.log('Invalid plan string:', planString);
        return [];
      }
      
      console.log('Parsing plan string:', planString);
      console.log('Plan string length:', planString.length);
      
      // Split by newlines and filter for bullet points
      // Handle both regular bullet (•) and potential encoding issues
      const lines = planString.split('\n')
        .map(line => line.trim())
        .filter(line => {
          const startsWithBullet = line.startsWith('•') || line.startsWith('\u2022');
          if (startsWithBullet) {
            console.log('Found bullet line:', line);
          }
          return startsWithBullet;
        })
        .map(line => {
          // Remove bullet point and any following whitespace
          const cleaned = line.replace(/^[•\u2022]\s*/, '').trim();
          console.log('Cleaned line:', cleaned);
          return cleaned;
        })
        .filter(line => line.length > 0);
      
      console.log('Final parsed lines:', lines);
      return lines;
    };
    
    const healthRecommendations = {
      recommendations: {
        study_plan: parsePlanToArray(result.recommendations?.study_plan),
        physical_plan: parsePlanToArray(result.recommendations?.physical_plan),
        emotional_plan: parsePlanToArray(result.recommendations?.emotional_plan)
      },
      detailed_metrics: result.detailed_metrics || result.predictions || {},
      model_confidence: result.model_confidence || 0.8,
      input_analysis: {
        stress_category: result.input_analysis?.stress_category || 'Unknown',
        sleep_quality: result.input_analysis?.sleep_quality || 'Unknown'
      }
    };

    // Save health check to Firestore
    const studentId = session.user.uid || session.user.id || session.user.email;
    
    const healthCheckData = {
      studentId: studentId,
      mood: mood,
      stressLevel: stressLevel,
      procrastinationLevel: procrastinationLevel,
      sleepHours: sleepHoursFloat,
      recommendations: healthRecommendations.recommendations,
      metrics: healthRecommendations.detailed_metrics,
      confidence: healthRecommendations.model_confidence,
      stressCategory: healthRecommendations.input_analysis.stress_category,
      sleepQuality: healthRecommendations.input_analysis.sleep_quality,
      createdAt: new Date()
    };
    
    // Save health check as subcollection under user
    console.log('=== FIRESTORE WRITE DEBUG ===');
    console.log('Attempting to write to path:', `users/${studentId}/healthChecks`);
    console.log('Student ID:', studentId);
    console.log('Auth UID from session:', session.user.uid);
    console.log('Health check data:', JSON.stringify(healthCheckData, null, 2));
    console.log('==============================');
    
    const healthCheckRef = await adminDb.collection('users').doc(studentId).collection('healthChecks').add(healthCheckData);

    // Save/update the latest health plans as subcollection under user
    const healthPlansData = {
      physicalPlan: healthRecommendations.recommendations.physical_plan,
      emotionalPlan: healthRecommendations.recommendations.emotional_plan,
      studyPlan: healthRecommendations.recommendations.study_plan,
      detailedMetrics: healthRecommendations.detailed_metrics,
      inputAnalysis: healthRecommendations.input_analysis,
      confidence: healthRecommendations.model_confidence,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date()
    };

    // Use set with merge to update or create the health plans document
    const userHealthPlansRef = adminDb.collection('users').doc(studentId).collection('healthPlans').doc('current');
    await userHealthPlansRef.set(healthPlansData, { merge: true });

    return NextResponse.json({
      success: true,
      data: {
        healthCheckId: healthCheckRef.id,
        ...healthRecommendations
      }
    });

  } catch (error) {
    console.error('Health check POST error:', error);
    
    // Handle validation errors from the model
    if (error.message.includes('Invalid mood') || 
        error.message.includes('Stress level') ||
        error.message.includes('Procrastination level') ||
        error.message.includes('Sleep hours')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process health check' },
      { status: 500 }
    );
  }
}