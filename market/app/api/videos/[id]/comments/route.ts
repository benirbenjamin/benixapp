import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to comment" }, { status: 401 });
    }

    const body = await req.json();
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment text cannot be empty" }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        videoId: params.id,
        userId: user.id,
        parentId: parentId || null,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, displayName: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    console.error("Post comment error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
