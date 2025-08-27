import { NextResponse } from 'next/server';
import { ResourceService } from '@/lib/resourceService';
import { authenticateAPIRequest } from '@/lib/authUtils';

// POST /api/admin/seed-resources - Seed initial books and online resources
export async function POST(request) {
  try {
    // For initial seeding, we'll allow this without authentication
    // In production, you should enable authentication
    // const authResult = await authenticateAPIRequest(request, ['admin']);
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { error: authResult.error },
    //     { status: authResult.error === 'Unauthorized' ? 401 : 403 }
    //   );
    // }

    // Seed initial data
    const result = await ResourceService.seedInitialData();

    return NextResponse.json({
      message: 'Resources seeded successfully',
      result
    }, { status: 200 });
  } catch (error) {
    console.error('Error seeding resources:', error);
    return NextResponse.json({
      error: 'Failed to seed resources',
      details: error.message
    }, { status: 500 });
  }
}