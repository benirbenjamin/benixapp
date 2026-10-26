"use client";

import React from "react";
import Link from "next/link";
import { Download, Star, FileText } from "lucide-react";
import { ProductItem } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function ProductCard({ product }: { product: ProductItem }) {
  const coverImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-200">
      <Link href={`/products/${product.id}`} className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.fileType && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/75 backdrop-blur text-white text-[10px] font-bold uppercase rounded tracking-wider">
            {product.fileType}
          </span>
        )}
      </Link>

      <div className="p-4 flex-1 flex flex-col">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {product.category?.name || "Digital Asset"}
        </span>

        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-brand transition-colors mb-2">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 mt-auto">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{product.rating.toFixed(1)}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <Download className="w-3.5 h-3.5" />
            <span>{product.salesCount} downloads</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-base font-extrabold text-slate-900">
            {formatCurrency(product.price)}
          </span>

          <Link
            href={`/products/${product.id}`}
            className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            Buy Content
          </Link>
        </div>
      </div>
    </div>
  );
}
