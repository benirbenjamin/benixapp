import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = new Resend(resendApiKey);

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailPayload) {
  try {
    const data = await resend.emails.send({
      from: 'Voxify Space <notifications@voxify.space>',
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send email via Resend:', error);
    return { success: false, error: error.message };
  }
}

export function buildChoirInvitationEmail(choirName: string, choirCode: string, joinLink: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #030712; color: #f8fafc; padding: 40px; border-radius: 24px; max-width: 560px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0;">Voxify Space</h1>
        <span style="color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Choir SaaS Platform</span>
      </div>
      <div style="background-color: #0f172a; padding: 24px; border-radius: 16px; border: 1px solid #334155; margin-bottom: 24px;">
        <h2 style="color: #c084fc; margin-top: 0; font-size: 18px;">Invitation to Join ${choirName}</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">You have been invited to join <strong>${choirName}</strong> on the Voxify Space platform.</p>
        <div style="background-color: #020617; padding: 16px; border-radius: 12px; margin: 20px 0; text-align: center; border: 1px solid #1e293b;">
          <span style="display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Your Choir Code</span>
          <span style="font-size: 32px; font-weight: 900; color: #c084fc; letter-spacing: 6px; font-family: monospace;">${choirCode}</span>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${joinLink}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; font-weight: 800; padding: 14px 28px; border-radius: 12px; font-size: 14px; box-shadow: 0 4px 14px rgba(147, 51, 234, 0.4);">
            Join ${choirName} Now
          </a>
        </div>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
        &copy; ${new Date().getFullYear()} Voxify Space • <a href="https://voxify.space" style="color: #c084fc; text-decoration: none;">https://voxify.space</a>
      </p>
    </div>
  `;
}

export function buildVerificationEmail(verifyLink: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #030712; color: #f8fafc; padding: 40px; border-radius: 24px; max-width: 560px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0;">Voxify Space</h1>
        <span style="color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Choir SaaS Platform</span>
      </div>
      <div style="background-color: #0f172a; padding: 28px; border-radius: 16px; border: 1px solid #334155; text-align: center;">
        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 700;">Verify Your Email Address</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Welcome to <strong>Voxify Space</strong>! Please confirm your email address to activate your account and access your choir music practice dashboard.
        </p>
        <a href="${verifyLink}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; font-weight: 800; padding: 14px 32px; border-radius: 12px; font-size: 14px; box-shadow: 0 4px 14px rgba(147, 51, 234, 0.4);">
          Confirm Email Address
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
        If you did not create an account on Voxify Space, please ignore this email.<br/>
        &copy; ${new Date().getFullYear()} Voxify Space • <a href="https://voxify.space" style="color: #c084fc; text-decoration: none;">https://voxify.space</a>
      </p>
    </div>
  `;
}

export function buildPasswordResetEmail(resetLink: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #030712; color: #f8fafc; padding: 40px; border-radius: 24px; max-width: 560px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0;">Voxify Space</h1>
        <span style="color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Account Security</span>
      </div>
      <div style="background-color: #0f172a; padding: 28px; border-radius: 16px; border: 1px solid #334155; text-align: center;">
        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 700;">Reset Your Password</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset your password for your <strong>Voxify Space</strong> account. Click the button below to set a new password:
        </p>
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; font-weight: 800; padding: 14px 32px; border-radius: 12px; font-size: 14px; box-shadow: 0 4px 14px rgba(147, 51, 234, 0.4);">
          Reset Password Now
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
        If you did not request a password reset, you can safely ignore this email.<br/>
        &copy; ${new Date().getFullYear()} Voxify Space • <a href="https://voxify.space" style="color: #c084fc; text-decoration: none;">https://voxify.space</a>
      </p>
    </div>
  `;
}
