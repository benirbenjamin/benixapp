import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Megaphone,
  ExternalLink,
  Play,
  Tv,
  Radio,
  Film,
  Eye,
  CheckCircle2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { SubmitAdModal } from '../modals/SubmitAdModal';
import { WalletModal } from '../modals/WalletModal';
import { GoogleAdSense } from './GoogleAdSense';

interface RecommendationItem {
  id: string;
  name?: string;
  title?: string;
  frequency?: string;
  category?: string;
  location?: string;
  logo_url?: string;
  logoUrl?: string;
  thumbnail?: string;
  creator?: string;
  channelName?: string;
  duration?: string;
  views?: number;
  price?: number;
}

interface CustomAd {
  id: string;
  userName: string;
  title: string;
  description: string;
  targetUrl: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  currentImpressions: number;
  currentClicks: number;
}

interface Props {
  items: RecommendationItem[];
  type: 'tv' | 'radio' | 'video';
  activeItemId?: string;
  onSelectItem: (item: any) => void;
  className?: string;
}

export const SidebarRecommendationsMixedAds: React.FC<Props> = ({
  items,
  type,
  activeItemId,
  onSelectItem,
  className = ''
}) => {
  const [ads, setAds] = useState<CustomAd[]>([]);
  const [isSubmitAdOpen, setIsSubmitAdOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  useEffect(() => {
    async function fetchAds() {
      try {
        const res = await fetch('/api/ads/active');
        if (res.ok) {
          const data = await res.json();
          if (data.ads && Array.isArray(data.ads)) {
            setAds(data.ads);
            // Track impressions non-blockingly
            data.ads.forEach((ad: CustomAd) => {
              fetch('/api/ads/track-impression', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adId: ad.id })
              }).catch(() => {});
            });
          }
        }
      } catch (e) {
        console.warn('Failed to load active custom ads:', e);
      }
    }
    fetchAds();
  }, []);

  const handleAdClick = (ad: CustomAd) => {
    fetch('/api/ads/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id })
    }).catch(() => {});

    window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`space-y-4 select-none ${className}`}>
      
      {/* "Advertise With Us" Callout Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#141C2E] to-slate-900 border border-amber-500/30 shadow-lg text-white space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Megaphone className="w-3.5 h-3.5" />
            Advertise With Us
          </span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
            From 500 RWF
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-snug">
          Promote your brand, WhatsApp, or shop mixed directly with Google ads to thousands of daily Rwandan viewers.
        </p>

        <button
          onClick={() => setIsSubmitAdOpen(true)}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Your Ad Here</span>
        </button>
      </div>

      {/* Recommendations List Interspersed with Custom Ads & Google AdSense */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
          {type === 'video' ? (
            <Film className="w-3.5 h-3.5 text-purple-400" />
          ) : type === 'tv' ? (
            <Tv className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Radio className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span>
            {type === 'video'
              ? 'Up Next & Recommended Videos'
              : type === 'tv'
              ? 'Up Next & Live Channels'
              : 'Trending Radio Stations'}
          </span>
        </h4>

        {items.slice(0, 15).map((item, index) => {
          const isActive = activeItemId === item.id;
          const matchingAd = ads[index % ads.length];
          const shouldShowAd = (index === 1 || index === 4 || index === 7) && ads.length > 0;

          return (
            <React.Fragment key={item.id}>
              {/* Media Card Item: Rich YouTube-Style Video Preview when type === 'video' */}
              {type === 'video' ? (
                <div
                  onClick={() => onSelectItem(item)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex gap-3 group ${
                    isActive
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-md ring-1 ring-purple-500/30'
                      : 'bg-[#121824] hover:bg-[#182132] border-slate-800/80 hover:border-purple-500/40'
                  }`}
                >
                  {/* 16:9 Video Thumbnail Preview */}
                  <div className="relative w-36 sm:w-40 aspect-video rounded-xl bg-slate-900 border border-slate-800 shrink-0 overflow-hidden group-hover:border-purple-500/40 transition-all shadow-sm">
                    <img
                      src={item.thumbnail || item.logo_url || `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;
                      }}
                    />
                    {/* Duration badge */}
                    {item.duration && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-mono font-bold text-white shadow">
                        {item.duration}
                      </span>
                    )}
                    {/* Play hover overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                    {/* Price badge if paid */}
                    {Number(item.price) > 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-amber-500 text-black text-[9px] font-black uppercase shadow">
                        {Number(item.price).toLocaleString()} RWF
                      </span>
                    )}
                  </div>

                  {/* Video Info Preview */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <h5 className="font-bold text-xs text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">
                        {item.title || item.name}
                      </h5>
                      <p className="text-[11px] text-slate-400 truncate mt-1 flex items-center gap-1">
                        <span>{item.channelName || item.creator || 'Benix Creator'}</span>
                        <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>{typeof item.views === 'number' && item.views > 0 ? (item.views >= 1000 ? `${(item.views / 1000).toFixed(1)}K` : item.views) : '0'} views</span>
                      <span>•</span>
                      <span className="truncate">{item.category || 'General'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Compact Station Card for TV / Radio */
                <div
                  onClick={() => onSelectItem(item)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group ${
                    isActive
                      ? 'bg-blue-600/15 border-blue-500/50 shadow-md'
                      : 'bg-[#121824] hover:bg-[#182132] border-slate-800'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src={item.logo_url || item.logoUrl || item.thumbnail || '/logo.png'}
                      alt={item.name || item.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-current animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-white truncate group-hover:text-blue-400 transition-colors">
                      {item.name || item.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.frequency || item.location || item.category || 'Live Broadcast'}
                    </p>
                  </div>

                  <div className="shrink-0 text-slate-500 group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Seamless Mixed Custom Sponsored Ad Slot */}
              {shouldShowAd && matchingAd && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-[#121824] border border-indigo-500/30 text-white shadow-md space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3 text-amber-400" /> Sponsored
                    </span>
                    <span className="text-slate-400">{matchingAd.userName}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <img
                      src={matchingAd.mediaUrl}
                      alt={matchingAd.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h5 className="font-black text-xs text-white line-clamp-1">{matchingAd.title}</h5>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">{matchingAd.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdClick(matchingAd)}
                    className="w-full py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <span>Visit Sponsor</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Google AdSense Rectangle slot after item 3 */}
              {index === 2 && (
                <div className="p-2.5 rounded-2xl bg-black/40 border border-slate-800 text-center space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Sponsored Advertisement</span>
                  <GoogleAdSense slot="8392017482" format="rectangle" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Global Self-Serve Ad Modal */}
      {isSubmitAdOpen && (
        <SubmitAdModal
          isOpen={isSubmitAdOpen}
          onClose={() => setIsSubmitAdOpen(false)}
          onOpenWallet={() => {
            setIsSubmitAdOpen(false);
            setIsWalletOpen(true);
          }}
          onSuccess={() => {
            // refresh
          }}
        />
      )}

      {/* Wallet Modal */}
      {isWalletOpen && (
        <WalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
        />
      )}

    </div>
  );
};
