import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VideoPlayerClient from "./VideoPlayerClient";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { VideoItem } from "@/types";
import { RWANDA_SAMPLE_VIDEOS } from "@/lib/rwandaSampleData";

export const dynamic = "force-dynamic";

// Dynamic Google Search SEO Metadata
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    let video: any = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        channel: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!video) {
      video = RWANDA_SAMPLE_VIDEOS.find((v) => v.id === params.id || v.slug === params.id);
    }

    if (!video) {
      return {
        title: "Video Not Found | Umuguzipro Rwanda",
      };
    }

    const title = `${video.title} - ${video.channel?.name || "Umuguzipro"} | Rwandan Music & Cinema`;
    const description =
      video.description?.slice(0, 160) ||
      `Watch ${video.title} on Umuguzipro, Rwanda's premier platform for Gospel Choirs, Music Videos, and Kinyarwanda Films.`;
    const ogImage = video.thumbnailUrl || "/logo.png";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.other",
        images: [{ url: ogImage, width: 1280, height: 720, alt: video.title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: "Watch Video | Umuguzipro",
    };
  }
}

export default async function VideoPage({ params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();

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

    let videoData: any = video;
    let related: any[] = [];

    if (!videoData) {
      const sample = RWANDA_SAMPLE_VIDEOS.find((v) => v.id === params.id || v.slug === params.id);
      if (sample) {
        videoData = {
          ...sample,
          createdAt: new Date(sample.createdAt || Date.now()),
          updatedAt: new Date(),
          comments: [],
        };
        related = RWANDA_SAMPLE_VIDEOS.filter((v) => v.id !== sample.id).slice(0, 8);
      }
    }

    if (!videoData) {
      notFound();
    }

    // Check if user owns entitlement
    let hasEntitlement = false;
    if (user && videoData.id) {
      try {
        const ent = await prisma.entitlement.findFirst({
          where: { userId: user.id, videoId: videoData.id },
        });
        hasEntitlement = Boolean(ent);
      } catch {
        hasEntitlement = false;
      }
    }

    if (related.length === 0) {
      try {
        related = await prisma.video.findMany({
          where: {
            id: { not: videoData.id },
            status: "APPROVED",
            ...(videoData.categoryId ? { categoryId: videoData.categoryId } : {}),
          },
          include: {
            channel: {
              select: { id: true, name: true, handle: true, avatar: true, subscriberCount: true, isVerified: true },
            },
            category: { select: { id: true, name: true, slug: true } },
          },
          take: 8,
        });
      } catch {
        related = RWANDA_SAMPLE_VIDEOS.filter((v) => v.id !== videoData.id).slice(0, 8);
      }
    }

    // Google Search Structured Data (JSON-LD VideoObject)
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: videoData.title,
      description: videoData.description || videoData.title,
      thumbnailUrl: [videoData.thumbnailUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"],
      uploadDate: new Date(videoData.createdAt).toISOString(),
      duration: `PT${videoData.duration || 300}S`,
      embedUrl: videoData.videoUrl,
      author: {
        "@type": "Person",
        name: videoData.channel?.name || "Umuguzipro",
      },
      publisher: {
        "@type": "Organization",
        name: "Umuguzipro",
        logo: {
          "@type": "ImageObject",
          url: "https://watch.benix.space/favicon.ico",
        },
      },
    };

    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />

        {/* Google Video Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <VideoPlayerClient
            initialVideo={{ ...videoData, hasEntitlement }}
            relatedVideos={related as unknown as VideoItem[]}
          />
        </main>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error("VideoPage render error:", error);
    notFound();
  }
}
