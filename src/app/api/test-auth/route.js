import { NextResponse } from 'next/server';
import { authenticateAPIRequest } from '@/lib/authUtils';

// Simple test route to verify authentication
export async function GET(request) {
  try {
    console.log('🔍 Testing authentication...');
    
    const authResult = await authenticateAPIRequest(request, ['educator', 'admin', 'student']);
    console.log('🔍 Auth test result:', { 
      success: authResult.success, 
      error: authResult.error,
      userRole: authResult.user?.role,
      userId: authResult.user?.uid
    });
    
    if (!authResult.success) {
      console.error('❌ Authentication test failed:', authResult.error);
      return NextResponse.json({ 
        error: authResult.error,
        authenticated: false 
      }, { status: 401 });
    }
    
    const user = authResult.user;
    
    return NextResponse.json({
      message: 'Authentication test successful',
      authenticated: true,
      user: {
        id: user.uid,
        email: user.email,
        role: user.role,
        name: user.name
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error in auth test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      authenticated: false 
    }, { status: 500 });
  }
}