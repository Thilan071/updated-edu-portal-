import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';

/**
 * API route to fetch AI-generated goals from the ML backend
 * This acts as a proxy to handle CORS and authentication
 */
export async function GET(request, { params }) {
  try {
    // Authenticate the request
    const authResult = await authenticateAPIRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { studentId } = await params;
    const { user } = authResult;

    // Verify user can access this student's data
    if (user.role === 'student' && user.uid !== studentId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    // Get ML API URL from environment
    const mlApiUrl = process.env.ML_API_URL || 'http://localhost:5000';
    
    // Fetch goals from ML backend
    const response = await fetch(`${mlApiUrl}/api/students/${studentId}/goals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.status}`);
    }

    const goalsData = await response.json();
    
    return NextResponse.json(goalsData);
  } catch (error) {
    console.error('Error fetching ML goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI-generated goals' },
      { status: 500 }
    );
  }
}