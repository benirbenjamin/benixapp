"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Flame,
  Tv,
  Briefcase,
  Store,
  MessageSquare,
  Users,
  Video as VideoIcon,
  Wallet,
  HelpCircle,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useApp } from "../providers/AppProviders";

export default function YouTubeSidebar({ channels = [] }: { channels?: any[] }) {
  const pathname = usePathname();
  const { user } = useApp();

  const mainLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Trending", href: "/explore", icon: Flame },
    { label: "Subscriptions", href: "/channels", icon: Tv },
  ];

  const exploreLinks = [
    { label: "Services", href: "/services", icon: Briefcase },
    { label: "Marketplace", href: "/products", icon: Store },
    { label: "Community", href: "/posts", icon: MessageSquare },
    { label: "Service Requests", href: "/service-requests", icon: HelpCircle },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-3 py-3 border-r border-slate-200/80 bg-white select-none text-slate-700 text-xs">
      {/* 1. Main Navigation */}
      <div className="space-y-0.5 pb-3">
        {mainLinks.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                isActive
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "hover:bg-slate-100/80 text-slate-700"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-brand" : "text-slate-700"}`} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <hr className="my-2 border-slate-200/80" />

      {/* 2. Platform Hubs (Services, Products, Community) */}
      <div className="space-y-0.5 py-1">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Discover Hub
        </div>
        {exploreLinks.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                isActive
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "hover:bg-slate-100/80 text-slate-700"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-brand" : "text-slate-700"}`} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <hr className="my-2 border-slate-200/80" />

      {/* 3. Channels / Subscriptions List */}
      <div className="space-y-0.5 py-1 flex-1">
        <Link
          href="/channels"
          className="flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-800 hover:text-brand group"
        >
          <span className="text-sm">Channels</span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand" />
        </Link>

        {channels && channels.length > 0 ? (
          channels.slice(0, 8).map((channel) => (
            <Link
              key={channel.id}
              href={`/channel/${channel.handle}`}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100/80 transition-colors group"
            >
              {channel.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={channel.avatar}
                  alt={channel.name}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {channel.name.charAt(0)}
                </div>
              )}
              <span className="text-xs truncate font-medium text-slate-700 group-hover:text-slate-900">
                {channel.name}
              </span>
            </Link>
          ))
        ) : (
          <div className="px-3 py-2 text-[11px] text-slate-400">
            Discover creators in Rwanda
          </div>
        )}

        <Link
          href="/channels"
          className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <Users className="w-4 h-4" />
          <span>Show all channels</span>
        </Link>
      </div>

      <hr className="my-2 border-slate-200/80" />

      {/* 4. Creator & Support Tools */}
      <div className="space-y-0.5 pt-1 pb-4 text-xs">
        <Link
          href={user ? "/studio" : "/login?redirect=/studio"}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
        >
          <VideoIcon className="w-4 h-4 text-slate-500" />
          <span>Creator Studio</span>
        </Link>
        <Link
          href={user ? "/dashboard/wallet" : "/login?redirect=/dashboard/wallet"}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
        >
          <Wallet className="w-4 h-4 text-slate-500" />
          <span>Earnings &amp; Wallet</span>
        </Link>
        <Link
          href="/support"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
        >
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>Help &amp; Support</span>
        </Link>
      </div>

      <div className="px-3 pt-2 text-[10px] text-slate-400 leading-relaxed">
        &copy; {new Date().getFullYear()} Umuguzipro Ltd.
        <br />Rwanda &amp; Global Media
      </div>
    </aside>
  );
}
