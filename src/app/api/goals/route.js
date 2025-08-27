// app/api/goals/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { GoalsService } from '../../../lib/goalsService';

// GET - Fetch all goals for the authenticated user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const goals = await GoalsService.getUserGoals(userId);
    
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST - Add a new goal for the authenticated user
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { goal } = await request.json();
    
    if (!goal || !goal.trim()) {
      return NextResponse.json(
        { error: 'Goal text is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const newGoal = await GoalsService.addGoal(userId, { goal: goal.trim() });
    
    return NextResponse.json({ goal: newGoal }, { status: 201 });
  } catch (error) {
    console.error('Error adding goal:', error);
    return NextResponse.json(
      { error: 'Failed to add goal' },
      { status: 500 }
    );
  }
}