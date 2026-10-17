'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { MarketplaceSong, SongComment } from '@/lib/types/database.types';
import {
  Music,
  Play,
  Pause,
  Heart,
  ShoppingBag,
  Download,
  Lock,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Globe,
  Share2,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
} from 'lucide-react';
import { SongShareButtons } from '@/components/marketplace/SongShareButtons';
import { GoogleAdSenseBanner } from '@/components/ads/GoogleAdSenseBanner';


export default function SongDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, artistProfile } = useAuth();
  const songId = params?.id as string;

  const [song, setSong] = useState<MarketplaceSong | null>(null);
  const [comments, setComments] = useState<SongComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Audio Preview State
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Comment input
  const [authorName, setAuthorName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Purchasing & Payment Return Status
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'cancel' | 'error' | 'success'; message: string } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Clean up audio playback when leaving page or unmounting
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  // Handle payment redirect flags
  useEffect(() => {
    const payment = searchParams.get('payment');
    const err = searchParams.get('error');
    if (payment === 'cancelled' || payment === 'cancel') {
      setPaymentNotice({
        type: 'cancel',
        message: 'Payment checkout was cancelled. No money was charged to your account.',
      });
    } else if (payment === 'failed') {
      setPaymentNotice({
        type: 'error',
        message: err || 'Payment transaction failed or was declined. Please try again.',
      });
    } else if (searchParams.get('success') === 'true') {
      setPaymentNotice({
        type: 'success',
        message: 'Congratulations! Your purchase was verified and completed successfully.',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadSongDetails() {
      setLoading(true);
      try {
        const [songData, commentsData] = await Promise.all([
          marketplaceService.getMarketplaceSongById(songId, user?.id),
          marketplaceService.getSongComments(songId),
        ]);
        setSong(songData);
        setComments(commentsData);
      } catch (err) {
        console.error('Error loading song details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSongDetails();
  }, [songId, user]);

  const handlePlayPreview = () => {
    if (!song) return;
    setPreviewError(null);

    if (isPlayingPreview && audioElement) {
      audioElement.pause();
      setIsPlayingPreview(false);
      return;
    }

    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    const audioUrl = song.preview_audio_path || song.audio_file_path;
    if (!audioUrl || audioUrl.startsWith('blob:')) {
      setPreviewError('Audio preview stream is not yet available for this track.');
      return;
    }

    const audio = new Audio(audioUrl);
    audio.currentTime = song.preview_start_time || 0;

    const previewEnd = song.preview_end_time || (song.preview_start_time + 30);
    audio.ontimeupdate = () => {
      if (!song.is_purchased && audio.currentTime >= previewEnd) {
        audio.pause();
        setIsPlayingPreview(false);
      }
    };

    audio.onerror = (e) => {
      console.warn('Audio preview failed to load', e);
      setIsPlayingPreview(false);
      const errCode = audio.error?.code;
      let msg = 'Failed to load audio preview stream.';
      if (errCode === 4) {
        msg = 'Audio format not supported by browser.';
      } else if (errCode === 2) {
        msg = 'Network connection error while streaming audio.';
      }
      setPreviewError(msg);
    };

    audio.onended = () => setIsPlayingPreview(false);

    audio.play().catch(e => {
      console.warn('Could not start audio playback:', e);
      setIsPlayingPreview(false);
      setPreviewError('Browser autoplay was blocked. Please tap the play button again.');
    });

    setAudioElement(audio);
    setIsPlayingPreview(true);
  };

  const handleBuy = async () => {
    if (!user) {
      router.push(`/login?redirect=/songs/marketplace/${songId}`);
      return;
    }

    if ((song?.purchases_count || 0) > 0 && !song?.is_purchased) {
      setPurchaseError('This exclusive song has already been purchased by another buyer.');
      return;
    }

    // Stop preview before checkout redirect
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      setIsPlayingPreview(false);
    }

    setPurchasing(true);
    setPurchaseError(null);
    setPaymentNotice(null);

    try {
      const res = await fetch('/api/payments/marketplace/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: song!.id,
          amount: song!.price,
          currency: song!.currency || 'RWF',
        }),
      });

      const data = await res.json();
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setPurchaseError(data.error || 'Failed to initialize payment.');
        setPurchasing(false);
      }
    } catch (err: any) {
      setPurchaseError(err.message || 'Payment server error.');
      setPurchasing(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      const newComment = await marketplaceService.addSongComment(
        songId,
        authorName.trim() || 'Music Listener',
        commentContent.trim(),
        user?.id
      );
      setComments([newComment, ...comments]);
      setCommentContent('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-[#000000]">Song not found</h2>
        <Link href="/marketplace" className="text-purple-600 font-bold hover:underline">
          &larr; Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Banner Card */}
      <div className="bg-white border border-[#E6F2FC] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row gap-8 items-center md:items-start">
        
        {/* Cover Art */}
        <div className="w-64 h-64 rounded-2xl bg-slate-900 overflow-hidden shrink-0 relative border border-[#E6F2FC] shadow-lg">
          {song.cover_image_url ? (
            <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900 to-slate-900 flex items-center justify-center text-amber-400 font-bold">
              <Music className="w-16 h-16" />
            </div>
          )}

          {/* Floating Play Button */}
          <button
            onClick={handlePlayPreview}
            className="absolute inset-0 bg-black/30 flex items-center justify-center group"
          >
            <div className="w-16 h-16 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              {isPlayingPreview ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </div>
          </button>
        </div>

        {/* Info & Actions */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 rounded-full bg-[#DFF1FF] text-purple-700 font-extrabold text-xs uppercase tracking-wider border border-[#B9E2FF]">
              {song.genre?.name || song.music_type}
            </span>
            {song.genre?.is_local && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-300">
                Rwandan Local Genre
              </span>
            )}
            {song.is_purchased && (
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Purchased
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#000000]">{song.title}</h1>
          
          <div className="text-sm font-semibold text-[#475569]">
            By <span className="text-[#000000] font-extrabold">{song.artist?.stage_name || 'Independent Creator'}</span>
          </div>

          {song.description && (
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-xl">
              {song.description}
            </p>
          )}

          {paymentNotice && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 font-semibold ${
              paymentNotice.type === 'cancel'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{paymentNotice.message}</span>
            </div>
          )}

          {purchaseError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{purchaseError}</span>
            </div>
          )}

          {previewError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{previewError}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewError(null)}
                className="text-rose-400 hover:text-rose-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action CTAs */}
          {(() => {
            const isOwner = Boolean(
              user &&
              song &&
              (song.artist?.user_id === user.id ||
               (artistProfile && song.artist_id === artistProfile.id) ||
               user?.is_super_admin)
            );

            return (
              <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-4">
                {isOwner && (
                  <Link
                    href={`/artist/songs/${song.id}/edit`}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 text-sm cursor-pointer active:scale-95"
                  >
                    <Pencil className="w-4 h-4 text-slate-950" />
                    <span>Edit Song Details</span>
                  </Link>
                )}

                {song.is_purchased ? (
                  <a
                    href={`/api/marketplace/download/${song.id}`}
                    download
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg transition-all flex items-center gap-2 text-sm"
                  >
                    <Download className="w-5 h-5" /> Download Full Audio Track
                  </a>
                ) : (song.purchases_count || 0) > 0 ? (
                  <div className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-extrabold px-6 py-3.5 rounded-2xl flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span>Exclusive Track — Sold &amp; Owned by Buyer</span>
                  </div>
                ) : !isOwner ? (
                  <button
                    onClick={handleBuy}
                    disabled={purchasing}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2 text-sm"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>{purchasing ? 'Redirecting to Checkout...' : `Buy Full Song — ${song.price.toLocaleString()} RWF`}</span>
                  </button>
                ) : null}

                <button
                  onClick={handlePlayPreview}
                  className="bg-[#F5FAFF] hover:bg-[#DFF1FF] text-[#000000] font-bold px-5 py-3.5 rounded-2xl border border-[#E6F2FC] transition-all flex items-center gap-2 text-sm"
                >
                  {isPlayingPreview ? <Pause className="w-4 h-4 text-purple-600" /> : <Play className="w-4 h-4 text-purple-600" />}
                  <span>{isPlayingPreview ? 'Pause Preview' : `Listen Preview (${song.preview_start_time}s - ${song.preview_end_time}s)`}</span>
                </button>
              </div>
            );
          })()}

          {/* Share Song Action (WhatsApp & Native Share Sheet) */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Share Song:</span>
            <SongShareButtons song={song} variant="full" />
          </div>
        </div>

      </div>

      {/* Google AdSense Slot: Song Detail Page */}
      <GoogleAdSenseBanner slot="7034214536" className="my-2" />

      {/* Full Lyrics Section (Gated) */}
      <div className="bg-white border border-[#E6F2FC] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#000000] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" /> Official Song Lyrics
        </h2>

        {song.is_purchased ? (
          <div className="whitespace-pre-wrap font-sans text-sm text-[#000000] leading-relaxed bg-[#F5FAFF] p-6 rounded-2xl border border-[#E6F2FC]">
            {song.lyrics || 'No lyrics uploaded by artist.'}
          </div>
        ) : (
          <div className="relative rounded-2xl border border-[#E6F2FC] p-6 bg-[#F5FAFF] overflow-hidden space-y-4">
            <div className="blur-xs select-none opacity-40 whitespace-pre-wrap font-sans text-xs text-[#000000]">
              {song.lyrics
                ? song.lyrics.substring(0, 150) + '\n\n[Full lyrics locked until song purchase...]'
                : 'Preview lyrics line 1...\nPreview lyrics line 2...'}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 border border-purple-200 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#000000]">Full Lyrics &amp; Audio Stream Locked</h3>
              <p className="text-xs text-[#475569] max-w-sm">
                Purchase this song for {song.price.toLocaleString()} RWF to instantly unlock complete lyrics and high-quality audio downloads.
              </p>
              <button
                onClick={handleBuy}
                className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all"
              >
                Unlock Full Track ({song.price.toLocaleString()} RWF)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Listener Comments Section */}
      <div className="bg-white border border-[#E6F2FC] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#000000] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" /> Listener Reviews &amp; Comments ({comments.length})
        </h2>

        {/* Comment Post Form */}
        <form onSubmit={handlePostComment} className="space-y-3 bg-[#F5FAFF] p-4 rounded-2xl border border-[#E6F2FC]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Your Name (e.g. Marie Grace)"
              className="bg-white border border-[#E6F2FC] rounded-xl px-4 py-2 text-xs font-semibold text-[#000000]"
            />
          </div>

          <textarea
            rows={3}
            required
            value={commentContent}
            onChange={e => setCommentContent(e.target.value)}
            placeholder="Share your thoughts about this track..."
            className="w-full bg-white border border-[#E6F2FC] rounded-xl px-4 py-2.5 text-xs text-[#000000] focus:outline-none resize-none font-semibold"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingComment}
              className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all"
            >
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="p-4 rounded-2xl bg-[#FCFEFF] border border-[#E6F2FC] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#000000]">{c.author_name}</span>
                <span className="text-[10px] text-[#A8B5C2]">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-[#475569]">{c.content}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
