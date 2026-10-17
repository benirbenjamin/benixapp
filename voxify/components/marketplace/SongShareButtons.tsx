'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

interface SongShareButtonsProps {
  song: {
    id: string;
    title: string;
    price?: number;
    artist?: { stage_name?: string } | null;
    genre?: { name?: string } | null;
    music_type?: string;
  };
  variant?: 'compact' | 'full';
  className?: string;
}

export function SongShareButtons({ song, variant = 'compact', className = '' }: SongShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getSongUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/songs/marketplace/${song.id}`;
    }
    return `https://voxify.space/songs/marketplace/${song.id}`;
  };

  const getShareText = () => {
    const artistName = song.artist?.stage_name || 'Independent Creator';
    const genreName = song.genre?.name || song.music_type || 'Gospel Music';
    const priceText = song.price ? ` (${song.price.toLocaleString()} RWF)` : '';
    const url = getSongUrl();

    return `🎶 Listen to "${song.title}" by ${artistName}${priceText} on Voxify Space!\nGenre: ${genreName}\n\nStream preview & get the full song here:\n${url}`;
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = getShareText();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getSongUrl();
    const artistName = song.artist?.stage_name || 'Independent Creator';

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${song.title} — Voxify Space`,
          text: `🎶 Listen to "${song.title}" by ${artistName} on Voxify Space!`,
          url: url,
        });
        return;
      } catch (err: any) {
        // User aborted share sheet or unsupported platform
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copy link to clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Ignore clipboard failure
    }
  };

  if (variant === 'full') {
    return (
      <div className={`flex flex-wrap items-center gap-2 relative ${className}`}>
        {/* WhatsApp Share Button */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Share song on WhatsApp"
        >
          <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
          <span>Share on WhatsApp</span>
        </button>

        {/* Native / System App Share Button */}
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-extrabold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Share using installed apps (Telegram, Twitter, Facebook, Copy link)"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
              <span className="text-emerald-700">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
              <span>Share via Apps</span>
            </>
          )}
        </button>

        {/* Copy Feedback Toast */}
        {copied && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2 z-30 flex items-center gap-1.5 whitespace-nowrap">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Song link copied to clipboard!</span>
          </div>
        )}
      </div>
    );
  }

  // Compact variant for cards
  return (
    <div className={`flex items-center gap-1 relative ${className}`}>
      {/* WhatsApp Icon Button */}
      <button
        type="button"
        onClick={handleWhatsAppShare}
        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
        title="Share on WhatsApp"
        aria-label="Share song on WhatsApp"
      >
        <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
      </button>

      {/* Native App Share / Copy Button */}
      <button
        type="button"
        onClick={handleNativeShare}
        className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 ${
          copied
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300'
        }`}
        title={copied ? 'Link copied!' : 'Share song (choose app or copy link)'}
        aria-label="Share song using installed apps"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5 text-slate-700" />}
      </button>

      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-md z-30 whitespace-nowrap">
          Copied!
        </span>
      )}
    </div>
  );
}
