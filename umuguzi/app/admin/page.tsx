import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Video,
  Briefcase,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Settings,
  ShieldCheck,
  Eye,
  Clock,
  Store,
} from "lucide-react";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "MODERATOR"])) {
    redirect("/login?redirect=/admin");
  }

  const [
    usersCount,
    videosCount,
    servicesCount,
    productsCount,
    pendingWithdrawalsCount,
    ordersCount,
    totalPlatformWithdrawn,
    viewsAgg,
    allVideosDuration,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.video.count(),
    prisma.service.count(),
    prisma.product.count(),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.order.count(),
    prisma.withdrawal.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.video.aggregate({
      _sum: { views: true },
    }),
    prisma.video.findMany({
      select: { views: true, duration: true },
    }),
  ]);

  let totalWatchSeconds = 0;
  for (const v of allVideosDuration) {
    const dur = v.duration > 0 ? v.duration : 180;
    totalWatchSeconds += (v.views || 0) * (dur * 0.6);
  }
  const platformWatchHours = Math.floor(totalWatchSeconds / 3600);
  const platformTotalViews = viewsAgg._sum.views || 0;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Platform Management Hub</h1>
        <p className="text-xs text-slate-500">
          Real-time metrics, user governance, content review, and payment operations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Members</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">{formatCompactNumber(usersCount)}</span>
          <Link href="/admin/users" className="text-[11px] font-bold text-brand hover:underline">
            Manage Users &amp; Analytics &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Visitors &amp; Views</span>
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">{formatCompactNumber(platformTotalViews)}</span>
          <span className="text-[11px] text-slate-400">Video impressions across Rwanda</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Watch Time</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">{platformWatchHours.toLocaleString()} hrs</span>
          <span className="text-[11px] text-slate-400">Accumulated viewer engagement</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Videos Catalog</span>
            <Video className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">{formatCompactNumber(videosCount)}</span>
          <Link href="/admin/videos" className="text-[11px] font-bold text-brand hover:underline">
            Review Videos &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Services Listed</span>
            <Briefcase className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">{formatCompactNumber(servicesCount)}</span>
          <Link href="/admin/services" className="text-[11px] font-bold text-emerald-600 hover:underline">
            Manage Services &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Digital Marketplace</span>
            <Store className="w-4 h-4 text-pink-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">{formatCompactNumber(productsCount)}</span>
          <Link href="/admin/products" className="text-[11px] font-bold text-pink-600 hover:underline">
            Manage Products &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Withdrawals</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-3xl font-black text-amber-600 block">{pendingWithdrawalsCount}</span>
          <Link href="/admin/withdrawals" className="text-[11px] font-bold text-amber-600 hover:underline">
            Process Payouts &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Digital Orders</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">{ordersCount}</span>
          <span className="text-[11px] text-slate-400">Completed purchases</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Disbursed</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-3xl font-black text-slate-900 block">
            {formatCurrency(totalPlatformWithdrawn._sum.amount || 0)}
          </span>
          <span className="text-[11px] text-slate-400">Paid out via MoMo &amp; Bank</span>
        </div>
      </div>

      {/* Quick Setup Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-black">Brand Customization &amp; Gateway Settings</h3>
          <p className="text-xs text-slate-300 max-w-lg">
            Change the platform name, logo, primary colors, social profiles, Flutterwave API keys, and manual MoMo payment instructions.
          </p>
        </div>

        <Link
          href="/admin/settings"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-colors shadow flex items-center gap-2 shrink-0"
        >
          <Settings className="w-4 h-4" />
          Open Site Customizer
        </Link>
      </div>
    </div>
  );
}
