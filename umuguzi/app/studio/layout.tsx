"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  Upload,
  BarChart2,
  MessageSquare,
  Radio,
  Settings,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, settings } = useApp();

  const navItems = [
    { label: "Dashboard", href: "/studio", icon: LayoutDashboard },
    { label: "Upload Video", href: "/studio/upload", icon: Upload },
    { label: "Content", href: "/studio/content", icon: Video },
    { label: "Analytics", href: "/studio/analytics", icon: BarChart2 },
    { label: "Comments", href: "/studio/comments", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100/70">
      {/* Studio Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0">
        {/* Studio Brand Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <Link href="/studio" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-black">
              U
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                Studio
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {settings.app_name || "Umuguzipro"}
              </span>
            </div>
          </Link>
        </div>

        {/* Creator Channel Preview */}
        {user && (
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">
                {user.displayName?.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
              <p className="text-[11px] text-slate-500 truncate">@{user.username}</p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
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

        {/* Return to Main Portal */}
        <div className="p-4 border-t border-slate-200">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Main Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Studio Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between md:hidden">
          <Link href="/studio" className="font-extrabold text-slate-900">
            {settings.app_name} Studio
          </Link>
          <Link href="/" className="text-xs font-semibold text-brand">
            Main Site
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
