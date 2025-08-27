
import { NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import sendEmail from "@/lib/sendEmail";

// POST /api/admin/approve-student  { studentId: "<firestore doc id>" }
export async function POST(request) {
  try {
    const { studentId } = await request.json();
    if (!studentId) {
      return NextResponse.json({ message: 'Student ID is required' }, { status: 400 });
    }

    // Approve the student (this will generate and assign a student ID)
    const updatedStudent = await UserService.approveStudent(studentId);

    if (!updatedStudent) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // Send approval email with student ID
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">🎉 Welcome to EduBoost!</h2>
          <p>Dear ${updatedStudent.firstName} ${updatedStudent.lastName},</p>
          <p>Congratulations! Your student account has been approved by our admin team.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Your Login Credentials:</h3>
            <p><strong>Student ID:</strong> ${updatedStudent.studentId}</p>
            <p><strong>Email:</strong> ${updatedStudent.email}</p>
            <p><em>Use either your Student ID or Email to login</em></p>
          </div>
          
          <p>You can now access your student dashboard and start your learning journey with us!</p>
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
        to: updatedStudent.email,
        subject: '🎉 Your EduBoost Account Has Been Approved!',
        html: emailHtml,
      });

      console.log(`Approval email sent to ${updatedStudent.email}`);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({ 
      message: 'Student approved successfully and notification email sent',
      studentId: updatedStudent.studentId
    }, { status: 200 });
  } catch (err) {
    console.error('[approve-student] error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
