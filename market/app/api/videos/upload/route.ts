import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to upload videos" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration = 180,
      accessType = "PUBLIC",
      price = 0,
      categoryId,
      tags = [],
    } = body;

    if (!title || !videoUrl) {
      return NextResponse.json({ error: "Title and video URL are required" }, { status: 400 });
    }

    // Ensure user has a channel; if not, create one automatically
    let channel = await prisma.channel.findFirst({
      where: { ownerId: user.id },
    });

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          ownerId: user.id,
          name: `${user.displayName}'s Channel`,
          handle: user.username || `user-${user.id.slice(0, 6)}`,
          description: `Official channel of ${user.displayName} on Umuguzipro.`,
          avatar: user.avatar,
        },
      });
    }

    // Automatic thumbnail generation from YouTube if none provided
    let finalThumbnail = thumbnailUrl?.trim() || null;
    if (!finalThumbnail) {
      const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        finalThumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
    }

    // Resolve Category ID
    let resolvedCategoryId: string | null = null;
    if (categoryId) {
      const existingCat = await prisma.category.findFirst({
        where: {
          OR: [{ id: categoryId }, { name: categoryId }, { slug: slugify(categoryId) }],
        },
      });
      if (existingCat) {
        resolvedCategoryId = existingCat.id;
      } else {
        const catSlug = slugify(categoryId);
        if (catSlug) {
          const newCat = await prisma.category.create({
            data: {
              name: categoryId,
              slug: `${catSlug}-${Date.now().toString().slice(-4)}`,
              type: "VIDEO",
            },
          });
          resolvedCategoryId = newCat.id;
        }
      }
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = "video";
    let slug = `${baseSlug}-${Date.now().toString().slice(-5)}`;

    const video = await prisma.video.create({
      data: {
        channelId: channel.id,
        userId: user.id,
        title: title.trim(),
        slug,
        description: description?.trim() || null,
        videoUrl: videoUrl.trim(),
        thumbnailUrl: finalThumbnail,
        duration: Number(duration) || 0,
        accessType,
        accessLevel: accessType === "PREMIUM" ? "PREMIUM" : "ALL",
        price: accessType === "PREMIUM" ? Number(price) || 0 : 0,
        status: "APPROVED",
        categoryId: resolvedCategoryId,
      },
      include: {
        channel: true,
      },
    });

    // Tag resolution & connection
    let tagList: string[] = [];
    if (Array.isArray(tags)) {
      tagList = tags.map((t: string) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === "string") {
      tagList = tags
        .split(",")
        .map((t: string) => t.trim().replace(/^#/, ""))
        .filter(Boolean);
    }

    if (tagList.length > 0) {
      for (const rawTag of tagList) {
        const tagSlug = slugify(rawTag);
        if (!tagSlug) continue;
        try {
          const tag = await prisma.tag.upsert({
            where: { slug: tagSlug },
            update: {},
            create: { name: rawTag, slug: tagSlug },
          });
          await prisma.videoTag.upsert({
            where: { videoId_tagId: { videoId: video.id, tagId: tag.id } },
            update: {},
            create: { videoId: video.id, tagId: tag.id },
          });
        } catch {
          // Continue if tag relation already exists
        }
      }
    }

    return NextResponse.json({ success: true, video });
  } catch (error: any) {
    console.error("Video upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to publish video" }, { status: 500 });
  }
}
