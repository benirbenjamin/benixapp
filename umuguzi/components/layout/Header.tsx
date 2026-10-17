"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Video as VideoIcon,
  Bell,
  Menu,
  X,
  Globe,
  PlusCircle,
  LayoutDashboard,
  Wallet,
  Settings as SettingsIcon,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  Briefcase,
  Store,
  Compass,
  MessageSquare,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";
import { useApp } from "../providers/AppProviders";
import { Language } from "@/lib/i18n";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { settings, language, setLanguage, t, user, logout } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MODERATOR";
  const isHomePage = pathname === "/";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle, Back Button & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {!isHomePage && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs shrink-0"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <Link href="/" className="flex items-center gap-2 group">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt={settings.app_name || "Umuguzipro"}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ring-2 ring-blue-500/20 shadow-sm transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-sm font-black text-base sm:text-lg">
                U
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-brand transition-colors truncate max-w-[120px] sm:max-w-none">
                {settings.app_name || "Umuguzipro"}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-lg mx-2 lg:mx-4">
          <div className="relative w-full flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
              className="w-full pl-10 pr-20 py-2 rounded-full border border-slate-300 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 bg-brand text-white text-xs font-semibold rounded-full hover:bg-brand-hover transition-colors shadow-sm"
            >
              Search
            </button>
          </div>
        </form>

        {/* Right: Navigation, Actions, Language & Auth */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Nav Links for Desktop */}
          <nav className="hidden xl:flex items-center gap-0.5 mr-1 text-xs xl:text-sm font-medium text-slate-600">
            <Link href="/explore" className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors">
              {t.explore}
            </Link>
            <Link href="/services" className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Offered Services
            </Link>
            <Link href="/service-requests" className="px-2.5 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold transition-colors flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              Service Needs
            </Link>
            <Link href="/products" className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Marketplace
            </Link>
            <Link href="/posts" className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Community
            </Link>
          </nav>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center gap-1 text-xs font-semibold uppercase"
              title="Change Language"
            >
              <Globe className="w-4 h-4" />
              <span>{language}</span>
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => { setLanguage("en"); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${language === "en" ? "font-bold text-brand" : "text-slate-700"}`}
                >
                  English <span>🇺🇸</span>
                </button>
                <button
                  onClick={() => { setLanguage("rw"); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${language === "rw" ? "font-bold text-brand" : "text-slate-700"}`}
                >
                  Kinyarwanda <span>🇷🇼</span>
                </button>
                <button
                  onClick={() => { setLanguage("fr"); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${language === "fr" ? "font-bold text-brand" : "text-slate-700"}`}
                >
                  Français <span>🇫🇷</span>
                </button>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <Link
            href={user ? "/studio/upload" : "/login?redirect=/studio/upload"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-brand" />
            <span className="hidden sm:inline">{t.upload}</span>
          </Link>

          {/* Auth State */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* In-App & Native Push Notification Bell */}
              <NotificationBell />

              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-slate-300 transition-all"
                >
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                    </div>
                  )}
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
                      <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-50 text-blue-700">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/studio"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                      >
                        <VideoIcon className="w-4 h-4 text-slate-400" />
                        {t.studio}
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        {t.dashboard}
                      </Link>
                      <Link
                        href="/dashboard/wallet"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                      >
                        <Wallet className="w-4 h-4 text-slate-400" />
                        {t.wallet}
                      </Link>
                      <Link
                        href="/dashboard/services"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-brand"
                      >
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        My Services
                      </Link>
                      <Link
                        href="/products/create"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-emerald-700 font-semibold hover:bg-emerald-50"
                      >
                        <Store className="w-4 h-4 text-emerald-600" />
                        + Sell Digital Product
                      </Link>
                    </div>

                  {isAdmin && (
                    <div className="py-1 bg-amber-50/50">
                      <Link
                        href="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-900 hover:bg-amber-100/60"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        {t.adminPanel}
                      </Link>
                    </div>
                  )}

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      {t.logout}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="whitespace-nowrap shrink-0 inline-flex items-center justify-center px-3.5 sm:px-4 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
              >
                {t.signIn}
              </Link>
              <Link
                href="/register"
                className="whitespace-nowrap shrink-0 inline-flex items-center justify-center px-3.5 sm:px-4 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold shadow-sm transition-all hover:shadow"
              >
                {t.register}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Logged In Quick Navigation & Back Bar */}
      {user && (
        <div className="bg-slate-900 text-white text-xs px-4 sm:px-6 py-2 border-t border-slate-800 flex items-center justify-between overflow-x-auto gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all shadow-xs"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <span className="text-slate-400 font-semibold hidden md:inline truncate">
              Signed in as <strong className="text-white">{user.displayName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link
              href="/dashboard"
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                pathname.startsWith("/dashboard") ? "bg-brand text-white" : "bg-slate-800 text-slate-200 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/services"
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                pathname === "/services" ? "bg-slate-800 text-white font-bold" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Offered Services
            </Link>
            <Link
              href="/service-requests"
              className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                pathname.startsWith("/service-requests")
                  ? "bg-amber-500 text-slate-950 font-extrabold"
                  : "text-amber-400 hover:text-amber-300 hover:bg-slate-800/60"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Service Needs
            </Link>
            <Link
              href="/products"
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                pathname === "/products" ? "bg-slate-800 text-white font-bold" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Marketplace
            </Link>
            <Link
              href="/studio"
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                pathname.startsWith("/studio") ? "bg-slate-800 text-white font-bold" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Studio
            </Link>
            <Link
              href="/dashboard/wallet"
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                pathname === "/dashboard/wallet" ? "bg-slate-800 text-white font-bold" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Wallet
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative w-full flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            </div>
          </form>

          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.back();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-800 bg-slate-100 font-bold text-sm"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              Go Back
            </button>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm"
            >
              <Compass className="w-4 h-4 text-slate-400" />
              {t.home}
            </Link>
            {user && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-brand hover:bg-blue-50 font-bold text-sm"
              >
                <LayoutDashboard className="w-4 h-4 text-brand" />
                User Dashboard
              </Link>
            )}
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm"
            >
              <Briefcase className="w-4 h-4 text-slate-400" />
              Offered Services
            </Link>
            <Link
              href="/service-requests"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-amber-900 bg-amber-50 hover:bg-amber-100 font-bold text-sm"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Service Needs (&quot;What People Need&quot;)
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm"
            >
              <Store className="w-4 h-4 text-slate-400" />
              Marketplace
            </Link>
            <Link
              href="/posts"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm"
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Community
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
