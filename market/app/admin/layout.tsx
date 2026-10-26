"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  Video,
  Wallet,
  Settings,
  History,
  ArrowLeft,
  Briefcase,
  Store,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings } = useApp();

  const navItems = [
    { label: "Overview & Analytics", href: "/admin", icon: LayoutDashboard },
    { label: "Site Customizer & Settings", href: "/admin/settings", icon: Settings },
    { label: "Users & Analytics", href: "/admin/users", icon: Users },
    { label: "Video Moderation", href: "/admin/videos", icon: Video },
    { label: "Services Management", href: "/admin/services", icon: Briefcase },
    { label: "Digital Products", href: "/admin/products", icon: Store },
    { label: "Withdrawals & Payouts", href: "/admin/withdrawals", icon: Wallet },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-white block leading-tight">
              Admin Suite
            </span>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              {settings.app_name || "Umuguzipro"}
            </span>
          </div>
        </div>

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
                    ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Site</span>
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            System Administration
          </span>
          <Link href="/" className="text-xs font-bold text-brand hover:underline">
            View Live Platform &rarr;
          </Link>
        </header>

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
