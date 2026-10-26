import prisma from "./prisma";
import { sendEmailDetailed } from "./email";
import { getSiteSettings } from "./settings";

export const SUPER_ADMIN_EMAIL = "benirabok@gmail.com";

export interface CriticalAlertOptions {
  subject: string;
  title: string;
  message: string;
  details?: Record<string, any>;
  actionLink?: string;
  actionText?: string;
}

/**
 * Sends critical operation alerts (withdrawals, admin modifications, large purchases)
 * directly to the primary Super Admin email (benirabok@gmail.com) and in-app notifications.
 */
export async function sendCriticalAdminAlert(options: CriticalAlertOptions) {
  try {
    const settings = await getSiteSettings();
    const appName = settings.app_name || "Umuguzipro";

    const detailRows = options.details
      ? Object.entries(options.details)
          .map(
            ([key, val]) =>
              `<tr><td style="padding: 6px 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #f1f5f9;">${key}</td><td style="padding: 6px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${val}</td></tr>`
          )
          .join("")
      : "";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">🚨 ${appName} Security & Critical Operation Alert</h1>
          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">High-priority notification for Super Administrator</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">${options.title}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">${options.message}</p>
          
          ${
            detailRows
              ? `<div style="margin: 20px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tbody>${detailRows}</tbody>
                  </table>
                </div>`
              : ""
          }

          ${
            options.actionLink
              ? `<div style="text-align: center; margin: 28px 0 12px;">
                  <a href="${options.actionLink.startsWith("http") ? options.actionLink : `${process.env.APP_URL || "https://watch.benix.space"}${options.actionLink}`}" 
                     style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 12px 24px; border-radius: 8px;">
                    ${options.actionText || "Review Operation in Admin Dashboard"}
                  </a>
                </div>`
              : ""
          }
        </div>
        <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          This is an automated critical notification dispatched to <strong>${SUPER_ADMIN_EMAIL}</strong> from ${appName}.
        </div>
      </div>
    `;

    // 1. Dispatch Email to benirabok@gmail.com
    await sendEmailDetailed({
      to: SUPER_ADMIN_EMAIL,
      subject: `🚨 [CRITICAL ALERT] ${options.subject}`,
      html,
      text: `${options.title}\n\n${options.message}\n\nReview link: ${options.actionLink || "Admin Dashboard"}`,
    });

    // 2. Dispatch In-App Notification if the super admin user exists in DB
    const adminUser = await prisma.user.findFirst({
      where: { email: SUPER_ADMIN_EMAIL },
    });

    if (adminUser) {
      await prisma.notification.create({
        data: {
          userId: adminUser.id,
          type: "SYSTEM",
          title: `🚨 ${options.title}`,
          message: options.message,
          link: options.actionLink || "/admin",
        },
      });
    }
  } catch (err) {
    console.error("Failed to send critical admin alert:", err);
  }
}
