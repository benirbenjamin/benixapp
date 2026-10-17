import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, type } = body;

    if (!videoId || (type !== "VIEW" && type !== "CLICK")) {
      return NextResponse.json({ error: "Invalid ad tracking payload" }, { status: 400 });
    }

    const settings = await getSiteSettings();
    if (settings.ads_enabled === "false") {
      return NextResponse.json({ success: false, message: "Ads disabled" });
    }

    const minSubscribers = Number(settings.monetization_min_subscribers) || 30;
    const minWatchHours = Number(settings.monetization_min_watch_hours) || 300;
    const rewardView = Number(settings.ad_reward_view_rwf) || 3;
    const rewardClick = Number(settings.ad_reward_click_rwf) || 4;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          include: {
            videos: {
              select: { views: true, duration: true },
            },
          },
        },
      },
    });

    if (!video || !video.channel) {
      return NextResponse.json({ success: false, message: "Video channel not found" });
    }

    const channel = video.channel;
    const ownerId = channel.ownerId;

    // Check Monetization Eligibility:
    // 1. Minimum subscribers (e.g., 30)
    const subscriberCount = channel.subscriberCount || 0;
    const hasEnoughSubscribers = subscriberCount >= minSubscribers;

    // 2. Minimum watch hours (e.g., 300 watch hours = 18,000 minutes)
    let totalWatchSeconds = 0;
    if (channel.videos && channel.videos.length > 0) {
      for (const v of channel.videos) {
        const dur = v.duration > 0 ? v.duration : 180;
        // Conservative watch time estimate: ~60% completion per view
        totalWatchSeconds += (v.views || 0) * (dur * 0.6);
      }
    }
    const totalWatchHours = totalWatchSeconds / 3600;
    const hasEnoughWatchHours = totalWatchHours >= minWatchHours || (channel.totalViews || 0) >= 600;

    const isMonetized = hasEnoughSubscribers && hasEnoughWatchHours;

    if (!isMonetized) {
      // Channel not yet at required milestone; don't expose internal requirements
      return NextResponse.json({
        success: true,
        credited: false,
        message: "Logged",
      });
    }

    // Determine reward: 3 RWF for view, 4 RWF for click
    const amount = type === "CLICK" ? rewardClick : rewardView;

    // Credit creator's wallet
    const wallet = await prisma.wallet.upsert({
      where: { userId: ownerId },
      create: {
        userId: ownerId,
        availableBalance: amount,
        totalEarnings: amount,
        currency: settings.currency || "RWF",
      },
      update: {
        availableBalance: { increment: amount },
        totalEarnings: { increment: amount },
      },
    });

    // Record wallet ledger transaction
    // Description kept generic ("Ad Revenue") so internal formula is never exposed to users
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "SALE",
        amount: amount,
        fee: 0,
        netAmount: amount,
        status: "COMPLETED",
        referenceId: `ad-${type.toLowerCase()}-${video.id.slice(0, 8)}-${Date.now()}`,
        description: "Ad Revenue",
      },
    });

    return NextResponse.json({
      success: true,
      credited: true,
    });
  } catch (err: any) {
    console.error("Ad tracking error:", err);
    return NextResponse.json({ error: "Failed to record ad event" }, { status: 500 });
  }
}
