import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import VideosModerationClient from "./VideosModerationClient";

export default async function AdminVideosPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "CONTENT_MODERATOR", "MODERATOR"])) {
    redirect("/login?redirect=/admin/videos");
  }

  const videos = await prisma.video.findMany({
    include: {
      channel: { select: { name: true, handle: true } },
      user: { select: { id: true, displayName: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return <VideosModerationClient initialVideos={videos} />;
}
