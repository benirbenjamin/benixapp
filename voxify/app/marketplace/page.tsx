'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { Genre, MarketplaceSong } from '@/lib/types/database.types';
import { BackButton } from '@/components/ui/BackButton';
import { generateSongCover } from '@/lib/utils/coverGenerator';
import {
  Sparkles,
  Search,
  Music,
  Play,
  Pause,
  Heart,
  ShoppingBag,
  Mic,
  Filter,
  CheckCircle2,
  Volume2,
  Share2,
  Globe,
  AlertCircle,
  X
} from 'lucide-react';
import { SongShareButtons } from '@/components/marketplace/SongShareButtons';
import { GoogleAdSenseBanner } from '@/components/ads/GoogleAdSenseBanner';


export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [songs, setSongs] = useState<MarketplaceSong[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState<string>('all');
  const [musicTypeCategory, setMusicTypeCategory] = useState<'all' | 'gospel' | 'secular'>('all');
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'price_asc' | 'price_desc'>('popular');

  // Audio Preview State
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

  // Clean up audio playback when leaving page or unmounting
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
      setLoading(true);
      try {
        const [gList, sList] = await Promise.all([
          marketplaceService.getGenres(),
          marketplaceService.getMarketplaceSongs({
            genreId: selectedGenreId,
            musicType: musicTypeCategory,
            isLocalOnly,
            searchQuery,
            sortBy,
            hidePurchased: true,
          }, user?.id),
        ]);
        setGenres(gList);
        setSongs(sList);
      } catch (err) {
        console.error('Error loading marketplace data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedGenreId, musicTypeCategory, isLocalOnly, searchQuery, sortBy, user]);

  const handlePlayPreview = (song: MarketplaceSong) => {
    setPreviewError(null);

    if (currentPreviewSong?.id === song.id && isPlayingPreview) {
      audioElement?.pause();
      setIsPlayingPreview(false);
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
    
    // Set preview start timestamp
    audio.currentTime = song.preview_start_time || 0;

    // Monitor preview end limit
    const previewEnd = song.preview_end_time || (song.preview_start_time + 30);
    audio.ontimeupdate = () => {
      if (audio.currentTime >= previewEnd) {
        audio.pause();
        setIsPlayingPreview(false);
      }
    };

    audio.onerror = (e) => {
      console.warn('Audio preview error', e);
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

    audio.onended = () => {
      setIsPlayingPreview(false);
    };

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

    // Record view
    marketplaceService.recordSongView(song.id);
  };

  const handleLike = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await marketplaceService.toggleLikeSong(songId, user?.id);
      setSongs(songs.map(s => s.id === songId ? { ...s, is_liked: res.liked, likes_count: res.count } : s));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>
      
      {/* Hero Banner Header - Matching Admin Dashboard Featured Card Theme */}
      <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-3xl py-8 sm:py-10 px-6 sm:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-xs uppercase tracking-wider border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Music Marketplace &amp; Creator Platform
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Discover, Preview &amp; Own Original Songs
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-medium leading-relaxed">
            Explore authentic Rwandan local genres (Sebene, Igisirimba, Zoulu, Reggae) and international Gospel &amp; Secular tracks from independent artists.
          </p>

          {/* Search Bar */}
          <div className="pt-2 max-w-2xl">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by song title, lyrics, or songwriter name..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Category & Rwandan Genre Filters */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            
            {/* Gospel vs Secular Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              {[
                { key: 'all', label: 'All Music' },
                { key: 'gospel', label: 'Gospel Only' },
                { key: 'secular', label: 'Secular & Cultural' },
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setMusicTypeCategory(cat.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    musicTypeCategory === cat.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Filter Switches & Sorting */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLocalOnly(!isLocalOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  isLocalOnly
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>Rwandan Local Genres Only</span>
              </button>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="latest">Recently Released</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Genre Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedGenreId('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border ${
                selectedGenreId === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400'
              }`}
            >
              All Genres
            </button>
            {genres.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGenreId(g.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  selectedGenreId === g.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                {g.is_local && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                <span>{g.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Google AdSense Slot: Marketplace Top Banner */}
        <GoogleAdSenseBanner slot="7034214536" className="my-2" />

        {/* Songs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 animate-pulse">
                <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800">
              <Music className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No songs found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Try selecting a different genre or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map(song => {
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
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all group relative flex flex-col justify-between cursor-pointer shadow-sm"
                >
                  {/* Cover Art & Play Button */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 group">
                    <img
                      src={coverArt}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Preview Play Overlay Button - Visible on Mobile */}
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
                          <Play className="w-6 h-6 fill-current text-white ml-1" />
                        )}
                      </div>
                    </button>

                    {/* Tags */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider">
                        {song.genre?.name || song.music_type}
                      </span>
                      {song.genre?.is_local && (
                        <span className="px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                          Local
                        </span>
                      )}
                    </div>

                    {/* Like button */}
                    <button
                      type="button"
                      onClick={(e) => handleLike(song.id, e)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-rose-400 transition-colors z-10"
                    >
                      <Heart className={`w-4 h-4 ${song.is_liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      <span className="truncate">{song.artist?.stage_name || 'Independent Artist'}</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        {song.preview_start_time}s - {song.preview_end_time}s
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {song.title}
                    </h3>

                    {/* Song Description - User Requested Context Before Buying */}
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

                  {/* Bottom Action Row */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 font-bold block">Buy Full Track</span>
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
                        className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-3 sm:px-4 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{song.is_purchased ? 'Stream' : 'Get Song'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Google AdSense Slot: Marketplace Bottom Banner */}
        <GoogleAdSenseBanner slot="7034214536" className="mt-8 mb-4" />

      </div>

      {/* Floating Audio Preview Drawer */}
      {currentPreviewSong && (
        <div
          onClick={() => {
            stopAudio();
            router.push(`/songs/marketplace/${currentPreviewSong.id}`);
          }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:max-w-md bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl shadow-2xl z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 relative border border-slate-700">
              {currentPreviewSong.cover_image_url ? (
                <img src={currentPreviewSong.cover_image_url} alt={currentPreviewSong.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-400">
                  <Music className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Playing Preview Clip</span>
              <h4 className="text-xs font-bold text-white truncate">{currentPreviewSong.title}</h4>
              <p className="text-[10px] text-slate-400 truncate">{currentPreviewSong.artist?.stage_name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPreview(currentPreviewSong);
            }}
            className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 hover:bg-purple-500 shadow-md cursor-pointer"
          >
            {isPlayingPreview ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        </div>
      )}

    </div>
  );
}
