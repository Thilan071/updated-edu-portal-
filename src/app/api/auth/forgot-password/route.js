// app/api/auth/forgot-password/route.js
import { NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import crypto from 'crypto';
import sendEmail from '@/lib/sendEmail';

export async function POST(request) {
  try {
    const { email } = await request.json();
    const user = await UserService.findUserByEmail(email);

    if (!user) {
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate a secure, unique token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // Token valid for 1 hour

    await UserService.setPasswordResetToken(email, passwordResetToken, passwordResetExpires);

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    const emailHtml = `<p>Hello,</p><p>You are receiving this because you requested to reset your password. Please click the link below to set a new password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you did not request this, please ignore this email.</p>`;

    await sendEmail({
      to: user.email,
      subject: 'EduBoost Password Reset',
      html: emailHtml,
    });

    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });

  } catch (error) {
    console.error('Forgot password failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
