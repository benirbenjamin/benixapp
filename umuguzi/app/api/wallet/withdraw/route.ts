import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, paymentMethod = "MTN_MOMO", accountDetails } = body;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 });
    }

    if (!accountDetails || !accountDetails.accountNumber) {
      return NextResponse.json({ error: "Account/Phone number is required for payout" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (wallet.availableBalance < withdrawAmount) {
      return NextResponse.json(
        { error: `Insufficient available funds. Your balance is ${wallet.availableBalance} RWF.` },
        { status: 400 }
      );
    }

    // Minimum withdrawal threshold (e.g. 1,000 RWF)
    if (withdrawAmount < 1000) {
      return NextResponse.json(
        { error: "Minimum withdrawal amount is 1,000 RWF." },
        { status: 400 }
      );
    }

    // Process withdrawal in atomic transaction
    const withdrawal = await prisma.$transaction(async (tx) => {
      // 1. Deduct from available balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: withdrawAmount },
        },
      });

      // 2. Create Withdrawal record
      const w = await tx.withdrawal.create({
        data: {
          userId: user.id,
          walletId: wallet.id,
          amount: withdrawAmount,
          paymentMethod: paymentMethod as any,
          accountDetails,
          status: "PENDING",
        },
      });

      // 3. Create immutable ledger transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "WITHDRAWAL",
          amount: -withdrawAmount,
          fee: 0,
          netAmount: -withdrawAmount,
          status: "PENDING",
          referenceId: w.id,
          description: `Withdrawal request via ${paymentMethod} (${accountDetails.accountNumber})`,
        },
      });

      return w;
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "WITHDRAWAL",
        title: "Withdrawal Request Submitted",
        message: `Your request for ${withdrawAmount} RWF via ${paymentMethod} has been submitted for admin processing.`,
        link: "/dashboard/wallet",
      },
    });

    // CRITICAL OPERATION: Alert Super Admin (benirabok@gmail.com) via email and in-app alert
    const { sendCriticalAdminAlert } = await import("@/lib/adminAlert");
    await sendCriticalAdminAlert({
      subject: `New Withdrawal Request (${withdrawAmount} RWF by ${user.displayName})`,
      title: `💸 Payout Requested: ${withdrawAmount} RWF`,
      message: `${user.displayName} (@${user.username}, ${user.email}) submitted a withdrawal request for ${withdrawAmount} RWF via ${paymentMethod}.`,
      details: {
        "User": `${user.displayName} (${user.email})`,
        "Amount": `${withdrawAmount} RWF`,
        "Payment Method": paymentMethod,
        "Payout Account Number": accountDetails.accountNumber,
        "Account Holder Name": accountDetails.accountName || "N/A",
        "Requested At": new Date().toLocaleString(),
      },
      actionLink: "/admin/withdrawals",
      actionText: "Process & Disburse Payout in Admin",
    });

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: any) {
    console.error("Withdrawal error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process withdrawal request" }, { status: 500 });
  }
}
