'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { eventService } from '@/lib/services/eventService';
import { songService } from '@/lib/services/songService';
import { announcementService } from '@/lib/services/announcementService';
import { attendanceService, AttendanceStats } from '@/lib/services/attendanceService';
import { subscriptionService } from '@/lib/services/subscriptionService';
import { Event, Song, Announcement, SubscriptionPlan } from '@/lib/types/database.types';
import {
  Music,
  Calendar,
  Users,
  Sparkles,
  Volume2,
  ArrowRight,
  Share2,
  Copy,
  Check,
  Crown,
  Zap,
  KeyRound,
  Plus,
  Percent,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  UserCheck,
  Mic,
  ShoppingBag
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, artistProfile } = useAuth();
  const { activeChoir, activeMember, isAdmin, choirs, loading: choirLoading } = useChoir();

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  
  // Personal Singer Analytics State
  const [myAttendanceStats, setMyAttendanceStats] = useState<AttendanceStats | null>(null);
  const [myLearningStats, setMyLearningStats] = useState<{ readyCount: number; learningCount: number }>({ readyCount: 0, learningCount: 0 });

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  useEffect(() => {
    // Wait until choir context finishes loading before checking role redirection
    if (choirLoading) return;

    // Only redirect if user is exclusively an artist with NO choirs created or joined
    if (user?.user_type === 'artist' && choirs.length === 0 && !activeChoir) {
      router.push(artistProfile ? '/artist/dashboard' : '/onboarding/artist');
      return;
    }

    async function loadData() {
      if (!activeChoir) return;
      
      const [eventsData, songsData, announceData, subData] = await Promise.all([
        eventService.getChoirEvents(activeChoir.id),
        songService.getChoirSongs(activeChoir.id),
        announcementService.getAnnouncements(activeChoir.id),
        subscriptionService.getChoirSubscription(activeChoir.id),
      ]);

      setUpcomingEvents(eventsData);
      setSongs(songsData);
      setAnnouncements(announceData);
      setCurrentPlan(subData.plan);

      // Load Personal Singer Analytics if active member profile loaded
      if (activeMember) {
        const [attStats, learnStats] = await Promise.all([
          attendanceService.getMemberAttendanceStats(activeMember.id),
          songService.getMemberLearningSummary(activeMember.id),
        ]);
        setMyAttendanceStats(attStats);
        setMyLearningStats(learnStats);
      }
    }
    loadData();
  }, [user, artistProfile, activeChoir, activeMember, router, choirLoading, choirs]);

  const copyCode = () => {
    if (!activeChoir) return;
    navigator.clipboard.writeText(activeChoir.choir_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareableLink = activeChoir
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://voxify.space'}/join/${activeChoir.choir_code}`
    : '';

  const copyLink = () => {
    if (!shareableLink) return;
    navigator.clipboard.writeText(shareableLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (!activeChoir || !shareableLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${activeChoir.name} on Voxify Space`,
          text: `Use this link or code ${activeChoir.choir_code} to join ${activeChoir.name} choir on Voxify Space!`,
          url: shareableLink,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    router.push(`/join/${joinCodeInput.trim().toUpperCase()}`);
  };

  // State: No Active Choir Joined Yet (Singers, Artists, Directors, Market Buyers)
  if (!activeChoir) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-10">
        {/* Dual-Role Workspace Switcher */}
        {(artistProfile || user?.user_type === 'artist') && (
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 p-4 sm:p-5 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-purple-400/30">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-purple-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                    Dual-Role Account
                  </span>
                  <span className="text-xs font-bold text-white/80">Choir Management &amp; Artist Creator</span>
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                  Currently viewing <span className="text-amber-300">Choir Management</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link
                href="/artist/dashboard"
                className="flex-1 sm:flex-none text-center px-4 py-2.5 rounded-2xl bg-white text-purple-900 hover:bg-purple-50 font-black text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-purple-600" />
                <span>Go to Artist Dashboard &rarr;</span>
              </Link>
            </div>
          </div>
        )}

        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-3xl flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800 shadow-sm">
            <Music className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome to Voxify Space
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Hello <strong className="text-purple-600 dark:text-purple-400">{user?.full_name || 'there'}</strong>! Get started by joining a choir group, browsing original music on the marketplace, or becoming a verified creator.
          </p>
        </div>

        {/* 4 Feature Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Join Choir (with input form) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Join a Choir Group</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  Have a 5-character choir code from your Choir Director? Enter it below to join your choir and access rehearsal audio parts.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-3">
              <input
                type="text"
                required
                maxLength={8}
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER CHOIR CODE (e.g. ABC12)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-mono tracking-widest text-slate-900 dark:text-purple-300 font-bold uppercase focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
              >
                Join Choir <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Card 2: Browse Marketplace */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Store Catalog
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Explore Music Marketplace</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  Discover and purchase original songs, gospel hymns, vocal arrangements, and backing tracks from top Rwandan &amp; African artists.
                </p>
              </div>
            </div>

            <Link
              href="/marketplace"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
            >
              Browse Music Store <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: Become an Artist */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                  For Creators
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Become a Music Artist</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  Are you a songwriter, composer, or musician? Publish your tracks, set your prices, and earn instant payouts directly to Mobile Money.
                </p>
              </div>
            </div>

            <Link
              href="/onboarding/artist"
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
            >
              Start Selling Your Songs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 4: Create Choir (Choir Masters) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Choir Directors
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Create a New Choir</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  Create and manage your own choir organization, upload soprano/alto/tenor/bass practice audios, and organize rehearsals.
                </p>
              </div>
            </div>

            <Link
              href="/choir/create"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
            >
              Create Choir Group <Plus className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending Approval Screen for singers awaiting Choir Master approval
  if (activeMember && activeMember.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 text-center">
        <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/30 animate-pulse">
          <KeyRound className="w-8 h-8" />
        </div>

        <div className="space-y-3">
          <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-300 dark:border-amber-500/30 font-bold uppercase tracking-widest">
            ⏳ Membership Approval Pending
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Join Request Submitted</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Hello <strong className="text-purple-600 dark:text-purple-400">{user?.full_name}</strong>! Your request to join <strong className="text-amber-600 dark:text-amber-300">{activeChoir.name}</strong> has been sent to the Choir Master for review.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 text-left shadow-lg">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Request Information</h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Choir Name</span>
                <span className="font-semibold text-slate-900 dark:text-white">{activeChoir.name}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Choir Code</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{activeChoir.choir_code}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold capitalize">{activeMember.status}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Date Requested</span>
                <span className="text-slate-700 dark:text-slate-300">{new Date(activeMember.joined_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Once approved by your Choir Director, full access to practice tracks, Sunday worship songs, events, and announcements will automatically unlock.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => activeChoir && useChoir().refreshChoirs(activeChoir.id)}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2"
            >
              Refresh Approval Status
            </button>
          </div>
        </div>

        {/* Join Another Choir */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-6 rounded-3xl space-y-4 text-left">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Have code for a different choir?</h4>
          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input
              type="text"
              required
              maxLength={8}
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="ENTER OTHER CHOIR CODE"
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-purple-300 font-bold uppercase"
            />
            <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl border border-slate-700">
              Submit Code
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Dual-Role Workspace Switcher */}
      {(artistProfile || user?.user_type === 'artist') && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 p-4 sm:p-5 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-purple-400/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-purple-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Dual-Role Account Active
                </span>
                <span className="text-xs font-bold text-white/80">Choir Director &amp; Artist</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Currently in <span className="text-amber-300">Choir Workspace</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/artist/dashboard"
              className="flex-1 sm:flex-none text-center px-4 py-2.5 rounded-2xl bg-white text-purple-900 hover:bg-purple-50 font-black text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-purple-600" />
              <span>Switch to Artist Dashboard &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* Active Choir Welcome & Code Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 font-semibold uppercase tracking-wider">
              {activeChoir.church_name || 'Active Choir'}
            </span>
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 font-bold uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              {currentPlan?.name || 'Community Free Plan'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{activeChoir.name}</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Welcome back, <strong className="text-purple-600 dark:text-purple-400 font-bold">{user?.full_name}</strong>! Practice your voice parts for upcoming choir rehearsals and services.
          </p>
        </div>

        {/* Choir Code, Copy Link & Native Share App Buttons */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Choir Code</span>
            <span className="text-2xl font-black font-mono tracking-widest text-purple-600 dark:text-purple-400">{activeChoir.choir_code}</span>
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4 flex-wrap justify-center">
            <button
              onClick={copyCode}
              className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Copy Choir Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={copyLink}
              className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Copy Direct Join Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-extrabold shadow-sm"
              title="Open Device Share Menu (WhatsApp, Email, etc.)"
            >
              <Share2 className="w-4 h-4" />
              <span>Share App</span>
            </button>

            {isAdmin && (
              <Link
                href={`/choir/plan-select?choirId=${activeChoir.id}`}
                className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Upgrade Choir Subscription Plan"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Upgrade Plan</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Personal Singer Performance & Learning Analytics Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" /> Your Personal Singer Performance &amp; Song Analytics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Singer Attendance % Hero Card */}
          <Link
            href="/events"
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer block group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Your Attendance</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 group-hover:scale-105 transition-transform">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white">
              {myAttendanceStats ? `${myAttendanceStats.attendancePercentage}%` : '100%'}
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${myAttendanceStats?.attendancePercentage || 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {myAttendanceStats?.presentCount || 0} Present, {myAttendanceStats?.absentCount || 0} Absent →
            </p>
          </Link>

          {/* Songs Fully Learnt Card */}
          <Link
            href="/songs"
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer block group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Songs Fully Learnt</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{myLearningStats.readyCount}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Marked &quot;Ready&quot; for Sunday services →</p>
          </Link>

          {/* Songs Currently Learning Card */}
          <Link
            href="/songs"
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer block group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Songs In Practice</span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{myLearningStats.learningCount}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Currently practicing voice tracks →</p>
          </Link>

          {/* Singer Role & Voice Part */}
          <Link
            href={isAdmin ? "/manage" : "/songs"}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer block group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Voice Section</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 group-hover:scale-105 transition-transform">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-300 capitalize">
              {activeMember?.role === 'owner' ? 'Choir Master' : activeMember?.role === 'admin' ? 'Choir Director' : 'Choir Member'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Status: <span className="text-emerald-600 dark:text-emerald-400 capitalize">{activeMember?.status || 'Active'}</span> →
            </p>
          </Link>
        </div>
      </div>

      {/* Clickable Overview Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/songs"
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-purple-500/50 hover:shadow-md transition-all group cursor-pointer block shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider">Choir Library</span>
            <Music className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">{songs.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Songs with practice audio →</p>
        </Link>

        <Link
          href="/events"
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-indigo-500/50 hover:shadow-md transition-all group cursor-pointer block shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Events</span>
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{upcomingEvents.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sunday services &amp; rehearsals →</p>
        </Link>

        <Link
          href="/announcements"
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-amber-500/50 hover:shadow-md transition-all group cursor-pointer block shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider">Announcements</span>
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">{announcements.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Choir notices &amp; updates →</p>
        </Link>

        <Link
          href={isAdmin ? "/manage" : "/songs"}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-emerald-500/50 hover:shadow-md transition-all group cursor-pointer block shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider">Your Role</span>
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 capitalize">
            {isAdmin ? 'Choir Master / Director' : 'Choir Singer / Member'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAdmin ? 'Access Choir Admin →' : 'Practice Voice Parts →'}
          </p>
        </Link>
      </div>

      {/* Featured Service Songs / Practice Section for Choir Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Songs to Practice
          </h2>
          <Link href="/songs" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1">
            View All Library <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {songs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">No songs added to choir library yet.</p>
            {isAdmin && (
              <Link href="/manage/songs/new" className="inline-block bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm">
                + Upload First Song
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.slice(0, 3).map(song => (
              <Link
                key={song.id}
                href={`/songs/${song.id}`}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4 hover:border-purple-500/60 transition-all group block cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple-800/40">
                    {song.category}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors line-clamp-1">
                    {song.title}
                  </h3>
                  {song.composer && <p className="text-xs text-slate-500 dark:text-slate-400">Composer: {song.composer}</p>}
                </div>

                <div className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all">
                  <Volume2 className="w-4 h-4 text-white" /> Practice Voice Parts
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
