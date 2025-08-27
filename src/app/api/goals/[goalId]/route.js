// app/api/goals/[goalId]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { GoalsService } from '../../../../lib/goalsService';

// PATCH - Toggle goal completion status
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { goalId } = await params;
    const { completed } = await request.json();
    
    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Completed status must be a boolean' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const updatedGoal = await GoalsService.toggleGoalCompletion(userId, goalId);
    
    return NextResponse.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Error toggling goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a goal
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { goalId } = await params;
    const userId = session.user.id;
    
    await GoalsService.deleteGoal(userId, goalId);
    
    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}