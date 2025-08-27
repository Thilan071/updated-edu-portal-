import { NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import sendEmail from "@/lib/sendEmail";

// POST /api/admin/approve-educator  { educatorId: "<firestore doc id>" }
export async function POST(request) {
  try {
    const { educatorId } = await request.json();
    if (!educatorId) {
      return NextResponse.json({ message: 'Educator ID is required' }, { status: 400 });
    }

    // Approve the educator
    const updatedEducator = await UserService.approveEducator(educatorId);

    if (!updatedEducator) {
      return NextResponse.json({ message: 'Educator not found' }, { status: 404 });
    }

    // Send approval email
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">🎉 Welcome to EduBoost!</h2>
          <p>Dear ${updatedEducator.firstName} ${updatedEducator.lastName},</p>
          <p>Congratulations! Your educator account has been approved by our admin team.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${updatedEducator.email}</p>
            <p><em>Use your email and password to login</em></p>
          </div>
          
          <p>You can now access your educator dashboard and start creating courses and managing students!</p>
          <p style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Login to EduBoost
            </a>
          </p>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The EduBoost Team</p>
        </div>
      `;

      await sendEmail({
        to: updatedEducator.email,
        subject: '🎉 Your EduBoost Educator Account Has Been Approved!',
        html: emailHtml,
      });

      console.log(`Approval email sent to ${updatedEducator.email}`);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({ 
      message: 'Educator approved successfully and notification email sent'
    }, { status: 200 });
  } catch (err) {
    console.error('[approve-educator] error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}