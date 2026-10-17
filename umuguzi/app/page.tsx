import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VideoCard from "@/components/video/VideoCard";
import ServiceCard from "@/components/services/ServiceCard";
import ProductCard from "@/components/products/ProductCard";
import YouTubeSidebar from "@/components/layout/YouTubeSidebar";
import GoogleAd from "@/components/ads/GoogleAd";
import prisma from "@/lib/prisma";
import { VideoItem, ServiceItem, ProductItem } from "@/types";
import { RWANDA_SAMPLE_VIDEOS, RWANDA_CATEGORIES } from "@/lib/rwandaSampleData";
import { Briefcase, Store, ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

// Server-side data fetching with fallback sample data for fresh DB
async function getHomepageData() {
  try {
    const [videos, categories, services, products, channels] = await Promise.all([
      prisma.video.findMany({
        where: { status: "APPROVED" },
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
        },
        orderBy: { createdAt: "desc" },
        take: 32,
      }),
      prisma.category.findMany({
        take: 12,
        orderBy: { name: "asc" },
      }),
      prisma.service.findMany({
        where: { status: "ACTIVE" },
        include: {
          provider: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatar: true,
              phone: true,
            },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { rating: "desc" },
        take: 4,
      }),
      prisma.product.findMany({
        include: {
          seller: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatar: true,
            },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { salesCount: "desc" },
        take: 4,
      }),
      prisma.channel.findMany({
        orderBy: { subscriberCount: "desc" },
        take: 10,
      }),
    ]);

    return {
      videos: (videos || []) as unknown as VideoItem[],
      categories: categories || [],
      services: (services || []).map((s) => ({
        ...s,
        images: (s.images as string[]) || [],
      })) as unknown as ServiceItem[],
      products: (products || []).map((p) => ({
        ...p,
        images: (p.images as string[]) || [],
      })) as unknown as ProductItem[],
      channels: channels || [],
    };
  } catch {
    return {
      videos: [],
      categories: [],
      services: [],
      products: [],
      channels: [],
    };
  }
}

const DEFAULT_CATEGORY_PILLS = [
  { name: "All", slug: "" },
  { name: "Music", slug: "music" },
  { name: "Choirs", slug: "gospel" },
  { name: "Cinema & Films", slug: "films" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Services", slug: "services" },
  { name: "Marketplace", slug: "marketplace" },
  { name: "Tech & AI", slug: "technology" },
];

export default async function HomePage() {
  const { videos, categories, services, products, channels } = await getHomepageData();

  // Combine DB videos with authentic Rwandan videos if DB is initializing
  const displayVideos = videos && videos.length > 0 ? videos : (RWANDA_SAMPLE_VIDEOS as unknown as VideoItem[]);
  const pills = categories && categories.length > 0 ? categories : DEFAULT_CATEGORY_PILLS;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 flex w-full">
        {/* Left YouTube Sidebar */}
        <YouTubeSidebar channels={channels} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-3 space-y-6">
          {/* 1. Category Filter Chips (YouTube Style) */}
          <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-sm py-2 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap bg-slate-900 text-white shadow-xs"
            >
              All
            </Link>
            {pills.map((cat: any) => (
              <Link
                key={cat.slug || cat.name}
                href={cat.slug === "services" ? "/services" : cat.slug === "marketplace" ? "/products" : `/explore?category=${cat.slug}`}
                className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* 2. YouTube Video Feed: 4 Videos Per Row with In-Feed Non-Disturbing Google Ads */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {displayVideos.map((video, idx) => (
                <React.Fragment key={video.id}>
                  <VideoCard video={video} />
                  {/* Non-disturbing Google Ad insertion while scrolling through videos */}
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
          </section>

          {/* 3. In-Feed Shelf: Services in Kigali & Rwanda */}
          {services && services.length > 0 && (
            <section className="pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-brand" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Services Spotlight &bull; Kigali &amp; Rwanda
                  </h2>
                </div>
                <Link
                  href="/services"
                  className="text-xs sm:text-sm font-semibold text-brand hover:underline flex items-center gap-1"
                >
                  See all services <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 4 Items per row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {/* Intermediate Leaderboard Ad */}
          <section>
            <GoogleAd placement="banner" />
          </section>

          {/* 4. In-Feed Shelf: Digital Marketplace Products */}
          {products && products.length > 0 && (
            <section className="pt-6 border-t border-slate-100 space-y-3 pb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Digital Store &bull; LUTs, Beats, Software &amp; Presets
                  </h2>
                </div>
                <Link
                  href="/products"
                  className="text-xs sm:text-sm font-semibold text-brand hover:underline flex items-center gap-1"
                >
                  Browse marketplace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 4 Items per row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
