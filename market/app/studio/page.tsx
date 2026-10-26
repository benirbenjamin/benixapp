import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Eye, Users, Clock, DollarSign, Upload, ArrowUpRight, Video } from "lucide-react";
import { formatCompactNumber, formatCurrency, timeAgo } from "@/lib/utils";

export default async function StudioOverviewPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/studio");
  }

  const channel = await prisma.channel.findFirst({
    where: { ownerId: user.id },
    include: {
      videos: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  const totalViews = channel?.videos.reduce((sum, v) => sum + v.views, 0) || 0;
  const subscriberCount = channel?.subscriberCount || 0;
  const latestVideo = channel?.videos[0] || null;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Channel Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Welcome back, {user.displayName}. Track your video performance and viewer engagement.
          </p>
        </div>

        <Link
          href="/studio/upload"
          className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload New Video
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            {formatCompactNumber(totalViews)}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> All-time video impressions
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Subscribers</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            {formatCompactNumber(subscriberCount)}
          </span>
          <span className="text-[11px] text-slate-400">Channel audience</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Published Videos</span>
            <Video className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            {channel?.videos.length || 0}
          </span>
          <span className="text-[11px] text-slate-400">Active catalog items</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            {formatCurrency(0)}
          </span>
          <Link href="/dashboard/wallet" className="text-[11px] text-brand hover:underline block">
            View Ledger Wallet &rarr;
          </Link>
        </div>
      </div>

      {/* Latest Video Card & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Video Performance */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Latest Video Performance</h3>
          {latestVideo ? (
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-full sm:w-56 aspect-video bg-slate-900 rounded-2xl overflow-hidden shrink-0">
                {latestVideo.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={latestVideo.thumbnailUrl}
                    alt={latestVideo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                    No Thumbnail
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{latestVideo.title}</h4>
                <p className="text-xs text-slate-400">Published {timeAgo(latestVideo.createdAt)}</p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Views</span>
                    <span className="font-bold text-slate-900">{formatCompactNumber(latestVideo.views)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Likes</span>
                    <span className="font-bold text-slate-900">{formatCompactNumber(latestVideo.likes)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                    <span className="font-bold text-emerald-600">{latestVideo.status}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/video/${latestVideo.id}`}
                    className="text-xs font-bold text-brand hover:underline"
                  >
                    View on Platform &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 mb-3">You haven&apos;t uploaded any videos yet.</p>
              <Link
                href="/studio/upload"
                className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold"
              >
                Upload First Video
              </Link>
            </div>
          )}
        </div>

        {/* Creator News & Tips */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-400/20">
              Creator Tip
            </span>
            <h3 className="font-bold text-base">Earn with Affiliate Sharing</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every video you upload has a built-in referral link. Share it on WhatsApp, Twitter, and TikTok to earn commissions when new users join or make purchases.
            </p>
          </div>

          <Link
            href="/dashboard/affiliates"
            className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold text-center block hover:bg-slate-100 transition-colors"
          >
            Check Affiliate Stats
          </Link>
        </div>
      </div>
    </div>
  );
}
