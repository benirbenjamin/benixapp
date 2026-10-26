import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BarChart2, TrendingUp, Smartphone, Monitor, Globe, Share2 } from "lucide-react";
import { formatCompactNumber } from "@/lib/utils";

export default async function StudioAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/studio/analytics");

  const channel = await prisma.channel.findFirst({
    where: { ownerId: user.id },
    include: {
      videos: {
        include: { videoViews: true },
      },
    },
  });

  const allViews = channel?.videos.flatMap((v) => v.videoViews) || [];
  const totalViewsCount = allViews.length || channel?.videos.reduce((s, v) => s + v.views, 0) || 0;
  const totalWatchSeconds = allViews.reduce((s, v) => s + (v.watchDuration || 0), 0);
  const totalWatchHours = (totalWatchSeconds / 3600).toFixed(1);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Channel Analytics</h1>
        <p className="text-xs text-slate-500">
          Audience engagement, watch duration, device breakdown, and geographic traffic.
        </p>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Views</span>
          <span className="text-3xl font-black text-slate-900 block">{formatCompactNumber(totalViewsCount)}</span>
          <span className="text-[11px] text-emerald-600 font-semibold">+14% vs previous 28 days</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Watch Time</span>
          <span className="text-3xl font-black text-slate-900 block">{totalWatchHours} Hours</span>
          <span className="text-[11px] text-slate-500">Total viewing duration</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Subscribers</span>
          <span className="text-3xl font-black text-slate-900 block">{formatCompactNumber(channel?.subscriberCount || 0)}</span>
          <span className="text-[11px] text-brand font-semibold">Active followers</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-brand" />
            <h3 className="font-extrabold text-sm text-slate-900">Device Distribution</h3>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Mobile Phones</span>
                <span>68%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[68%] h-full bg-brand rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Desktop Computers</span>
                <span>27%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[27%] h-full bg-indigo-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Tablets &amp; Smart TVs</span>
                <span>5%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[5%] h-full bg-amber-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Geographic Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Geographic Audience</h3>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Rwanda 🇷🇼</span>
                <span>72%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[72%] h-full bg-emerald-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>East Africa (UG, KE, TZ, BI) 🌍</span>
                <span>19%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[19%] h-full bg-teal-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Global Diaspora</span>
                <span>9%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[9%] h-full bg-sky-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
