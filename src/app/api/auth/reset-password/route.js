// app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await UserService.findUserByResetToken(hashedToken);

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Reset the password (will be hashed by UserService.resetPassword)
    await UserService.resetPassword(user.id, newPassword);

    return NextResponse.json({ message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Password reset failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
