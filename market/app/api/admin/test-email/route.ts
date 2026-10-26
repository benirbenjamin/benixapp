import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { sendEmailDetailed } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const recipient = body.recipientEmail || user.email;

    if (!recipient || !recipient.includes("@")) {
      return NextResponse.json({ error: "A valid recipient email address is required." }, { status: 400 });
    }

    const settings = await getSiteSettings();
    const testSubject = `[TEST] ${settings.app_name} Email Dispatch Test`;
    const testHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-top: 0;">Email System Diagnostic Test</h2>
        <p style="color: #475569; font-size: 14px;">
          This is an automated test email sent from <strong>${settings.app_name}</strong> to verify outbound email delivery.
        </p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; margin: 16px 0;">
          Status: Operational<br/>
          Timestamp: ${new Date().toISOString()}<br/>
          Recipient: ${recipient}
        </div>
        <p style="color: #10b981; font-weight: bold;">
          If you received this, your email configuration is working properly!
        </p>
      </div>
    `;

    const result = await sendEmailDetailed({
      to: recipient,
      subject: testSubject,
      html: testHtml,
      text: `Email System Diagnostic Test for ${settings.app_name}. Timestamp: ${new Date().toISOString()}`,
    });

    const { resolveResendApiKey, DEFAULT_FROM } = await import("@/lib/email");
    const dbKey = settings.resend_api_key;
    const effectiveResendKey = resolveResendApiKey(dbKey);
    const hasResendKey = Boolean(effectiveResendKey);
    const keySource = dbKey && dbKey.trim().length > 0
      ? "Database (Admin Settings)"
      : process.env.RESEND_API_KEY
      ? "Vercel / Environment Variable"
      : "None";

    const smtpPresent = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
      diagnostic: {
        recipient,
        hasResendKey,
        keySource,
        resendKeyPrefix: hasResendKey ? `${effectiveResendKey!.slice(0, 7)}...` : "None",
        hasSmtp: smtpPresent,
        configuredSender: settings.email_from || process.env.EMAIL_FROM || DEFAULT_FROM,
      },
    });
  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json({ error: error?.message || "Failed to run email diagnostic test." }, { status: 500 });
  }
}
