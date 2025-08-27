// app/api/user/create-document/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.uid;
    
    // Check if user document already exists
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      return NextResponse.json({ 
        message: 'User document already exists',
        user: userDoc.data()
      });
    }

    // Create user document with session data
    const userData = {
      firstName: session.user.name?.split(' ')[0] || 'User',
      lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
      email: session.user.email,
      role: session.user.role || 'student',
      isApproved: true, // Since they can already log in
      authUid: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection('users').doc(userId).set(userData);

    return NextResponse.json({
      message: 'User document created successfully',
      user: userData
    });
  } catch (error) {
    console.error('Error creating user document:', error);
    return NextResponse.json(
      { error: 'Failed to create user document' },
      { status: 500 }
    );
  }
}