import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
            subscriberCount: true,
            isVerified: true,
          },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        comments: {
          where: { parentId: null },
          include: {
            user: {
              select: { id: true, displayName: true, username: true, avatar: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, displayName: true, username: true, avatar: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const related = await prisma.video.findMany({
      where: {
        id: { not: video.id },
        status: "APPROVED",
        ...(video.categoryId ? { categoryId: video.categoryId } : {}),
      },
      include: {
        channel: {
          select: { id: true, name: true, handle: true, avatar: true, subscriberCount: true, isVerified: true },
        },
        category: { select: { id: true, name: true, slug: true } },
      },
      take: 6,
    });

    return NextResponse.json({ video, related });
  } catch (error: any) {
    console.error("Fetch video error:", error);
    return NextResponse.json({ error: "Failed to load video" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const video = await prisma.video.findUnique({
      where: { id: params.id },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Must be owner or admin
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (video.userId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await prisma.video.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Video deleted successfully" });
  } catch (error: any) {
    console.error("Delete video error:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
