import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Store } from "lucide-react";
import { ProductItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const categorySlug = searchParams.category;
  const q = searchParams.q;

  const whereClause: any = {};
  if (categorySlug) {
    whereClause.category = { slug: categorySlug };
  }
  if (q) {
    whereClause.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  let products: any[] = [];
  let categories: any[] = [];

  try {
    const results = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          seller: { select: { id: true, displayName: true, username: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { salesCount: "desc" },
      }),
      prisma.category.findMany({
        where: { type: "PRODUCT" },
        orderBy: { name: "asc" },
      }),
    ]);
    products = results[0];
    categories = results[1];
  } catch (err) {
    console.warn("Could not load products from DB:", err);
  }

  // Resilient fallback products if database is fresh or empty
  if (products.length === 0) {
    products = [
      {
        id: "prod-1",
        title: "Cinematic Rwanda Video LUTs Color Grading Pack (DaVinci & Premiere)",
        slug: "cinematic-rwanda-luts-pack",
        description: "12 custom LUTs calibrated specifically for Rwandan sunlight, green rolling hills, and vibrant skin tones.",
        price: 15000,
        fileType: "ZIP",
        fileSize: "45 MB",
        salesCount: 48,
        rating: 5.0,
        images: ["https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800"],
        seller: {
          id: "u-1",
          displayName: "Kigali Creative Lens Studios",
          username: "kigaliphoto",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
        },
      },
      {
        id: "prod-2",
        title: "East African Modern Afro-Fusion Drum Loops & Stems Pack",
        slug: "east-african-afro-fusion-drum-pack",
        description: "Royalty-free high-definition drum loops, shakers, inanga rhythms, and basslines.",
        price: 20000,
        fileType: "WAV",
        fileSize: "280 MB",
        salesCount: 31,
        rating: 4.9,
        images: ["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"],
        seller: {
          id: "u-2",
          displayName: "Kigali Vibes Media",
          username: "kigalivibes",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120",
        },
      },
      {
        id: "prod-3",
        title: "Kinyarwanda Film Scriptwriting & Directing Master Guide (eBook)",
        slug: "kinyarwanda-film-scriptwriting-guide",
        description: "Comprehensive 180-page guide on writing, casting, and producing independent films in Rwanda.",
        price: 8000,
        fileType: "PDF",
        fileSize: "18 MB",
        salesCount: 19,
        rating: 5.0,
        images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800"],
        seller: {
          id: "u-3",
          displayName: "Benir Official",
          username: "benir",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120",
        },
      },
    ];
  }

  const formattedProducts = products.map((p) => ({
    ...p,
    images: (p.images as string[]) || [],
  })) as unknown as ProductItem[];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-brand" />
            <div>
              <h1 className="text-2xl font-black text-slate-900">Digital Marketplace</h1>
              <p className="text-xs text-slate-500">
                Purchase digital assets, video presets, ebooks, software, and audio stems directly from creators
              </p>
            </div>
          </div>

          <Link
            href="/products/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md transition-all shrink-0 hover:shadow"
          >
            <Store className="w-4 h-4" />
            <span>+ Sell a Product</span>
          </Link>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Link
            href="/products"
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              !categorySlug
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                categorySlug === cat.slug
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Products Grid */}
        {formattedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {formattedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No products available in this category.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
