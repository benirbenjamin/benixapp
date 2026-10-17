'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { financialService, ArtistFinancialSummary } from '@/lib/services/financialService';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { MarketplaceSong } from '@/lib/types/database.types';
import { BackButton } from '@/components/ui/BackButton';
import {
  Mic,
  Music,
  Plus,
  Wallet,
  TrendingUp,
  Eye,
  Heart,
  Sparkles,
  ArrowUpRight,
  ShoppingBag,
  Users,
  Pencil,
} from 'lucide-react';


export default function ArtistDashboardPage() {
  const router = useRouter();
  const { user, artistProfile, loading: authLoading } = useAuth();
  const { choirs, activeChoir } = useChoir();
  const [summary, setSummary] = useState<ArtistFinancialSummary | null>(null);
  const [songs, setSongs] = useState<MarketplaceSong[]>([]);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(5000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/artist/dashboard');
      return;
    }

    if (!authLoading && user && !artistProfile) {
      router.push('/onboarding/artist');
      return;
    }

    async function loadData() {
      if (!artistProfile) return;
      setLoading(true);
      try {
        const [sum, artistSongs, settings] = await Promise.all([
          financialService.getArtistFinancialSummary(artistProfile.id),
          marketplaceService.getMarketplaceSongs({ artistId: artistProfile.id }),
          financialService.getMarketplaceSettings(),
        ]);
        setSummary(sum);
        setSongs(artistSongs);
        if (settings?.min_withdrawal_amount) {
          setMinWithdrawal(settings.min_withdrawal_amount);
        }
      } catch (err) {
        console.error('Failed to load artist dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (artistProfile) {
      loadData();
    }
  }, [user, artistProfile, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!artistProfile) return null;

  const totalViews = songs.reduce((acc, s) => acc + (s.views_count || 0), 0);
  const totalLikes = songs.reduce((acc, s) => acc + (s.likes_count || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Back Button Navigation */}
      <div className="flex items-center justify-between">
        <BackButton href="/dashboard" label="Back to Choir Dashboard" />
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Browse Marketplace &rarr;
        </Link>
      </div>

      {/* Dual-Role Switch to Choir Workspace */}
      {(choirs.length > 0 || activeChoir) && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 p-4 sm:p-5 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-400/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Users className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Dual-Role Account Active
                </span>
                <span className="text-xs font-bold text-white/80">Choir Director &amp; Artist</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Currently in <span className="text-blue-300">Artist Studio</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="flex-1 sm:flex-none text-center px-4 py-2.5 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-black text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Music className="w-4 h-4 text-blue-600" />
              <span>Switch to Choir Dashboard &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* Top Professional Royal Banner - Matching Admin Dashboard Card Theme */}
      <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-sm text-slate-900 dark:text-white">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Artist Control Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, <span className="text-blue-600 dark:text-blue-400">{artistProfile.stage_name}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Manage your published songs, track marketplace sales, and request Momo/Bank payout earnings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/artist/songs/upload"
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-5 py-3 rounded-2xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 text-xs sm:text-sm active:scale-95"
            >
              <Plus className="w-4 h-4" /> Upload New Song
            </Link>
            <Link
              href="/artist/financials"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 text-xs sm:text-sm active:scale-95"
            >
              <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Payout &amp; Ledger
            </Link>
          </div>
        </div>
      </div>

      {/* Financial & Performance Metric Cards - High Contrast & Professional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Available Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Balance</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {(summary?.availableBalance || 0).toLocaleString()} <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">RWF</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Minimum: {minWithdrawal.toLocaleString()} RWF</span>
            <Link href="/artist/financials" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
              Withdraw &rarr;
            </Link>
          </div>
        </div>

        {/* Total Net Earnings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Net Earnings</span>
            <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {(summary?.totalEarnings || 0).toLocaleString()} <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">RWF</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            From {summary?.totalSalesCount || 0} song purchases
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Song Listeners / Views</span>
            <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{totalViews.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Across {songs.length} published tracks
          </div>
        </div>

        {/* Total Likes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Track Likes</span>
            <div className="p-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{totalLikes.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Listener appreciation count
          </div>
        </div>
      </div>

      {/* Published Song Catalog Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Your Published Songs ({songs.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Songs available for purchase and audio preview on Voxify Marketplace</p>
          </div>
          <Link
            href="/artist/songs/upload"
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-500 flex items-center gap-1"
          >
            + Upload Song
          </Link>
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No songs published yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Start earning by uploading your first audio track with custom audio preview range and pricing.
            </p>
            <Link
              href="/artist/songs/upload"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Upload Your First Song
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {songs.map(song => (
              <div
                key={song.id}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-purple-300 dark:hover:border-purple-800 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 relative border border-slate-300 dark:border-slate-700">
                    {song.cover_image_url ? (
                      <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm bg-purple-500/10">
                        <Music className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{song.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[10px]">
                        {song.genre?.name || song.music_type}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                        {song.price.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-xs">
                  <div className="text-right hidden sm:block mr-1">
                    <div className="text-slate-800 dark:text-slate-200 font-bold">{song.purchases_count || 0} sales</div>
                    <div className="text-slate-500 text-[10px]">{song.views_count || 0} plays</div>
                  </div>
                  <Link
                    href={`/artist/songs/${song.id}/edit`}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 font-bold text-xs"
                    title="Edit Song Details"
                  >
                    <Pencil className="w-4 h-4 text-amber-600" />
                    <span className="hidden sm:inline text-amber-700">Edit</span>
                  </Link>
                  <Link
                    href={`/songs/marketplace/${song.id}`}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                    title="View Song Marketplace Page"
                  >
                    <ArrowUpRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
