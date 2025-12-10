import { createTransport } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Configure email transporter
const configureTransporter = () => {
  return createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    secure: process.env.EMAIL_SERVER_SECURE === 'true',
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const transporter = configureTransporter();
  
  const mailOptions: EmailOptions = {
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your account. Please click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Reset Password</a>
        <p style="margin-top: 20px;">This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send welcome email
export const sendWelcomeEmail = async (email: string, name: string) => {
  const transporter = configureTransporter();
  
  const mailOptions: EmailOptions = {
    to: email,
    subject: 'Welcome to Liver & Colon Health Program',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Your Health Journey!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for joining our Liver & Colon Health Program. We're excited to be part of your healing journey!</p>
        <p>Your program is now set up and ready to begin. You can log in to your dashboard to start tracking your progress.</p>
        <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
