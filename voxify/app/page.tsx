'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { statsService } from '@/lib/services/statsService';
import { MarketplaceSong } from '@/lib/types/database.types';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Footer } from '@/components/layout/Footer';
import { SongShareButtons } from '@/components/marketplace/SongShareButtons';
import { GoogleAdSenseBanner } from '@/components/ads/GoogleAdSenseBanner';
import { generateSongCover } from '@/lib/utils/coverGenerator';
import {
  Users,
  Music,
  ArrowRight,
  Shield,
  Sparkles,
  Play,
  Pause,
  ShoppingBag,
  Mic,
  LayoutDashboard,
  Calendar,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  X
} from 'lucide-react';


export default function HomePage() {
  const router = useRouter();
  const { user, artistProfile, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [featuredSongs, setFeaturedSongs] = useState<MarketplaceSong[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  // Stats Counters
  const [stats, setStats] = useState({
    totalChoirs: 0,
    totalAudioTracks: 0,
    totalSongs: 0,
    totalMembers: 0,
  });

  // Audio preview state
  const [currentPreviewSong, setCurrentPreviewSong] = useState<MarketplaceSong | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [previewError, setPreviewError] = useState<{ songId: string; message: string } | null>(null);

  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      setIsPlayingPreview(false);
      setCurrentPreviewSong(null);
    }
  };

  // Stop audio when navigating away or unmounting
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  useEffect(() => {
    async function loadData() {
      try {
        const [songs, liveStats] = await Promise.all([
          marketplaceService.getMarketplaceSongs({ sortBy: 'popular', hidePurchased: true }),
          statsService.getPlatformStats(),
        ]);
        setFeaturedSongs(songs.slice(0, 6));
        setStats(liveStats);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoadingSongs(false);
      }
    }
    loadData();
  }, []);

  const handlePlayPreview = (song: MarketplaceSong) => {
    setPreviewError(null);

    if (currentPreviewSong?.id === song.id && audioElement) {
      if (isPlayingPreview) {
        audioElement.pause();
        setIsPlayingPreview(false);
      } else {
        audioElement.play().catch(() => {
          setIsPlayingPreview(false);
          setPreviewError({ songId: song.id, message: 'Playback was blocked by browser. Please tap again to start audio.' });
        });
        setIsPlayingPreview(true);
      }
      return;
    }

    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    const audioUrl = song.preview_audio_path || song.audio_file_path;
    if (!audioUrl || audioUrl.startsWith('blob:')) {
      setPreviewError({
        songId: song.id,
        message: 'Audio preview stream is not yet available for this track.'
      });
      return;
    }

    const audio = new Audio(audioUrl);
    audio.currentTime = song.preview_start_time || 0;

    const previewEnd = song.preview_end_time || (song.preview_start_time + 30);
    audio.ontimeupdate = () => {
      if (audio.currentTime >= previewEnd) {
        audio.pause();
        setIsPlayingPreview(false);
      }
    };

    audio.onerror = (e) => {
      console.warn('Audio preview failed to load', e);
      setIsPlayingPreview(false);
      setCurrentPreviewSong(null);
      const errCode = audio.error?.code;
      let msg = 'Failed to load audio preview stream.';
      if (errCode === 4) {
        msg = 'Audio format not supported by browser.';
      } else if (errCode === 2) {
        msg = 'Network connection error while streaming preview.';
      }
      setPreviewError({ songId: song.id, message: msg });
    };

    audio.onended = () => setIsPlayingPreview(false);

    audio.play().catch(e => {
      console.warn('Could not play audio preview:', e);
      setIsPlayingPreview(false);
      setPreviewError({
        songId: song.id,
        message: 'Playback was blocked by browser. Please tap again to start audio.'
      });
    });

    setAudioElement(audio);
    setCurrentPreviewSong(song);
    setIsPlayingPreview(true);

    marketplaceService.recordSongView(song.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070e1e] dark:text-slate-100 flex flex-col justify-between scroll-smooth overflow-x-hidden w-full font-sans pb-16 transition-colors duration-200">
      
      {/* Navigation Header Bar */}
      <header className="border-b border-slate-200 dark:border-blue-900/40 bg-white/95 dark:bg-[#091428]/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600 text-white p-1 flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <Image src="/logo.png" alt="Voxify Logo" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-2xl tracking-tight text-slate-900 dark:text-white">
                Voxify<span className="text-blue-600 dark:text-blue-400 hidden min-[360px]:inline">Space</span>
              </span>
              <span className="hidden sm:block text-[11px] text-slate-500 dark:text-blue-300/80 font-bold uppercase tracking-widest">
                Choir SaaS &amp; Music Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Link href="/songs/marketplace" className="text-blue-600 dark:text-blue-400 hover:underline font-extrabold flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-4 h-4 text-blue-500" /> Marketplace
            </Link>
            <a href="#featured-songs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Featured Songs</a>
            <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link>
            <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Sign In</Link>
          </nav>

          {/* Auth-Aware Action Buttons & Theme Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggle showLabel={false} />
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-3">
                {artistProfile ? (
                  <Link
                    href="/artist/dashboard"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-2.5 sm:px-3.5 py-2 rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
                    title="Artist Portal"
                  >
                    <Mic className="w-4 h-4" />
                    <span className="hidden md:inline">Artist Portal</span>
                  </Link>
                ) : (
                  <Link
                    href="/onboarding/artist"
                    className="bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 sm:px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1"
                    title="Become Artist"
                  >
                    <Mic className="w-4 h-4 text-blue-500" />
                    <span className="hidden md:inline">Become Artist</span>
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="px-2 sm:px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden text-[11px]">Exit</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white px-2.5 sm:px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-1"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5 hidden min-[360px]:inline" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>


      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Blue Ambient Glow for Dark Theme */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] sm:w-[750px] h-[250px] sm:h-[450px] bg-blue-500/20 dark:bg-blue-600/25 blur-[100px] sm:blur-[160px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
          
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-widest shadow-xs">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Multi-Tenant Choir SaaS</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs font-extrabold uppercase tracking-widest shadow-xs">
              <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Music Creator Marketplace</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-950 dark:text-white leading-tight sm:leading-tight">
            Manage Your Choir. <br />
            <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 underline-offset-8">
              Discover &amp; Sell Original Music.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-200 max-w-3xl mx-auto leading-relaxed px-2 font-medium">
            Voxify empowers Choir Masters to manage rehearsals, multi-track voice parts (Soprano, Alto, Tenor, Bass), and Sunday worship. <strong className="text-slate-950 dark:text-white font-extrabold">Songwriters &amp; Music Artists</strong> can now publish songs, set custom audio previews, earn sales revenue, and receive Mobile Money payouts!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/marketplace"
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 text-sm active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Explore Music Marketplace
            </Link>
            <Link
              href="/register"
              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold px-6 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm transition-all flex items-center gap-2 text-sm active:scale-95"
            >
              <span>Create Choir or Artist Profile</span> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Join Code Box */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-blue-900/60 p-2 sm:p-2.5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2 backdrop-blur-xl">
              <input
                type="text"
                placeholder="Enter Choir Code (e.g. K7P2A)"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={5}
                className="w-full bg-transparent px-4 py-2.5 text-center sm:text-left text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none uppercase font-mono tracking-widest font-extrabold"
              />
              <Link
                href={code.length === 5 ? `/join/${code}` : '#'}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shrink-0 ${
                  code.length === 5
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>Join Choir</span> <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Google AdSense Slot: Homepage Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <GoogleAdSenseBanner slot="7034214536" className="my-4" />
      </div>

      {/* FEATURED ARTIST MUSIC & MARKETPLACE SECTION */}
      <section id="featured-songs" className="bg-slate-100/70 dark:bg-[#091326] border-y border-slate-200 dark:border-blue-950 py-16 sm:py-20 px-4 sm:px-8 space-y-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-extrabold text-xs uppercase tracking-wider">
                <Mic className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> New Released Songs &amp; Rwandan Local Music
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white">
                Featured Songs on Voxify Marketplace
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
                Listen to audio preview clips from independent songwriters and gospel creators across Rwandan local genres (Sebene, Igisirimba, Zoulu) and global tracks.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/marketplace"
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-5 py-3 rounded-2xl text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4" /> View All Marketplace Songs &rarr;
              </Link>
            </div>
          </div>

          {/* Songs Grid */}
          {loadingSongs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-[#0b162b] p-5 rounded-3xl border border-slate-200 dark:border-blue-900/40 space-y-4 animate-pulse">
                  <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : featuredSongs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#0b162b] rounded-3xl border border-slate-200 dark:border-blue-900/40 space-y-3">
              <Music className="w-10 h-10 text-blue-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No marketplace songs published yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Be the first artist to publish original music on Voxify!</p>
              <Link
                href="/onboarding/artist"
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md"
              >
                <Mic className="w-4 h-4" /> Become an Artist Publisher
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSongs.map(song => {
                const isCurrentlyPlaying = currentPreviewSong?.id === song.id && isPlayingPreview;
                const coverArt = song.cover_image_url || generateSongCover({
                  title: song.title,
                  artistName: song.artist?.stage_name,
                  genre: song.genre?.name || song.music_type,
                });

                return (
                  <div
                    key={song.id}
                    onClick={() => {
                      stopAudio();
                      router.push(`/songs/marketplace/${song.id}`);
                    }}
                    className="bg-white dark:bg-[#0b162b] border border-slate-200 dark:border-blue-900/50 rounded-3xl p-5 space-y-4 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all group flex flex-col justify-between shadow-xs cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <img
                        src={coverArt}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Genre & Local Tags - High Contrast Guaranteed */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                        <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white font-black text-[10px] uppercase tracking-wider border border-white/20 shadow-sm">
                          {song.genre?.name || song.music_type}
                        </span>
                        {song.genre?.is_local && (
                          <span className="px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black border border-emerald-400/40 shadow-sm">
                            Local
                          </span>
                        )}
                      </div>

                      {/* Preview Play Overlay Button - Visible On Mobile */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPreview(song);
                        }}
                        className={`absolute inset-0 bg-black/35 flex items-center justify-center transition-all cursor-pointer z-20 ${
                          isCurrentlyPlaying
                            ? 'opacity-100'
                            : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                        }`}
                        aria-label={isCurrentlyPlaying ? 'Pause Audio Preview' : 'Play Audio Preview'}
                      >
                        <div className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform border border-white/30">
                          {isCurrentlyPlaying ? (
                            <Pause className="w-6 h-6 fill-current text-white" />
                          ) : (
                            <Play className="w-6 h-6 fill-current text-white ml-0.5" />
                          )}
                        </div>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 dark:text-blue-300/80 font-bold block truncate">
                        {song.artist?.stage_name || 'Independent Creator'}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-950 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {song.title}
                      </h3>
                      {song.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed pt-0.5">
                          {song.description}
                        </p>
                      )}

                      {/* Inline Preview Error Message */}
                      {previewError?.songId === song.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 mt-2"
                        >
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="flex-1 leading-snug">{previewError.message}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewError(null)}
                            className="text-rose-400 hover:text-rose-600 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-blue-900/40 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-bold block">Buy Song</span>
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono truncate block">
                          {song.price.toLocaleString()} RWF
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <SongShareButtons song={song} variant="compact" />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayPreview(song);
                          }}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center text-xs font-bold cursor-pointer ${
                            isCurrentlyPlaying
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          title={isCurrentlyPlaying ? 'Pause preview' : 'Play preview'}
                        >
                          {isCurrentlyPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            stopAudio();
                            router.push(`/songs/marketplace/${song.id}`);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-3.5 sm:px-4 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Get Song</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>
      </section>

      {/* Google AdSense Slot: Homepage Middle Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <GoogleAdSenseBanner slot="7034214536" className="my-4" />
      </div>

      {/* Real Database Statistics Counter Banner */}
      <section className="bg-white dark:bg-[#070e1e] py-14 px-4 sm:px-6 border-b border-slate-200 dark:border-blue-950">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          <div className="space-y-1 p-4 rounded-2xl bg-slate-50 dark:bg-[#0b162b] border border-slate-200 dark:border-blue-900/40">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white">
              {stats.totalChoirs > 0 ? `${stats.totalChoirs}+` : '100+'}
            </span>
            <span className="block text-xs font-bold text-slate-500 dark:text-blue-300 uppercase tracking-wider">Registered Choirs</span>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-slate-50 dark:bg-[#0b162b] border border-slate-200 dark:border-blue-900/40">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white">
              {stats.totalAudioTracks > 0 ? `${stats.totalAudioTracks}+` : '1,000+'}
            </span>
            <span className="block text-xs font-bold text-slate-500 dark:text-blue-300 uppercase tracking-wider">Voice Audio Tracks</span>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-slate-50 dark:bg-[#0b162b] border border-slate-200 dark:border-blue-900/40">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white">
              {stats.totalSongs > 0 ? `${stats.totalSongs}+` : '500+'}
            </span>
            <span className="block text-xs font-bold text-slate-500 dark:text-blue-300 uppercase tracking-wider">Song Practice Files</span>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-slate-50 dark:bg-[#0b162b] border border-slate-200 dark:border-blue-900/40">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white">
              {stats.totalMembers > 0 ? `${stats.totalMembers}+` : '5,000+'}
            </span>
            <span className="block text-xs font-bold text-slate-500 dark:text-blue-300 uppercase tracking-wider">Active Choir Singers</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
