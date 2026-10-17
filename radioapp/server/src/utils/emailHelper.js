import 'dotenv/config';
import nodemailer from 'nodemailer';

export function isEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
}

export function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
  }
  return null;
}

/**
 * Send an email via Resend, Nodemailer, or Dev Console Mock
 */
export async function sendEmail({ to, subject, html, text }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM || 'Radio Platform <onboarding@resend.dev>';
  const smtpFrom = process.env.SMTP_FROM || 'Radio Platform <noreply@benix.space>';
  const transporter = getTransporter();
  // 1. Priority 1: Resend API
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Email] Sent successfully via Resend API. ID:', data.id);
        return { success: true, provider: 'resend', id: data.id };
      } else {
        const errData = await response.text();
        console.warn('[Email] Resend API error response:', errData);
      }
    } catch (err) {
      console.error('[Email] Failed to send via Resend API:', err.message);
    }
  }

  // 2. Priority 2: Nodemailer SMTP
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
      });
      console.log('[Email] Sent successfully via Nodemailer SMTP. MessageId:', info.messageId);
      return { success: true, provider: 'nodemailer', messageId: info.messageId };
    } catch (err) {
      console.error('[Email] Failed to send via Nodemailer SMTP:', err.message);
    }
  }

  // 3. Priority 3: Fallback / Development Console Logger
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         [DEV EMAIL NOTIFICATION]                         ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
  console.log(`║ TO:      ${to.padEnd(65)}║`);
  console.log(`║ SUBJECT: ${subject.padEnd(65)}║`);
  console.log('╟───────────────────────────────────────────────────────────────────────────╢');
  // Look for 4-digit code in HTML/text
  const otpMatch = (text || html).match(/\b(\d{4})\b/);
  if (otpMatch) {
    console.log(`║  ★ 4-DIGIT VERIFICATION CODE:  [  ${otpMatch[1]}  ]                             ║`);
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');
  }
  console.log(`║ ${text ? text.substring(0, 71).padEnd(71) : 'HTML Email content delivered.'.padEnd(71)} ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  return { success: true, provider: 'console_mock' };
}

/**
 * Send 4-digit OTP Code Email for Signup or Login
 */
export async function sendOtpCodeEmail({ to, code, type = 'signup', name }) {
  const isSignup = type === 'signup';
  const actionTitle = isSignup ? 'Verify Your Account' : 'Secure Login Verification';
  const actionDescription = isSignup
    ? 'Thank you for signing up on the Radio Broadcast Platform! Please enter the 4-digit verification code below to activate your account.'
    : 'A login request was made for your Radio Platform account. Enter the 4-digit security code below to complete your sign in.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 500px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 24px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .logo { width: 48px; height: 48px; background: #4f46e5; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 24px; font-weight: bold; line-height: 48px; text-align: center; }
        h1 { font-size: 22px; font-weight: 800; color: #ffffff; text-align: center; margin: 0 0 10px; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center; margin: 0 0 24px; }
        .otp-box { background: #1e1b4b; border: 2px dashed #6366f1; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; margin-bottom: 8px; }
        .otp-code { font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #ffffff; font-family: monospace; }
        .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 28px; border-top: 1px solid #1f2937; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">📻</div>
        <h1>${actionTitle}</h1>
        <p>${name ? `Hello <strong>${name}</strong>,<br>` : ''}${actionDescription}</p>
        
        <div class="otp-box">
          <div class="otp-label">Your 4-Digit Verification Code</div>
          <div class="otp-code">${code}</div>
        </div>

        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
          This code will expire in <strong>15 minutes</strong>. If you did not request this, please disregard this email.
        </p>

        <div class="footer">
          Radio Broadcasting Platform · Multi-Station Broadcast Network
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `[${code}] Your ${isSignup ? 'Activation' : 'Login'} Verification Code`,
    html,
    text: `Your 4-digit verification code is: ${code}. Valid for 15 minutes.`,
  });
}

/**
 * Send notification when a radio request is submitted
 */
export async function sendRequestSubmittedEmail({ to, name, radioName }) {
  const html = `
    <div style="font-family: sans-serif; background: #0b0f19; color: #f8fafc; padding: 24px;">
      <div style="max-width: 500px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 32px;">
        <h2 style="color: #ffffff; margin-top: 0;">Radio Listing Request Received!</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Hello <strong>${name}</strong>,<br><br>
          We have received your application to list <strong>${radioName}</strong> on the Radio Station Network.
        </p>
        <div style="background: #1e1b4b; border-radius: 12px; padding: 16px; margin: 20px 0; color: #c7d2fe; font-size: 13px;">
          Our platform administrators will review your radio station data, logo link, and broadcasting stream. Once approved, you will be appointed as the Radio Admin and receive full access to your station's management portal.
        </div>
        <p style="color: #64748b; font-size: 12px;">Thank you for broadcasting with us!</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Application Received: ${radioName} on Radio Station Network`,
    html,
    text: `Hello ${name}, we received your application to list ${radioName}. Our team will review it and notify you upon approval.`,
  });
}

/**
 * Send notification to superadmin when a new radio request is submitted
 */
export async function sendAdminNewRequestNotification({ to, applicantName, radioName }) {
  const html = `
    <div style="font-family: sans-serif; background: #0b0f19; color: #f8fafc; padding: 24px;">
      <div style="max-width: 500px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 32px;">
        <h2 style="color: #f59e0b; margin-top: 0;">New Radio Listing Request</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          A new radio station listing request has been submitted by <strong>${applicantName}</strong> for <strong>${radioName}</strong>.
        </p>
        <p style="color: #94a3b8; font-size: 14px;">
          Log in to the Super Admin console to review station branding, audio streams, and approve the station administrator.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `[New Request] Radio Listing: ${radioName} by ${applicantName}`,
    html,
    text: `New Radio Listing Request for ${radioName} submitted by ${applicantName}. Review in Super Admin console.`,
  });
}

/**
 * Send notification when radio request is approved
 */
export async function sendRequestApprovedEmail({ to, name, radioName, stationSlug }) {
  const html = `
    <div style="font-family: sans-serif; background: #0b0f19; color: #f8fafc; padding: 24px;">
      <div style="max-width: 500px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 32px;">
        <h2 style="color: #10b981; margin-top: 0;">🎉 Your Radio Station Is Approved!</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Congratulations <strong>${name}</strong>,<br><br>
          Your radio station <strong>${radioName}</strong> has been officially approved! You are now the assigned <strong>Station Administrator</strong>.
        </p>
        <div style="background: #064e3b; border-radius: 12px; padding: 16px; margin: 20px 0; color: #a7f3d0; font-size: 13px;">
          <strong>What's Next:</strong><br>
          Sign in to the Admin Dashboard to customize your programs, schedule, news articles, appearance themes, and audio streams.
        </div>
        <p style="color: #64748b; font-size: 12px;">Welcome to the Radio Station Network!</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `🎉 Congratulations! ${radioName} has been approved!`,
    html,
    text: `Congratulations ${name}! Your radio station ${radioName} has been approved. You are now Station Administrator.`,
  });
}

/**
 * Send notification when radio request is rejected
 */
export async function sendRequestRejectedEmail({ to, name, radioName, reason }) {
  const html = `
    <div style="font-family: sans-serif; background: #0b0f19; color: #f8fafc; padding: 24px;">
      <div style="max-width: 500px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 32px;">
        <h2 style="color: #ef4444; margin-top: 0;">Update Regarding Your Radio Listing</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Hello <strong>${name}</strong>,<br><br>
          Thank you for your interest in broadcasting on our platform. After review, we are unable to approve your application for <strong>${radioName}</strong> at this time.
        </p>
        ${reason ? `
        <div style="background: #450a0a; border-radius: 12px; padding: 16px; margin: 20px 0; color: #fecaca; font-size: 13px;">
          <strong>Feedback from Reviewers:</strong><br>
          ${reason}
        </div>
        ` : ''}
        <p style="color: #94a3b8; font-size: 13px;">You may submit a revised application once the requirements are met.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Update regarding your radio application: ${radioName}`,
    html,
    text: `Hello ${name}, your application for ${radioName} was not approved at this time. ${reason ? `Reason: ${reason}` : ''}`,
  });
}
