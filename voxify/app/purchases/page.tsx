'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { MarketplaceSong } from '@/lib/types/database.types';
import { generateSongCover } from '@/lib/utils/coverGenerator';
import {
  Music,
  Play,
  Pause,
  Download,
  FileText,
  ShoppingBag,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function MyPurchasesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [purchasedSongs, setPurchasedSongs] = useState<MarketplaceSong[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Streaming Audio Player State
  const [currentSong, setCurrentSong] = useState<MarketplaceSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Selected lyrics modal / view
  const [selectedLyricsSong, setSelectedLyricsSong] = useState<MarketplaceSong | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/purchases');
      return;
    }

    async function loadPurchases() {
      try {
        const songs = await marketplaceService.getUserPurchasedSongs(user!.id);
        setPurchasedSongs(songs);
      } catch (err) {
        console.error('Error loading purchases:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPurchases();
  }, [user, authLoading, router]);

  // Stop audio on unmount or page change
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const handlePlayFullAudio = (song: MarketplaceSong) => {
    if (currentSong?.id === song.id && isPlaying) {
      audioElement?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    const audioUrl = song.audio_file_path;
    if (!audioUrl || audioUrl.startsWith('blob:')) {
      alert('Audio file for this song is not currently accessible.');
      return;
    }

    const audio = new Audio(audioUrl);
    audio.onerror = () => {
      console.warn('Audio playback error on purchases page');
      setIsPlaying(false);
      setCurrentSong(null);
    };

    audio.onended = () => setIsPlaying(false);
    audio.play().catch(e => {
      console.warn('Could not play purchased audio:', e);
      setIsPlaying(false);
    });

    setAudioElement(audio);
    setCurrentSong(song);
    setIsPlaying(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 dark:from-blue-950 dark:via-[#0c1938] dark:to-purple-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-2 border border-blue-500/20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Permanent Library
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">My Purchased Music Library</h1>
        <p className="text-xs sm:text-sm text-blue-100 font-medium">
          Stream full audio tracks, access complete lyrics, and directly download high-fidelity MP3s anytime.
        </p>
      </div>

      {purchasedSongs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No purchased music yet</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            Explore the Voxify Music Marketplace to purchase original Gospel &amp; Choral tracks from top Rwandan &amp; African creators.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" /> Explore Marketplace Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {purchasedSongs.filter(s => s && s.id).map(song => {
            const isCurrentlyPlaying = currentSong?.id === song.id && isPlaying;
            const songTitle = song.title || 'Purchased Song';
            const artistName = song.artist?.stage_name || 'Independent Creator';
            const genreName = song.genre?.name || song.music_type || 'Gospel';

            const coverArt = song.cover_image_url || generateSongCover({
              title: songTitle,
              artistName: artistName,
              genre: genreName,
            });

            return (
              <div
                key={song.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 relative border border-slate-200 dark:border-slate-800 shadow-sm">
                    <img
                      src={coverArt}
                      alt={songTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to generated cover if remote image fails
                        (e.target as HTMLImageElement).src = generateSongCover({
                          title: songTitle,
                          artistName: artistName,
                          genre: genreName,
                        });
                      }}
                    />

                    <button
                      onClick={() => handlePlayFullAudio(song)}
                      className="absolute inset-0 bg-black/40 hover:bg-black/50 flex items-center justify-center group transition-colors"
                      aria-label={isCurrentlyPlaying ? 'Pause song' : 'Play song'}
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        {isCurrentlyPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                      </div>
                    </button>
                  </div>

                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Purchased
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{genreName}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">{songTitle}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">{artistName}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedLyricsSong(song)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> View Lyrics
                  </button>

                  <a
                    href={`/api/marketplace/download/${song.id}`}
                    download
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Audio
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lyrics Viewing Modal */}
      {selectedLyricsSong && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedLyricsSong.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">By {selectedLyricsSong.artist?.stage_name || 'Independent Creator'}</p>
              </div>
              <button
                onClick={() => setSelectedLyricsSong(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-1 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              {selectedLyricsSong.lyrics || 'No lyrics provided for this track.'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
