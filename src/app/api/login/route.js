// app/api/login/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { findUserByEmail, findUserByStudentId, verifyPassword } from '@/lib/userService';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();
    if (!identifier || !password) {
      return NextResponse.json({ message: 'Identifier and password are required' }, { status: 400 });
    }

    const raw = String(identifier).trim();
    const looksLikeEmail = raw.includes('@');

    let user;
    if (looksLikeEmail) {
      user = await findUserByEmail(raw.toLowerCase());
    } else {
      user = await findUserByStudentId(raw.replace(/\s+/g, '').toUpperCase());
    }

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Support both fields (admins you seeded may have passwordHash)
    const storedHash = user.password || user.passwordHash;
    if (!storedHash) {
      return NextResponse.json({ message: 'Password not set for this user' }, { status: 500 });
    }

    const ok = await verifyPassword(password, storedHash);
    if (!ok) {
      return NextResponse.json({ message: 'Incorrect password' }, { status: 401 });
    }

    // Check approval status based on role
    if (user.role === 'student' && !user.isApproved) {
      return NextResponse.json({ message: 'Your account is pending admin approval.' }, { status: 403 });
    }
    if (user.role === 'educator' && !user.isApproved) {
      return NextResponse.json({ message: 'Your educator account is pending admin approval.' }, { status: 403 });
    }

    return NextResponse.json({
      message: 'Login successful!',
      role: user.role,
      userId: user.id,
    });
  } catch (err) {
    console.error('[login] error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
