import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import UserDetailClient from "./UserDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser.role, ["ADMIN", "SUPER_ADMIN", "MODERATOR"])) {
    redirect("/login?redirect=/admin/users");
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      channels: true,
      wallet: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      },
      videos: {
        orderBy: { createdAt: "desc" },
      },
      services: {
        include: { category: true },
        orderBy: { createdAt: "desc" },
      },
      products: {
        include: { category: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const primaryChannel = user.channels && user.channels.length > 0 ? user.channels[0] : null;

  // 1. Calculate Total Views
  let totalViews = primaryChannel?.totalViews || 0;
  for (const v of user.videos) {
    totalViews += v.views || 0;
  }

  // 2. Calculate Total Watch Time in Hours
  let totalWatchSeconds = 0;
  for (const v of user.videos) {
    const dur = v.duration > 0 ? v.duration : 180;
    // Estimate: ~60% completion per view
    totalWatchSeconds += (v.views || 0) * (dur * 0.6);
  }
  const totalWatchHours = totalWatchSeconds / 3600;

  // 3. Subscribers Count
  const subscribersCount = primaryChannel?.subscriberCount || 0;

  // 4. Referrals Count
  const referralsCount = await prisma.user.count({
    where: { referredById: user.id },
  });

  const analytics = {
    totalViews,
    totalWatchHours,
    subscribersCount,
    referralsCount,
  };

  return <UserDetailClient user={{ ...user, channel: primaryChannel }} analytics={analytics} />;
}
