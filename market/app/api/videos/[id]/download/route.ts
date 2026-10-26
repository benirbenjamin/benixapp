import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const video = await prisma.video.findUnique({
      where: { id: params.id },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const isPaid = video.price > 0 || video.accessType === "PREMIUM";

    if (isPaid) {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required to download paid video. Please log in." },
          { status: 401 }
        );
      }

      const isAuthor = video.userId === user.id;
      const isSuperAdmin = user.role === "SUPER_ADMIN" || user.email === "benirabok@gmail.com";

      if (!isAuthor && !isSuperAdmin) {
        const entitlement = await prisma.entitlement.findFirst({
          where: {
            userId: user.id,
            videoId: video.id,
          },
        });

        if (!entitlement) {
          return NextResponse.json(
            {
              error: `This video is for sale (${video.price} RWF). You can watch the preview online, but download is restricted to verified buyers.`,
              isForSale: true,
              price: video.price,
            },
            { status: 403 }
          );
        }
      }
    }

    // Determine download URL
    let downloadUrl = video.videoUrl;

    // Google Drive URL format handling
    if (downloadUrl.includes("drive.google.com")) {
      const fileIdMatch = downloadUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || downloadUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      }
    }

    // YouTube URLs: return clean embed or notice
    if (downloadUrl.includes("youtube.com") || downloadUrl.includes("youtu.be")) {
      return NextResponse.redirect(downloadUrl);
    }

    // Direct binary or Google Drive download redirect
    return NextResponse.redirect(downloadUrl);
  } catch (error: any) {
    console.error("Video download error:", error);
    return NextResponse.json({ error: "Failed to process download request" }, { status: 500 });
  }
}
