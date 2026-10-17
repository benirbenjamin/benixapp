// =====================================================================
// KUNDA SPACE: DYNAMIC EMAIL SERVICE (Resend, SMTP & Mock)
// =====================================================================
import nodemailer from 'nodemailer';
import { memoryStore, loadAdminSettingsFromDb } from './db.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Gets configured email provider and credentials from adminSettings or env
 */
export function getEmailConfig() {
  const settings = memoryStore.adminSettings;

  const resendApiKey = (settings.get('resend_api_key') as string) || process.env.RESEND_API_KEY || '';
  const smtpUser = (settings.get('smtp_user') as string) || process.env.SMTP_USER || '';
  const smtpPass = (settings.get('smtp_pass') as string) || process.env.SMTP_PASS || '';

  let provider = (settings.get('email_provider') as string) || process.env.EMAIL_PROVIDER || '';
  if (!provider || provider === 'mock') {
    if (resendApiKey) {
      provider = 'resend';
    } else if (smtpUser && smtpPass) {
      provider = 'smtp';
    } else {
      provider = 'mock';
    }
  }

  return {
    provider,
    resendApiKey,
    resendFromEmail: (settings.get('resend_from_email') as string) || process.env.RESEND_FROM_EMAIL || 'Kunda Space <onboarding@resend.dev>',
    smtpHost: (settings.get('smtp_host') as string) || process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt((settings.get('smtp_port') as string) || process.env.SMTP_PORT || '587', 10),
    smtpSecure: (settings.get('smtp_secure') as boolean) || process.env.SMTP_SECURE === 'true',
    smtpUser,
    smtpPass,
    smtpFromEmail: (settings.get('smtp_from_email') as string) || process.env.SMTP_FROM_EMAIL || 'Kunda Space <noreply@kunda.space>',
  };
}

/**
 * Master send email function
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Sync latest admin settings from database
  await loadAdminSettingsFromDb();
  const config = getEmailConfig();

  console.log(`📧 [EMAIL SENDING] Provider: ${config.provider} | To: ${options.to} | Subject: "${options.subject}"`);

  // 1. Resend API
  if (config.provider === 'resend' && config.resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.resendFromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data = await response.json();
      if (response.ok && data.id) {
        console.log(`✅ [RESEND SUCCESS] Sent to ${options.to}, messageId: ${data.id}`);
        return { success: true, messageId: data.id };
      }
      console.warn('⚠️ [RESEND FAILED]:', data);
      // If Resend failed (e.g. unverified sender domain), try SMTP if configured
      if (!config.smtpUser || !config.smtpPass) {
        return { success: false, error: data.message || 'Resend API failed' };
      }
      console.log('🔄 Attempting fallback to SMTP transport...');
    } catch (err: any) {
      console.error('Resend delivery error:', err);
      if (!config.smtpUser || !config.smtpPass) {
        return { success: false, error: err.message };
      }
    }
  }

  // 2. SMTP Transport (nodemailer)
  if ((config.provider === 'smtp' || (config.smtpUser && config.smtpPass)) && config.smtpHost && config.smtpUser) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 8000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });

      const sendPromise = transporter.sendMail({
        from: config.smtpFromEmail || `Kunda Space <${config.smtpUser}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      const timeoutPromise = new Promise<{ messageId?: string }>((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout exceeded (8s)')), 8500)
      );

      const info = await Promise.race([sendPromise, timeoutPromise]);
      console.log(`✅ [SMTP SUCCESS] Sent to ${options.to}, messageId: ${info?.messageId}`);
      return { success: true, messageId: info?.messageId || 'sent' };
    } catch (err: any) {
      console.warn('⚠️ SMTP delivery error:', err?.message || err);
      return { success: false, error: `SMTP delivery error: ${err?.message || err}` };
    }
  }

  // 3. Fallback / Mock Mode (Logs to console & records in memory for local dev)
  console.log(`\n📬 [MOCK EMAIL DISPATCH] To: ${options.to} | Subject: "${options.subject}"`);
  console.log(`Content Preview: ${options.text || options.html.replace(/<[^>]*>?/gm, '').substring(0, 160)}...\n`);

  return { success: true, messageId: `mock-email-${Date.now()}` };
}

/**
 * Send 6-digit registration verification email with link and code
 */
export async function sendVerificationEmail(
  toEmail: string,
  displayName: string,
  verificationCode: string,
  verificationToken: string,
  appUrl: string = 'http://localhost:5173'
) {
  const verifyLink = `${appUrl}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(toEmail)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 30px; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f43f5e; margin: 0; font-size: 28px; font-weight: 800;">Kunda Space</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Find Your Connection • Shaka Umukunzi</p>
        </div>
        <p style="color: #1e293b; font-size: 16px;">Muraho <strong>${displayName}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Welcome to Kunda Space! To activate your account and begin discovering verified singles, please verify your email address using the confirmation code below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: #fff1f2; border: 2px solid #fecdd3; border-radius: 14px; padding: 14px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #e11d48;">
            ${verificationCode}
          </div>
        </div>
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${verifyLink}" style="display: inline-block; background: #f43f5e; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px;">
            Verify Email Address Now
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          This code expires in 24 hours. If you did not create this account, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `Your Kunda Space Verification Code is ${verificationCode}`,
    html,
    text: `Welcome to Kunda Space, ${displayName}! Your verification code is: ${verificationCode}. Or click: ${verifyLink}`,
  });
}

/**
 * Send password reset email with reset link and code
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  displayName: string,
  resetCode: string,
  resetToken: string,
  appUrl: string = 'http://localhost:5173'
) {
  const resetLink = `${appUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 30px; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f43f5e; margin: 0; font-size: 28px; font-weight: 800;">Kunda Space</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Password Recovery • Guhindura Ijambobanga</p>
        </div>
        <p style="color: #1e293b; font-size: 16px;">Hello <strong>${displayName}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          We received a request to reset your Kunda Space password. Enter this 6-digit code or click the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: #f3e8ff; border: 2px solid #ddd6fe; border-radius: 14px; padding: 14px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #7c3aed;">
            ${resetCode}
          </div>
        </div>
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${resetLink}" style="display: inline-block; background: #8b5cf6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px;">
            Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          This link will expire in 1 hour. If you didn't request a password reset, your account is still secure.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `Kunda Space Password Reset Code: ${resetCode}`,
    html,
    text: `Your Kunda Space password reset code is: ${resetCode}. Or reset at: ${resetLink}`,
  });
}
