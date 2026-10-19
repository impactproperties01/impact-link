import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  // We use localhost for now, but you will change this when you deploy
  const confirmLink = `http://localhost:3000/verify?token=${token}`;

  await resend.emails.send({
    from: 'Impact Link <onboarding@resend.dev>', // resend.dev is the default testing domain
    to: email,
    subject: 'Verify your email address - Impact Link',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Impact Link!</h2>
        <p>Please confirm your email address by clicking the link below:</p>
        <a href="${confirmLink}" style="display: inline-block; padding: 12px 24px; background-color: #004D2C; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">
          Verify Email
        </a>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `
  });
};