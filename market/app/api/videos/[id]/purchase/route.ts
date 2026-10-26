import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to purchase video" }, { status: 401 });
    }

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        user: { include: { wallet: true } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.price <= 0 && video.accessType !== "PREMIUM") {
      return NextResponse.json({ message: "This video is free to view." });
    }

    // Check if user already owns it
    const existingEntitlement = await prisma.entitlement.findFirst({
      where: {
        userId: user.id,
        videoId: video.id,
      },
    });

    if (existingEntitlement) {
      return NextResponse.json({
        success: true,
        alreadyOwned: true,
        message: "You already own this video.",
        downloadUrl: `/api/videos/${video.id}/download`,
      });
    }

    // Get buyer wallet
    const buyerWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!buyerWallet || buyerWallet.availableBalance < video.price) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. You need ${video.price} RWF (Your balance: ${buyerWallet?.availableBalance || 0} RWF). Please top up your wallet.`,
          requiredAmount: video.price,
          availableBalance: buyerWallet?.availableBalance || 0,
        },
        { status: 400 }
      );
    }

    const settings = await getSiteSettings();
    const commissionPercent = Number(settings.commission_rate) || 10;
    const platformFee = (video.price * commissionPercent) / 100;
    const creatorEarning = video.price - platformFee;

    // Process Purchase atomically
    await prisma.$transaction(async (tx) => {
      // 1. Deduct from buyer wallet
      await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: { availableBalance: { decrement: video.price } },
      });

      // 2. Buyer transaction record
      await tx.walletTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: "SALE",
          amount: -video.price,
          fee: 0,
          netAmount: -video.price,
          status: "COMPLETED",
          referenceId: video.id,
          description: `Purchased video: "${video.title}"`,
        },
      });

      // 3. Credit creator wallet
      if (video.user?.wallet) {
        await tx.wallet.update({
          where: { id: video.user.wallet.id },
          data: {
            availableBalance: { increment: creatorEarning },
            totalEarnings: { increment: creatorEarning },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: video.user.wallet.id,
            type: "SALE",
            amount: video.price,
            fee: platformFee,
            netAmount: creatorEarning,
            status: "COMPLETED",
            referenceId: video.id,
            description: `Video purchase sale: "${video.title}" (Buyer: @${user.username})`,
          },
        });
      }

      // 4. Create Entitlement (Unlocks HD download!)
      await tx.entitlement.create({
        data: {
          userId: user.id,
          videoId: video.id,
        },
      });

      // 5. Create Order
      await tx.order.create({
        data: {
          buyerId: user.id,
          totalAmount: video.price,
          status: "COMPLETED",
          paymentMethod: "WALLET",
          paymentStatus: "PAID",
          paymentReference: `VID-${video.id.slice(0, 8)}`,
        },
      });
    });

    // In-app notifications
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "PURCHASE",
        title: "Video Purchase Complete 🎉",
        message: `You purchased "${video.title}" for ${video.price} RWF. Download access is now unlocked!`,
        link: `/video/${video.id}`,
      },
    });

    if (video.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: video.userId,
          type: "SALE",
          title: "New Video Sale 💰",
          message: `${user.displayName} purchased your video "${video.title}" for ${video.price} RWF (+${creatorEarning} RWF credited).`,
          link: `/video/${video.id}`,
        },
      });
    }

    // Critical Alert to Super Admin (benirabok@gmail.com)
    const { sendCriticalAdminAlert } = await import("@/lib/adminAlert");
    await sendCriticalAdminAlert({
      subject: `Video Purchased: "${video.title}" (${video.price} RWF)`,
      title: `🎬 Video Sold: "${video.title}"`,
      message: `${user.displayName} (@${user.username}) purchased video "${video.title}" created by ${video.user.displayName} for ${video.price} RWF.`,
      details: {
        "Video": video.title,
        "Buyer": `${user.displayName} (${user.email})`,
        "Creator": `${video.user.displayName} (${video.user.email})`,
        "Price": `${video.price} RWF`,
        "Platform Fee": `${platformFee} RWF`,
      },
      actionLink: `/video/${video.id}`,
      actionText: "View Video",
    });

    return NextResponse.json({
      success: true,
      message: "Video purchased successfully! HD download is now enabled.",
      downloadUrl: `/api/videos/${video.id}/download`,
    });
  } catch (error: any) {
    console.error("Video purchase error:", error);
    return NextResponse.json({ error: error?.message || "Failed to complete video purchase" }, { status: 500 });
  }
}
