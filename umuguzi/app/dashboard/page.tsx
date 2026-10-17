import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Wallet, ShoppingBag, Briefcase, Video, ArrowUpRight, Plus, Sparkles } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const [wallet, bookings, orders, services] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: user.id } }),
    prisma.serviceBooking.findMany({
      where: { customerId: user.id },
      include: {
        service: { select: { title: true } },
        provider: { select: { displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: {
        items: {
          include: { product: { select: { title: true, downloadUrl: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.service.findMany({
      where: { providerId: user.id },
      take: 2,
    }),
  ]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[11px] font-bold uppercase tracking-wider inline-block">
            Member Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome, {user.displayName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Manage your personal wallet, service bookings, digital product licenses, and affiliate earnings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/wallet"
            className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Wallet &amp; Payouts
          </Link>
          <Link
            href="/services"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-colors"
          >
            Find Services
          </Link>
        </div>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Balance</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            {formatCurrency(wallet?.availableBalance || 0)}
          </span>
          <Link href="/dashboard/wallet" className="text-[11px] font-semibold text-brand hover:underline">
            Request Payout &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Clearance</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            {formatCurrency(wallet?.pendingBalance || 0)}
          </span>
          <span className="text-[11px] text-slate-400">Funds in escrow / processing</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Earnings</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">
            {formatCurrency(wallet?.totalEarnings || 0)}
          </span>
          <span className="text-[11px] text-slate-400">From sales, services &amp; referrals</span>
        </div>
      </div>

      {/* Recent Bookings & Purchases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bookings Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand" /> My Service Appointments
            </h3>
            <Link href="/dashboard/orders" className="text-xs font-bold text-brand hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{b.service.title}</p>
                  <p className="text-slate-500">Provider: {b.provider.displayName}</p>
                  <p className="text-[11px] text-slate-400">Date: {new Date(b.bookingDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block">{formatCurrency(b.totalAmount)}</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      b.status === "CONFIRMED"
                        ? "bg-emerald-100 text-emerald-700"
                        : b.status === "COMPLETED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}

            {bookings.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No service bookings yet.</p>
            )}
          </div>
        </div>

        {/* Digital Orders & Entitlements */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-600" /> Digital Product Purchases
            </h3>
            <Link href="/dashboard/orders" className="text-xs font-bold text-brand hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div key={ord.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">
                    {ord.items[0]?.product?.title || "Digital Asset"}
                  </p>
                  <p className="text-slate-400 text-[11px]">{timeAgo(ord.createdAt)}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="font-bold text-slate-900 block">{formatCurrency(ord.totalAmount)}</span>
                  {ord.items[0]?.product?.downloadUrl ? (
                    <a
                      href={ord.items[0].product.downloadUrl}
                      download
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold inline-block"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Owned</span>
                  )}
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No digital purchases yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
