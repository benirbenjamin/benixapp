"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Play, Lock, MoreVertical } from "lucide-react";
import { VideoItem } from "@/types";
import { formatCompactNumber, formatDuration, timeAgo, formatCurrency } from "@/lib/utils";

export default function VideoCard({ video }: { video: VideoItem }) {
  return (
    <div className="group flex flex-col cursor-pointer">
      {/* Thumbnail Container (16:9 aspect ratio) */}
      <Link href={`/video/${video.id}`} className="relative aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden block shadow-xs">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
            <Play className="w-10 h-10 opacity-50" />
          </div>
        )}

        {/* Duration Badge */}
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 backdrop-blur-xs text-white text-[11px] font-semibold rounded-md">
            {formatDuration(video.duration)}
          </span>
        )}

        {/* Premium Badge */}
        {video.accessType === "PREMIUM" && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-[11px] font-bold rounded-md shadow">
            <Lock className="w-3 h-3" />
            {video.price && video.price > 0 ? formatCurrency(video.price) : "Premium"}
          </span>
        )}
      </Link>

      {/* Info Section (YouTube Style) */}
      <div className="mt-3 flex gap-3 items-start">
        {/* Channel Avatar */}
        <Link href={`/channel/${video.channel.handle}`} className="shrink-0 mt-0.5">
          {video.channel.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.channel.avatar}
              alt={video.channel.name}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
              {video.channel.name.charAt(0)}
            </div>
          )}
        </Link>

        {/* Title, Channel, Meta */}
        <div className="flex-1 min-w-0 pr-1">
          <Link href={`/video/${video.id}`}>
            <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-brand transition-colors">
              {video.title}
            </h3>
          </Link>

          <Link
            href={`/channel/${video.channel.handle}`}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 mt-1 transition-colors"
          >
            <span className="truncate">{video.channel.name}</span>
            {video.channel.isVerified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
          </Link>

          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <span>{formatCompactNumber(video.views)} views</span>
            <span>&bull;</span>
            <span>{timeAgo(video.createdAt)}</span>
          </div>
        </div>

        {/* 3-dots more menu */}
        <button
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-opacity shrink-0"
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
