import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, transactionId, reference } = body;

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount <= 0) {
      return NextResponse.json({ error: "Invalid deposit amount" }, { status: 400 });
    }

    const settings = await getSiteSettings();

    // If transactionId is provided and Flutterwave secret key is configured, verify with Flutterwave
    if (transactionId && settings.flutterwave_secret_key) {
      try {
        const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
          headers: {
            Authorization: `Bearer ${settings.flutterwave_secret_key}`,
          },
        });
        const flwData = await flwRes.json();
        if (flwData.status !== "success" || flwData.data?.status !== "successful") {
          return NextResponse.json({ error: "Flutterwave payment verification failed" }, { status: 400 });
        }
      } catch (err) {
        console.warn("Flutterwave verify error:", err);
      }
    }

    // Upsert user's wallet and credit deposit
    const wallet = await prisma.wallet.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        availableBalance: depositAmount,
        totalEarnings: depositAmount,
        currency: settings.currency || "RWF",
      },
      update: {
        availableBalance: { increment: depositAmount },
      },
    });

    const ref = reference || transactionId || `FLW-DEP-${Date.now()}`;

    // Record ledger transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "SALE",
        amount: depositAmount,
        fee: 0,
        netAmount: depositAmount,
        status: "COMPLETED",
        referenceId: ref,
        description: `Wallet Deposit via Flutterwave (${ref})`,
      },
    });

    // Notify user with in-app notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "PURCHASE",
        title: "Deposit Successful! 💳",
        message: `Successfully credited ${depositAmount} RWF into your wallet via Flutterwave.`,
        link: "/dashboard/wallet",
      },
    });

    return NextResponse.json({
      success: true,
      newBalance: wallet.availableBalance,
    });
  } catch (error: any) {
    console.error("Wallet deposit error:", error);
    return NextResponse.json({ error: error?.message || "Failed to complete deposit" }, { status: 500 });
  }
}
