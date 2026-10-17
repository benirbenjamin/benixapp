import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: { select: { id: true, displayName: true, username: true, avatar: true, role: true } },
        comments: {
          include: {
            user: { select: { id: true, displayName: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to publish post" }, { status: 401 });
    }

    const body = await req.json();
    const { content, mediaUrls, postType = "TEXT" } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Post content cannot be empty" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        content: content.trim(),
        mediaUrls: mediaUrls || [],
        postType,
      },
      include: {
        user: { select: { id: true, displayName: true, username: true, avatar: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
