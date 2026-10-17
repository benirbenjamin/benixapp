"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ShoppingBag,
  Briefcase,
  Share2,
  User,
  ArrowLeft,
  Video,
  HelpCircle,
  Home,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, settings } = useApp();

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Wallet & Ledger", href: "/dashboard/wallet", icon: Wallet },
    { label: "Bookings & Orders", href: "/dashboard/orders", icon: ShoppingBag },
    { label: "My Offered Services", href: "/dashboard/services", icon: Briefcase },
    { label: "Service Needs Board", href: "/service-requests", icon: HelpCircle },
    { label: "Affiliates & Referrals", href: "/dashboard/affiliates", icon: Share2 },
    { label: "Profile Settings", href: "/dashboard/profile", icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100/70">
      {/* Dashboard Sidebar (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 min-h-screen">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-black">
              U
            </div>
            <span className="font-extrabold text-sm text-slate-900 truncate">
              {settings.app_name || "Umuguzipro"}
            </span>
          </Link>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user.displayName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Back to Site Button */}
        <div className="p-3 border-b border-slate-100">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-brand text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Studio & Site links */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <Link
            href="/studio"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-brand text-white text-xs font-bold transition-colors"
          >
            <Video className="w-4 h-4" />
            <span>Open Creator Studio</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand transition-colors pt-1"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header Top Bar */}
        <header className="hidden md:flex h-14 bg-white border-b border-slate-200 px-6 items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-xs text-slate-400 font-medium">/ User Control Center</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Site</span>
            </Link>
            <Link href="/studio" className="text-xs font-bold text-brand bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100">
              Studio
            </Link>
          </div>
        </header>

        {/* Mobile Dashboard Top Header & Scrollable Nav */}
        <header className="md:hidden bg-white border-b border-slate-200">
          <div className="h-14 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Link href="/dashboard" className="font-black text-sm text-slate-900">
                Dashboard
              </Link>
            </div>
            <Link href="/" className="text-xs font-bold text-brand flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
          </div>

          {/* Horizontal Scrollable Nav Tabs on Mobile */}
          <div className="px-3 pb-2.5 pt-0 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none border-t border-slate-100">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isActive
                      ? "bg-brand text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
