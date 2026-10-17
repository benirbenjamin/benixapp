import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const withdrawals = await prisma.withdrawal.findMany({
      include: {
        user: { select: { id: true, displayName: true, username: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { withdrawalId, action, adminNote } = body; // action: 'APPROVE' | 'PAID' | 'REJECT'

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { wallet: true, user: true },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    const { sendEmailDetailed } = await import("@/lib/email");
    const accountDetails: any = withdrawal.accountDetails || {};

    if (action === "PAID") {
      await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: "PAID",
            adminNote,
            processedAt: new Date(),
          },
        }),
        prisma.wallet.update({
          where: { id: withdrawal.walletId },
          data: { totalWithdrawn: { increment: withdrawal.amount } },
        }),
      ]);

      // In-app notification to user
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          type: "WITHDRAWAL",
          title: "Withdrawal Approved & Paid! 🎉",
          message: `Your payout of ${withdrawal.amount} RWF has been successfully sent to your ${withdrawal.paymentMethod} account (${accountDetails.accountNumber || ""}).`,
          link: "/dashboard/wallet",
        },
      });

      // Priority Email notification to user
      if (withdrawal.user?.email) {
        await sendEmailDetailed({
          to: withdrawal.user.email,
          subject: `Payout Approved: ${withdrawal.amount} RWF Dispatched to Your Account`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #059669; margin-top: 0;">Withdrawal Approved &amp; Paid</h2>
              <p>Hello <strong>${withdrawal.user.displayName}</strong>,</p>
              <p>Great news! Your payout request for <strong>${withdrawal.amount} RWF</strong> has been approved by the finance team and disbursed to your account.</p>
              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 13px;">
                <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${withdrawal.paymentMethod}</p>
                <p style="margin: 4px 0;"><strong>Account Number:</strong> ${accountDetails.accountNumber || "N/A"}</p>
                <p style="margin: 4px 0;"><strong>Account Name:</strong> ${accountDetails.accountName || "N/A"}</p>
                ${adminNote ? `<p style="margin: 4px 0;"><strong>Admin Note:</strong> ${adminNote}</p>` : ""}
              </div>
              <p style="color: #64748b; font-size: 12px;">Review your transaction history in your Umuguzi Wallet.</p>
            </div>
          `,
          text: `Your payout of ${withdrawal.amount} RWF has been approved and paid via ${withdrawal.paymentMethod}.`,
        });
      }
    } else if (action === "REJECT") {
      // Refund the money back into the user's available balance!
      const rejectionReason = adminNote || "Administrative rejection";
      await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: "REJECTED",
            adminNote: rejectionReason,
            processedAt: new Date(),
          },
        }),
        prisma.wallet.update({
          where: { id: withdrawal.walletId },
          data: { availableBalance: { increment: withdrawal.amount } },
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: withdrawal.walletId,
            type: "REFUND",
            amount: withdrawal.amount,
            fee: 0,
            netAmount: withdrawal.amount,
            status: "COMPLETED",
            referenceId: withdrawal.id,
            description: `Refund for rejected withdrawal: ${rejectionReason}`,
          },
        }),
      ]);

      // In-app notification to user
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          type: "WITHDRAWAL",
          title: "Withdrawal Request Rejected (Refunded)",
          message: `Your withdrawal of ${withdrawal.amount} RWF was rejected (${rejectionReason}). The full amount has been refunded back to your available wallet balance.`,
          link: "/dashboard/wallet",
        },
      });

      // Priority Email notification to user
      if (withdrawal.user?.email) {
        await sendEmailDetailed({
          to: withdrawal.user.email,
          subject: `Notice: Withdrawal Request Rejected (${withdrawal.amount} RWF Refunded)`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #dc2626; margin-top: 0;">Withdrawal Request Rejected</h2>
              <p>Hello <strong>${withdrawal.user.displayName}</strong>,</p>
              <p>Your withdrawal request for <strong>${withdrawal.amount} RWF</strong> was not approved for the following reason:</p>
              <div style="background: #fef2f2; color: #991b1b; padding: 14px; border-radius: 8px; margin: 16px 0; font-size: 13px; font-weight: bold;">
                ${rejectionReason}
              </div>
              <p style="color: #059669; font-weight: bold;">The funds have been fully refunded back to your available wallet balance.</p>
              <p style="color: #64748b; font-size: 12px;">You can review your account details and submit a new request anytime from your Wallet.</p>
            </div>
          `,
          text: `Your withdrawal request for ${withdrawal.amount} RWF was rejected (${rejectionReason}). The funds have been refunded to your wallet.`,
        });
      }
    } else if (action === "APPROVE") {
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: "PROCESSING", adminNote },
      });

      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          type: "WITHDRAWAL",
          title: "Withdrawal In Processing ⏳",
          message: `Your withdrawal of ${withdrawal.amount} RWF is being processed by administration.`,
          link: "/dashboard/wallet",
        },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: `WITHDRAWAL_${action}`,
        targetType: "WITHDRAWAL",
        targetId: withdrawalId,
        metadata: { amount: withdrawal.amount, action, adminNote },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Process withdrawal error:", error);
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
  }
}
