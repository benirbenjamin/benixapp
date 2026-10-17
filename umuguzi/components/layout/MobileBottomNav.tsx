"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home,
  HelpCircle,
  Briefcase,
  LayoutDashboard,
  Store,
  PlusCircle,
  Video,
} from "lucide-react";
import { useApp } from "../providers/AppProviders";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useApp();

  const isHomePage = pathname === "/";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 text-white shadow-2xl px-2 py-1.5 flex items-center justify-around text-[10px] font-bold">
      {/* Back Button (shown on non-home pages) */}
      {!isHomePage && (
        <button
          onClick={() => router.back()}
          className="flex flex-col items-center justify-center p-1 text-slate-400 hover:text-white transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5 mb-0.5" />
          <span>Back</span>
        </button>
      )}

      {/* Home Link */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center p-1 transition-colors relative ${
          pathname === "/" ? "text-brand-accent font-black" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
        {pathname === "/" && <span className="absolute -bottom-1 w-1 h-1 bg-brand-accent rounded-full" />}
      </Link>

      {/* Offered Services */}
      <Link
        href="/services"
        className={`flex flex-col items-center justify-center p-1 transition-colors relative ${
          pathname === "/services" ? "text-brand-accent font-black" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Briefcase className="w-5 h-5 mb-0.5" />
        <span>Services</span>
        {pathname === "/services" && <span className="absolute -bottom-1 w-1 h-1 bg-brand-accent rounded-full" />}
      </Link>

      {/* Center Action: Plus / Post Button */}
      <Link
        href={user ? "/studio/upload" : "/service-requests/create"}
        className="flex flex-col items-center justify-center -mt-4 bg-brand hover:bg-brand-hover text-white p-2.5 rounded-full shadow-lg border-2 border-slate-900 transition-transform active:scale-95"
        title="Post Request or Upload Video"
      >
        <PlusCircle className="w-6 h-6" />
      </Link>

      {/* Service Needs ("What People Need") */}
      <Link
        href="/service-requests"
        className={`flex flex-col items-center justify-center p-1 transition-colors relative ${
          pathname.startsWith("/service-requests") ? "text-amber-400 font-black" : "text-amber-300/80 hover:text-amber-300"
        }`}
      >
        <HelpCircle className="w-5 h-5 mb-0.5 text-amber-400" />
        <span>Needs</span>
        {pathname.startsWith("/service-requests") && <span className="absolute -bottom-1 w-1 h-1 bg-amber-400 rounded-full" />}
      </Link>

      {/* Marketplace Link */}
      <Link
        href="/products"
        className={`flex flex-col items-center justify-center p-1 transition-colors relative ${
          pathname === "/products" ? "text-brand-accent font-black" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Store className="w-5 h-5 mb-0.5" />
        <span>Market</span>
        {pathname === "/products" && <span className="absolute -bottom-1 w-1 h-1 bg-brand-accent rounded-full" />}
      </Link>

      {/* Dashboard / Account Link */}
      <Link
        href={user ? "/dashboard" : "/login"}
        className={`flex flex-col items-center justify-center p-1 transition-colors relative ${
          pathname.startsWith("/dashboard") ? "text-brand-accent font-black" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>{user ? "Dashboard" : "Account"}</span>
        {pathname.startsWith("/dashboard") && <span className="absolute -bottom-1 w-1 h-1 bg-brand-accent rounded-full" />}
      </Link>
    </div>
  );
}
