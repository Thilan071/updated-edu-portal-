import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's latest health plans from user's subcollection
    const userId = session.user.uid || session.user.id;
    const userHealthPlansRef = doc(db, 'users', userId, 'healthPlans', 'current');
    const healthPlansDoc = await getDoc(userHealthPlansRef);

    if (!healthPlansDoc.exists()) {
      return NextResponse.json(
        { 
          success: true, 
          data: null,
          message: 'No health plans found. Please complete a health check first.' 
        },
        { status: 200 }
      );
    }

    const healthPlansData = healthPlansDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        physicalPlan: healthPlansData.physicalPlan || [],
        emotionalPlan: healthPlansData.emotionalPlan || [],
        studyPlan: healthPlansData.studyPlan || [],
        detailedMetrics: healthPlansData.detailedMetrics || {},
        inputAnalysis: healthPlansData.inputAnalysis || {},
        confidence: healthPlansData.confidence || 0,
        lastUpdated: healthPlansData.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error fetching health plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health plans' },
      { status: 500 }
    );
  }
}