import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VideoCard from "@/components/video/VideoCard";
import ServiceCard from "@/components/services/ServiceCard";
import ProductCard from "@/components/products/ProductCard";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Search as SearchIcon, Video as VideoIcon, Briefcase, Store, Users } from "lucide-react";
import { VideoItem, ServiceItem, ProductItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; tab?: string };
}) {
  const query = searchParams.q?.trim() || "";
  const activeTab = searchParams.tab || "all";

  let videos: any[] = [];
  let services: any[] = [];
  let products: any[] = [];
  let channels: any[] = [];

  if (query) {
    try {
      const [v, s, p, c] = await Promise.all([
        prisma.video.findMany({
          where: {
            status: "APPROVED",
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          include: {
            channel: { select: { id: true, name: true, handle: true, avatar: true, subscriberCount: true, isVerified: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          take: 20,
        }),
        prisma.service.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          include: {
            provider: { select: { id: true, displayName: true, username: true, avatar: true, phone: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          take: 12,
        }),
        prisma.product.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          include: {
            seller: { select: { id: true, displayName: true, username: true, avatar: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          take: 12,
        }),
        prisma.channel.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { handle: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 8,
        }),
      ]);

      videos = v;
      services = s.map((item) => ({ ...item, images: (item.images as string[]) || [] }));
      products = p.map((item) => ({ ...item, images: (item.images as string[]) || [] }));
      channels = c;
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  const totalResults = videos.length + services.length + products.length + channels.length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {query ? `Search results for "${query}"` : "Global Search"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Found {totalResults} matches across videos, services, products, and channels
            </p>
          </div>

          {/* Tab Filter Links */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Link
              href={`/search?q=${encodeURIComponent(query)}&tab=all`}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              All ({totalResults})
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(query)}&tab=videos`}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "videos"
                  ? "bg-brand text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Videos ({videos.length})
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(query)}&tab=services`}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "services"
                  ? "bg-brand text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Services ({services.length})
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(query)}&tab=products`}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "products"
                  ? "bg-brand text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Marketplace ({products.length})
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(query)}&tab=channels`}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "channels"
                  ? "bg-brand text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Channels ({channels.length})
            </Link>
          </div>
        </div>

        {/* Results Sections */}
        {totalResults === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <SearchIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No results found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try searching with different keywords, category names, or browse our trending feeds.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Channels Row */}
            {(activeTab === "all" || activeTab === "channels") && channels.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand" /> Channels
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {channels.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/channel/${ch.handle}`}
                      className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center gap-3 hover:border-brand transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {ch.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{ch.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">@{ch.handle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Grid */}
            {(activeTab === "all" || activeTab === "videos") && videos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <VideoIcon className="w-4 h-4 text-brand" /> Videos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {videos.map((vid) => (
                    <VideoCard key={vid.id} video={vid as unknown as VideoItem} />
                  ))}
                </div>
              </div>
            )}

            {/* Services Grid */}
            {(activeTab === "all" || activeTab === "services") && services.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-brand" /> Services
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {services.map((svc) => (
                    <ServiceCard key={svc.id} service={svc as unknown as ServiceItem} />
                  ))}
                </div>
              </div>
            )}

            {/* Digital Products Grid */}
            {(activeTab === "all" || activeTab === "products") && products.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-brand" /> Digital Marketplace
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {products.map((prod) => (
                    <ProductCard key={prod.id} product={prod as unknown as ProductItem} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
