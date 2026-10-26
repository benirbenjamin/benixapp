import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to like/dislike" }, { status: 401 });
    }

    const body = await req.json();
    const isLike = body.isLike !== false; // default true

    const existing = await prisma.videoLike.findUnique({
      where: {
        videoId_userId: {
          videoId: params.id,
          userId: user.id,
        },
      },
    });

    if (existing) {
      if (existing.isLike === isLike) {
        // Remove reaction
        await prisma.videoLike.delete({ where: { id: existing.id } });
        await prisma.video.update({
          where: { id: params.id },
          data: isLike ? { likes: { decrement: 1 } } : { dislikes: { decrement: 1 } },
        });
        return NextResponse.json({ action: "removed" });
      } else {
        // Flip reaction
        await prisma.videoLike.update({
          where: { id: existing.id },
          data: { isLike },
        });
        await prisma.video.update({
          where: { id: params.id },
          data: isLike
            ? { likes: { increment: 1 }, dislikes: { decrement: 1 } }
            : { likes: { decrement: 1 }, dislikes: { increment: 1 } },
        });
        return NextResponse.json({ action: isLike ? "liked" : "disliked" });
      }
    } else {
      // Create reaction
      await prisma.videoLike.create({
        data: {
          videoId: params.id,
          userId: user.id,
          isLike,
        },
      });
      await prisma.video.update({
        where: { id: params.id },
        data: isLike ? { likes: { increment: 1 } } : { dislikes: { increment: 1 } },
      });
      return NextResponse.json({ action: isLike ? "liked" : "disliked" });
    }
  } catch (error: any) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Failed to process like reaction" }, { status: 500 });
  }
}
