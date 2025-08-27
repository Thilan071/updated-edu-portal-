// lib/sendEmail.js  (server-only file)
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail', // for local dev you can switch to Ethereal or Mailtrap
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // with Gmail this must be an App Password
  },
});

export default async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[sendEmail] failed:', err);
    throw new Error('Email could not be sent.');
  }
}
