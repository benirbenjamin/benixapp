import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));
    const { watchDuration = 0, completed = false, device = "desktop", country = "Rwanda" } = body;

    // Increment video views count
    await prisma.video.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    });

    // Record view analytics event
    await prisma.videoView.create({
      data: {
        videoId: params.id,
        userId: user ? user.id : null,
        watchDuration: Number(watchDuration) || 0,
        completed: Boolean(completed),
        device: String(device),
        country: String(country),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("View tracking error:", error);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
