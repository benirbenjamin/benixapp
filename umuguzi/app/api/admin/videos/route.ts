import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "CONTENT_MODERATOR", "MODERATOR"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { videoId, action } = body; // 'APPROVE' | 'REJECT' | 'FEATURE' | 'UNFEATURE' | 'DELETE'

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    if (action === "DELETE") {
      await prisma.video.delete({ where: { id: videoId } });
    } else {
      let data: any = {};
      if (action === "APPROVE") data.status = "APPROVED";
      if (action === "REJECT") data.status = "REJECTED";
      if (action === "FEATURE") data.isFeatured = true;
      if (action === "UNFEATURE") data.isFeatured = false;

      await prisma.video.update({
        where: { id: videoId },
        data,
      });
    }

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: `VIDEO_${action}`,
        targetType: "VIDEO",
        targetId: videoId,
        metadata: { action, videoTitle: video.title },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin video error:", error);
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}
