import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VideoCard from "@/components/video/VideoCard";
import GoogleAd from "@/components/ads/GoogleAd";
import prisma from "@/lib/prisma";
import { Compass, Flame, Clock } from "lucide-react";
import { VideoItem } from "@/types";
import { RWANDA_CATEGORIES, RWANDA_SAMPLE_VIDEOS } from "@/lib/rwandaSampleData";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { tab?: string; category?: string };
}) {
  const activeTab = searchParams.tab || "trending";
  const selectedCategorySlug = searchParams.category;

  let orderBy: any = { views: "desc" };
  if (activeTab === "latest") {
    orderBy = { createdAt: "desc" };
  } else if (activeTab === "trending") {
    orderBy = { views: "desc" };
  }

  const whereClause: any = {
    status: "APPROVED",
  };

  if (selectedCategorySlug) {
    whereClause.category = { slug: selectedCategorySlug };
  }

  let videos: any[] = [];
  let categories: any[] = [];

  try {
    const results = await Promise.all([
      prisma.video.findMany({
        where: whereClause,
        include: {
          channel: {
            select: { id: true, name: true, handle: true, avatar: true, subscriberCount: true, isVerified: true },
          },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy,
        take: 24,
      }),
      prisma.category.findMany({
        where: { type: "VIDEO" },
        orderBy: { name: "asc" },
      }),
    ]);
    videos = results[0] || [];
    categories = results[1] || [];
  } catch (err) {
    console.warn("Could not load explore data from DB:", err);
  }

  // Graceful fallback to real Rwandan dataset if DB has no records or failed
  if (!categories || categories.length === 0) {
    categories = RWANDA_CATEGORIES;
  }

  if (!videos || videos.length === 0) {
    let filtered = [...RWANDA_SAMPLE_VIDEOS];
    if (selectedCategorySlug) {
      filtered = filtered.filter(
        (v) =>
          v.category?.slug === selectedCategorySlug ||
          (selectedCategorySlug === "music" && (v.category?.slug === "music" || v.category?.slug === "gospel")) ||
          (selectedCategorySlug === "gospel" && (v.category?.slug === "gospel" || v.category?.slug === "music")) ||
          (selectedCategorySlug === "films" && (v.category?.slug === "films" || v.category?.slug === "entertainment"))
      );
    }
    if (activeTab === "latest") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    videos = filtered;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand" />
            <h1 className="text-2xl font-black text-slate-900">Explore Videos</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/explore?tab=trending${selectedCategorySlug ? `&category=${selectedCategorySlug}` : ""}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === "trending"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Flame className="w-4 h-4" />
              Trending
            </Link>
            <Link
              href={`/explore?tab=latest${selectedCategorySlug ? `&category=${selectedCategorySlug}` : ""}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === "latest"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Clock className="w-4 h-4" />
              Latest
            </Link>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Link
            href={`/explore?tab=${activeTab}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              !selectedCategorySlug
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Categories
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/explore?tab=${activeTab}&category=${cat.slug}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategorySlug === cat.slug
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Video Grid with In-Feed Google Ads */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {videos.map((vid, idx) => (
              <React.Fragment key={vid.id}>
                <VideoCard video={vid as unknown as VideoItem} />
                {idx === 3 && (
                  <div className="col-span-full">
                    <GoogleAd placement="feed" />
                  </div>
                )}
                {idx === 11 && (
                  <div className="col-span-full">
                    <GoogleAd placement="feed" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No videos found in this category.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
