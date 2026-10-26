import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceCard from "@/components/services/ServiceCard";
import prisma from "@/lib/prisma";
import { Briefcase, Plus, Search, Filter } from "lucide-react";
import { ServiceItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function ServicesMarketplacePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; location?: string };
}) {
  const categorySlug = searchParams.category;
  const searchQuery = searchParams.q;
  const location = searchParams.location;

  const whereClause: any = {
    status: "ACTIVE",
  };

  if (categorySlug) {
    whereClause.category = { slug: categorySlug };
  }

  if (searchQuery) {
    whereClause.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { description: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  if (location) {
    whereClause.location = { contains: location, mode: "insensitive" };
  }

  let services: any[] = [];
  let categories: any[] = [];

  try {
    const results = await Promise.all([
      prisma.service.findMany({
        where: whereClause,
        include: {
          provider: {
            select: { id: true, displayName: true, username: true, avatar: true, phone: true },
          },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { rating: "desc" },
      }),
      prisma.category.findMany({
        where: { type: "SERVICE" },
        orderBy: { name: "asc" },
      }),
    ]);
    services = results[0];
    categories = results[1];
  } catch (err) {
    console.warn("Could not load services from DB:", err);
  }

  const formattedServices = services.map((s) => ({
    ...s,
    images: (s.images as string[]) || [],
  })) as unknown as ServiceItem[];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner with Post Request Action */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-400/30 inline-block">
              Rwanda Professional Services Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">Hire Verified Experts &amp; Creators</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Find Kigali photographers, video editors, music producers, developers, and event planners with transparent pricing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/service-requests/create"
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Post &quot;I Need This Service&quot;
            </Link>
            <Link
              href="/dashboard/services/create"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/20 transition-all"
            >
              Offer a Service
            </Link>
          </div>
        </div>

        {/* Main Section Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <Link
            href="/services"
            className="flex-1 py-2.5 px-4 rounded-xl text-center text-xs sm:text-sm font-extrabold bg-brand text-white shadow-sm flex items-center justify-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            <span>Offered Services ({formattedServices.length})</span>
          </Link>
          <Link
            href="/service-requests"
            className="flex-1 py-2.5 px-4 rounded-xl text-center text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Service Needs / Client Requests</span>
          </Link>
        </div>

        {/* Filters and Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Link
            href="/services"
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              !categorySlug
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Categories
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/services?category=${cat.slug}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                categorySlug === cat.slug
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Services Grid */}
        {formattedServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {formattedServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No services listed yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first provider to publish a professional service listing!
            </p>
            <Link
              href="/dashboard/services/create"
              className="mt-2 inline-block px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl"
            >
              Create Service Listing
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
