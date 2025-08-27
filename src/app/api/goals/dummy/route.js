// app/api/goals/dummy/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { GoalsService } from '../../../../lib/goalsService';

// POST - Add dummy goals for the authenticated user
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const dummyGoals = await GoalsService.addDummyGoals(userId);
    
    return NextResponse.json({ 
      message: 'Dummy goals added successfully',
      goals: dummyGoals,
      count: dummyGoals.length
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding dummy goals:', error);
    return NextResponse.json(
      { error: 'Failed to add dummy goals' },
      { status: 500 }
    );
  }
}