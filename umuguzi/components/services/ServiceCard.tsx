"use client";

import React from "react";
import Link from "next/link";
import { Star, MapPin, CheckCircle2 } from "lucide-react";
import { ServiceItem } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function ServiceCard({ service }: { service: ServiceItem }) {
  const coverImage =
    service.images && service.images.length > 0
      ? service.images[0]
      : "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&auto=format&fit=crop&q=80";

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-200">
      {/* Cover Image */}
      <Link href={`/services/${service.id}`} className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {service.category && (
          <span className="absolute top-2 left-2 px-2.5 py-1 bg-white/90 backdrop-blur text-slate-800 text-[11px] font-bold rounded-full shadow-sm">
            {service.category.name}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Provider Info */}
        <div className="flex items-center gap-2 mb-2">
          {service.provider.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={service.provider.avatar}
              alt={service.provider.displayName}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center font-bold text-[10px]">
              {service.provider.displayName.charAt(0)}
            </div>
          )}
          <span className="text-xs font-medium text-slate-600 truncate">{service.provider.displayName}</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
        </div>

        {/* Title */}
        <Link href={`/services/${service.id}`}>
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-brand transition-colors mb-2">
            {service.title}
          </h3>
        </Link>

        {/* Location & Rating */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 mt-auto">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{service.location || "Rwanda"}</span>
          </div>

          <div className="flex items-center gap-1 text-amber-500 font-semibold shrink-0">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{service.rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({service.reviewCount})</span>
          </div>
        </div>

        {/* Footer: Price & Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Starting at</span>
            <span className="text-sm font-bold text-slate-900">{formatCurrency(service.price)}</span>
          </div>

          <Link
            href={`/services/${service.id}`}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-brand text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            View Service
          </Link>
        </div>
      </div>
    </div>
  );
}
