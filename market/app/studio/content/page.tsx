import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ContentTableClient from "./ContentTableClient";

export default async function StudioContentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/studio/content");

  const videos = await prisma.video.findMany({
    where: { userId: user.id },
    include: {
      comments: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Channel Content</h1>
        <p className="text-xs text-slate-500">
          Manage your uploaded videos, access permissions, and performance stats.
        </p>
      </div>

      <ContentTableClient initialVideos={videos} />
    </div>
  );
}
