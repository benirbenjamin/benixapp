import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getSiteSettings } from "./settings";

export const DEFAULT_FROM = "Umuguzipro <onboarding@resend.dev>";

/**
 * Resolves and sanitizes the Resend API key from either database settings or process.env.
 * Automatically trims whitespace and removes accidental surrounding quotes.
 */
export function resolveResendApiKey(dbKey?: string | null): string | null {
  const candidate = (dbKey && dbKey.trim().length > 0) ? dbKey : process.env.RESEND_API_KEY;
  if (!candidate) return null;
  const clean = candidate.trim().replace(/^["']|["']$/g, "").trim();
  return clean.startsWith("re_") ? clean : null;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  provider?: "resend" | "smtp" | "console";
  messageId?: string;
  error?: string;
}

export async function sendEmailDetailed({ to, subject, html, text, from }: SendEmailOptions): Promise<EmailDeliveryResult> {
  // Always log email dispatch to server console for tracking & debugging
  console.log(`\n================== [EMAIL DISPATCH] ==================`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content Summary:\n${text || html.replace(/<[^>]+>/g, " ").slice(0, 160)}...`);
  console.log(`======================================================\n`);

  let dbSettings: any = null;
  try {
    dbSettings = await getSiteSettings();
  } catch {
    // DB not ready or during build
  }

  const effectiveApiKey = resolveResendApiKey(dbSettings?.resend_api_key);
  const effectiveEmailFrom = from || dbSettings?.email_from || process.env.EMAIL_FROM || DEFAULT_FROM;
  const primaryFrom = effectiveEmailFrom;
  let lastError = "";

  // 1. Try Resend if configured
  if (effectiveApiKey) {
    try {
      const resend = new Resend(effectiveApiKey);
      // Primary attempt with configured sender
      const response = await resend.emails.send({
        from: primaryFrom,
        to: [to],
        subject,
        html,
        text,
      });

      if (response.data?.id) {
        console.log(`[Resend Success] Email sent to ${to} (ID: ${response.data.id}) via ${primaryFrom}`);
        return { success: true, provider: "resend", messageId: response.data.id };
      }

      if (response.error) {
        lastError = response.error.message || JSON.stringify(response.error);
        console.warn(`[Resend Warning] Primary delivery via "${primaryFrom}" failed:`, lastError);

        // If domain is not verified, retry with Resend's default verified sandbox domain: onboarding@resend.dev
        if (primaryFrom !== DEFAULT_FROM) {
          console.log(`[Resend] Retrying delivery using fallback verified address: ${DEFAULT_FROM}`);
          const retryResponse = await resend.emails.send({
            from: DEFAULT_FROM,
            to: [to],
            subject,
            html,
            text,
          });

          if (retryResponse.data?.id) {
            console.log(`[Resend Success] Fallback sent to ${to} (ID: ${retryResponse.data.id}) via ${DEFAULT_FROM}`);
            return { success: true, provider: "resend", messageId: retryResponse.data.id };
          }

          if (retryResponse.error) {
            lastError = retryResponse.error.message || JSON.stringify(retryResponse.error);
            console.error(`[Resend Fallback Error]:`, lastError);
          }
        }
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error("[Resend Exception]:", lastError);
    }
  } else {
    console.warn("[Email] RESEND_API_KEY is not set or invalid (must start with 're_').");
  }

  // 2. Try Nodemailer SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const info = await transporter.sendMail({
        from: primaryFrom,
        to,
        subject,
        html,
        text,
      });

      console.log(`[SMTP Success] Email sent to ${to} (ID: ${info.messageId})`);
      return { success: true, provider: "smtp", messageId: info.messageId };
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn("[SMTP Error]:", lastError);
    }
  }

  // Fallback diagnostic
  if (!effectiveApiKey && !process.env.SMTP_HOST) {
    lastError = "Neither RESEND_API_KEY nor SMTP credentials are configured. Set RESEND_API_KEY in Vercel (and redeploy) or enter it in Admin Settings.";
  }

  console.error(`[Email Delivery Failure] Could not send to ${to}. Reason: ${lastError}`);
  return {
    success: false,
    provider: "console",
    error: lastError,
  };
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const result = await sendEmailDetailed(options);
  return result.success;
}

// -----------------------------------------------------------------------------
// Email HTML Templates
// -----------------------------------------------------------------------------

export function getVerificationEmailTemplate(code: string, appName: string = "Umuguzipro"): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${appName}</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Confirm your email address</p>
      </div>
      <div style="background: #f8fafc; border-radius: 8px; padding: 24px; text-align: center; border: 1px solid #edf2f7; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 15px; margin-top: 0; margin-bottom: 16px;">
          Use the following 6-digit numeric verification code to complete your registration.
        </p>
        <div style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 12px 28px; border-radius: 8px; font-family: monospace;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 16px; margin-bottom: 0;">
          This code expires in 15 minutes. If you did not request this, please ignore this email.
        </p>
      </div>
      <div style="text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
      </div>
    </div>
  `;
}

export function getTwoFactorEmailTemplate(code: string, appName: string = "Umuguzipro"): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${appName}</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Two-Factor Authentication (2FA)</p>
      </div>
      <div style="background: #f8fafc; border-radius: 8px; padding: 24px; text-align: center; border: 1px solid #edf2f7; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 15px; margin-top: 0; margin-bottom: 16px;">
          A login attempt was made for your account. Enter this 6-digit security code to finish logging in:
        </p>
        <div style="display: inline-block; background: #0f172a; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 12px 28px; border-radius: 8px; font-family: monospace;">
          ${code}
        </div>
        <p style="color: #dc2626; font-size: 13px; margin-top: 16px; margin-bottom: 0; font-weight: 500;">
          Never share this code with anyone. This code expires in 10 minutes.
        </p>
      </div>
      <div style="text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        &copy; ${new Date().getFullYear()} ${appName}. Protected with Two-Factor Security.
      </div>
    </div>
  `;
}

export function getPasswordResetEmailTemplate(code: string, appName: string = "Umuguzipro"): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${appName}</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
      </div>
      <div style="background: #f8fafc; border-radius: 8px; padding: 24px; text-align: center; border: 1px solid #edf2f7; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 15px; margin-top: 0; margin-bottom: 16px;">
          You requested to reset your password. Use the following 6-digit verification code to set your new password:
        </p>
        <div style="display: inline-block; background: #dc2626; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 12px 28px; border-radius: 8px; font-family: monospace;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 16px; margin-bottom: 0;">
          This code expires in 15 minutes. If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
      <div style="text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        &copy; ${new Date().getFullYear()} ${appName}. Account Security.
      </div>
    </div>
  `;
}
