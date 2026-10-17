'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { notificationService } from '@/lib/services/notificationService';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  Shield,
  Music2,
  Users,
  Building2,
  Check,
  Menu,
  X,
  Calendar,
  Sparkles,
  Music,
  User,
  Mic,
  Upload,
  Wallet,
  ShoppingBag,
  ExternalLink,
  Settings,
  LayoutDashboard,
  Info,
  MessageSquare
} from 'lucide-react';

export function ChoirHeader() {
  const { user, artistProfile, signOut } = useAuth();
  const { activeChoir, choirs, selectChoir, isAdmin } = useChoir();

  const [choirDropdownOpen, setChoirDropdownOpen] = useState(false);
  const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const choirRef = useRef<HTMLDivElement>(null);
  const artistRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (choirRef.current && !choirRef.current.contains(event.target as Node)) {
        setChoirDropdownOpen(false);
      }
      if (artistRef.current && !artistRef.current.contains(event.target as Node)) {
        setArtistDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadUnreadCount() {
      if (!user) return;
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    }
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 20000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-visible border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl w-full items-center justify-between px-2 sm:px-6 lg:px-8">
        
        {/* Left Section: Brand Logo & Choir Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2 shrink-0 group">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform shrink-0">
              <Music2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Voxify<span className="text-purple-600 dark:text-purple-400 hidden min-[360px]:inline">Space</span>
            </span>
          </Link>

          {/* Choir Selector Dropdown */}
          <div className="relative" ref={choirRef}>
            <button
              type="button"
              onClick={() => {
                setChoirDropdownOpen(!choirDropdownOpen);
                setArtistDropdownOpen(false);
                setProfileDropdownOpen(false);
              }}
              className="flex items-center gap-1 sm:gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 px-2 sm:px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/70 transition-all max-w-[90px] min-[360px]:max-w-[125px] sm:max-w-[170px]"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{activeChoir?.name || 'Choir'}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-500 shrink-0 transition-transform ${choirDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {choirDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Your Active Choirs
                </div>
                {choirs.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      selectChoir(c.id);
                      setChoirDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      activeChoir?.id === c.id
                        ? 'bg-purple-600/15 text-purple-600 dark:text-purple-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </div>
                    {activeChoir?.id === c.id && <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                  </button>
                ))}

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                
                <Link
                  href="/choir/create"
                  onClick={() => setChoirDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create New Choir</span>
                </Link>

                <Link
                  href="/dashboard"
                  onClick={() => setChoirDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Join Choir with Code</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Center/Right Section: Desktop Navigation Items */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
          <nav className="hidden md:flex items-center gap-1 text-xs">
            
            <Link
              href="/dashboard"
              className="px-2.5 py-1.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Dashboard
            </Link>

            <Link
              href="/songs"
              className="px-2.5 py-1.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Choir Songs
            </Link>

            <Link
              href="/events"
              className="px-2.5 py-1.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Events
            </Link>

            <Link
              href="/marketplace"
              className="px-2.5 py-1.5 rounded-xl font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Marketplace
            </Link>

            <Link
              href="/purchases"
              className="px-2.5 py-1.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              My Music
            </Link>

            {/* ARTIST HUB DROPDOWN (Requested by User) */}
            <div className="relative" ref={artistRef}>
              <button
                type="button"
                onClick={() => {
                  setArtistDropdownOpen(!artistDropdownOpen);
                  setChoirDropdownOpen(false);
                  setProfileDropdownOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                  artistProfile
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Artist Hub</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${artistDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {artistDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Artist Features
                  </div>
                  {artistProfile ? (
                    <>
                      <Link
                        href="/artist/dashboard"
                        onClick={() => setArtistDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-purple-500" />
                        <span>Artist Dashboard</span>
                      </Link>
                      <Link
                        href="/artist/songs/upload"
                        onClick={() => setArtistDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-emerald-500" />
                        <span>Upload Song</span>
                      </Link>
                      <Link
                        href="/artist/financials"
                        onClick={() => setArtistDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                      >
                        <Wallet className="w-4 h-4 text-amber-500" />
                        <span>Earnings &amp; Payouts</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/onboarding/artist"
                      onClick={() => setArtistDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Become an Artist</span>
                    </Link>
                  )}
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <Link
                    href="/marketplace"
                    onClick={() => setArtistDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                    <span>Browse Marketplace</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Choir Admin badge button */}
            {isAdmin && (
              <Link
                href="/manage"
                className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-xs"
              >
                Choir Admin
              </Link>
            )}

            {/* Platform Super Admin badge button */}
            {user?.is_super_admin && (
              <Link
                href="/admin"
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </Link>
            )}
          </nav>


          {/* Notifications Bell */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* USER PROFILE DROPDOWN (Requested by User) */}
          {user ? (
            <div className="relative hidden md:block" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setChoirDropdownOpen(false);
                  setArtistDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-xl object-cover border border-purple-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  {/* User Profile Card Header */}
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {user.full_name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {user.is_super_admin && (
                        <span className="text-[10px] uppercase font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-md">
                          Super Admin
                        </span>
                      )}
                      {artistProfile && (
                        <span className="text-[10px] uppercase font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-md">
                          Artist
                        </span>
                      )}
                      {isAdmin && (
                        <span className="text-[10px] uppercase font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                          Choir Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Account Navigation Links */}
                  <div className="py-1 space-y-0.5">
                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>My Profile &amp; Settings</span>
                    </Link>

                    <Link
                      href="/purchases"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Music className="w-4 h-4 text-slate-500" />
                      <span>My Purchased Songs</span>
                    </Link>

                    {artistProfile && (
                      <Link
                        href="/artist/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                      >
                        <Mic className="w-4 h-4 text-purple-500" />
                        <span>Artist Control Center</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        href="/manage"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span>Choir Administration</span>
                      </Link>
                    )}

                    {user.is_super_admin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-purple-500" />
                        <span>Super Admin Panel</span>
                      </Link>
                    )}

                    <Link
                      href="/about"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Info className="w-4 h-4 text-blue-500" />
                      <span>About NebeluRw</span>
                    </Link>

                    <Link
                      href="/contact"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      <span>Contact Support</span>
                    </Link>
                  </div>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:inline-flex text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE FULL-FEATURED DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-top-3">
          
          {/* User Status Card */}
          {user ? (
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80"
            >
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-xl object-cover border border-purple-500/40" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                    {user.full_name}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    Profile &amp; Settings &rarr;
                  </div>
                </div>
              </div>
              {user.is_super_admin && (
                <span className="text-[10px] uppercase font-black bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-purple-600 text-white font-bold text-sm shadow-md"
            >
              Sign In / Register
            </Link>
          )}

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Choir &amp; Music
            </div>
            
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <LayoutDashboard className="w-4 h-4 text-purple-500" />
              <span>Choir Dashboard</span>
            </Link>

            <Link
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Music Marketplace</span>
            </Link>

            <Link
              href="/purchases"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ShoppingBag className="w-4 h-4 text-indigo-500" />
              <span>My Purchased Music</span>
            </Link>

            <Link
              href="/songs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Music className="w-4 h-4 text-purple-500" />
              <span>Choir Song Library</span>
            </Link>

            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Events &amp; Rehearsals</span>
            </Link>

            <Link
              href="/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-rose-500" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white font-bold text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>

          {/* Artist Hub Mobile Section */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Artist Hub
            </div>
            {artistProfile ? (
              <>
                <Link
                  href="/artist/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30"
                >
                  <Mic className="w-4 h-4 text-purple-500" />
                  <span>Artist Dashboard</span>
                </Link>
                <Link
                  href="/artist/songs/upload"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Upload className="w-4 h-4 text-emerald-500" />
                  <span>Upload New Song</span>
                </Link>
                <Link
                  href="/artist/financials"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Wallet className="w-4 h-4 text-amber-500" />
                  <span>Earnings &amp; Withdrawals</span>
                </Link>
              </>
            ) : (
              <Link
                href="/onboarding/artist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30"
              >
                <Plus className="w-4 h-4" />
                <span>Become an Artist Creator</span>
              </Link>
            )}
          </div>

          {/* Management / Admin Mobile Section */}
          {(isAdmin || user?.is_super_admin) && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Administration
              </div>
              {isAdmin && (
                <Link
                  href="/manage"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>Choir Admin Panel</span>
                </Link>
              )}
              {user?.is_super_admin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20"
                >
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span>Platform Super Admin</span>
                </Link>
              )}
            </div>
          )}

          {/* Quick Links & Company Info */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="space-y-1">
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Info className="w-4 h-4 text-blue-500" />
                <span>About NebeluRw Co. Ltd</span>
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span>Contact &amp; WhatsApp Support</span>
              </Link>
            </div>

            {user && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 font-bold text-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
