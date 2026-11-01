import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Tv,
  CheckCircle2,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Flame,
  Radio,
  Clock,
  DollarSign
} from 'lucide-react';
import { AdSenseUnit } from '../common/AdSenseUnit';

export interface ShortFeedItem {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl: string;
  title: string;
  mediaType: 'video' | 'image';
  duration: number;
  views: number;
  likes: number;
  source: 'story' | 'video';
  createdAt?: string;
  isMonetized?: boolean;
  trendingScore?: number;
}

interface CustomAdItem {
  id: string;
  title: string;
  description: string;
  targetUrl: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  ctaText?: string;
}

export const ShortsFeed: React.FC = () => {
  const [shorts, setShorts] = useState<ShortFeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customAds, setCustomAds] = useState<CustomAdItem[]>([]);

  // Vertical TikTok Player State
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const [photoProgress, setPhotoProgress] = useState<number>(0);
  const [isVerticalModalOpen, setIsVerticalModalOpen] = useState<boolean>(false);

  // Likes & Social State
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [likedStatus, setLikedStatus] = useState<Record<string, boolean>>({});

  // 6-Second Non-Skippable Interstitial Ad Sequencer State
  const [scrolledVideosCount, setScrolledVideosCount] = useState<number>(0);
  const [nextInterstitialThreshold, setNextInterstitialThreshold] = useState<number>(() => Math.floor(Math.random() * 6) + 5); // 5 to 10
  const [interstitialAdIndex, setInterstitialAdIndex] = useState<number>(0); // 0,1,2 = Google; 3 = Custom; 4,5,6 = Google; 7 = Custom
  const [showInterstitialAd, setShowInterstitialAd] = useState<boolean>(false);
  const [interstitialCountdown, setInterstitialCountdown] = useState<number>(6);
  const [currentInterstitialType, setCurrentInterstitialType] = useState<'google' | 'custom'>('google');
  const [activeInterstitialCustomAd, setActiveInterstitialCustomAd] = useState<CustomAdItem | null>(null);

  // Bottom Banner Ad alternation
  const [activeBottomAdType, setActiveBottomAdType] = useState<'google' | 'custom'>('custom');

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const recordedViewsRef = useRef<Set<string>>(new Set());

  // 1. Fetch algorithmically ranked shorts and active custom ads
  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const [feedRes, adsRes] = await Promise.all([
        fetch('/api/shorts/feed').then((r) => r.json()).catch(() => ({ shorts: [] })),
        fetch('/api/ads/active').then((r) => r.json()).catch(() => ({ ads: [] }))
      ]);

      if (feedRes?.shorts && Array.isArray(feedRes.shorts) && feedRes.shorts.length > 0) {
        setShorts(feedRes.shorts);
        const lMap: Record<string, number> = {};
        feedRes.shorts.forEach((s: ShortFeedItem) => {
          lMap[s.id] = s.likes || 0;
        });
        setLikesMap(lMap);
      }

      if (adsRes?.ads && Array.isArray(adsRes.ads) && adsRes.ads.length > 0) {
        setCustomAds(adsRes.ads);
      }
    } catch (err) {
      console.error('Error loading shorts feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Current active short item
  const currentShort: ShortFeedItem | undefined = shorts[activeIndex];

  // Helper to trigger creator monetization credit & view tracking
  const trackViewAndMonetization = useCallback((short: ShortFeedItem) => {
    if (!short || recordedViewsRef.current.has(short.id)) return;
    recordedViewsRef.current.add(short.id);

    // Increment view count on server
    fetch(`/api/shorts/${short.id}/view`, { method: 'POST' }).catch(() => {});

    // Silent Wallet Credit if author is monetized
    fetch('/api/ads/record-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shortId: short.id,
        creatorId: short.authorId,
        type: 'view',
        adType: activeBottomAdType,
        source: short.source
      })
    }).catch(() => {});

    // If custom ad banner is shown, track impression on the custom ad
    if (activeBottomAdType === 'custom' && customAds.length > 0) {
      const ad = customAds[activeIndex % customAds.length];
      if (ad) {
        fetch('/api/ads/track-impression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adId: ad.id })
        }).catch(() => {});
      }
    }
  }, [activeBottomAdType, customAds, activeIndex]);

  // 2. Manage Active Video Playback and Photo Progress
  useEffect(() => {
    if (!currentShort) return;

    trackViewAndMonetization(currentShort);

    // Pause all other videos, play current video
    Object.keys(videoRefs.current).forEach((key) => {
      const v = videoRefs.current[key];
      if (v) {
        if (key === currentShort.id && !showInterstitialAd) {
          v.currentTime = 0;
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      }
    });

    // Alternate bottom ad between Custom and Google AdSense
    if (customAds.length > 0) {
      setActiveBottomAdType(activeIndex % 2 === 0 ? 'custom' : 'google');
    } else {
      setActiveBottomAdType('google');
    }
  }, [activeIndex, currentShort, showInterstitialAd, trackViewAndMonetization, customAds]);

  // Scroll to index handler
  const scrollToIndex = useCallback((index: number) => {
    if (index < 0 || index >= shorts.length) return;
    setActiveIndex(index);
    setPhotoProgress(0);

    // Increment scrolled count for 6-second interstitial ad scheduler
    setScrolledVideosCount((prev) => {
      const nextCount = prev + 1;
      if (nextCount >= nextInterstitialThreshold) {
        // Trigger 6-second non-skippable ad!
        // Rotation: index 0,1,2 = Google, index 3 = Custom (every 4th is Custom)
        const isCustom = interstitialAdIndex % 4 === 3;
        setCurrentInterstitialType(isCustom && customAds.length > 0 ? 'custom' : 'google');
        if (isCustom && customAds.length > 0) {
          setActiveInterstitialCustomAd(customAds[Math.floor(Math.random() * customAds.length)]);
        }
        setShowInterstitialAd(true);
        setInterstitialCountdown(6);
        setNextInterstitialThreshold(Math.floor(Math.random() * 6) + 5); // New random interval: 5 to 10
        setInterstitialAdIndex((i) => i + 1);
        return 0;
      }
      return nextCount;
    });

    const el = document.getElementById(`short-slide-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [shorts.length, nextInterstitialThreshold, interstitialAdIndex, customAds]);

  // 3. Photo Story Auto-Advance Timer (6 seconds)
  useEffect(() => {
    if (!currentShort || currentShort.mediaType === 'video' || showInterstitialAd) return;

    setPhotoProgress(0);
    const interval = setInterval(() => {
      setPhotoProgress((prev) => {
        if (prev >= 100) {
          if (isAutoScroll && activeIndex < shorts.length - 1) {
            scrollToIndex(activeIndex + 1);
          }
          return 0;
        }
        return prev + 1.67; // 100% over 6 seconds
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeIndex, currentShort, isAutoScroll, shorts.length, scrollToIndex, showInterstitialAd]);

  // 4. Interstitial Ad 6-second non-skippable countdown
  useEffect(() => {
    if (!showInterstitialAd) return;

    // Track reward for current video owner when interstitial ad is served
    if (currentShort) {
      fetch('/api/ads/record-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortId: currentShort.id,
          creatorId: currentShort.authorId,
          type: 'view',
          adType: currentInterstitialType
        })
      }).catch(() => {});
    }

    if (currentInterstitialType === 'custom' && activeInterstitialCustomAd) {
      fetch('/api/ads/track-impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: activeInterstitialCustomAd.id })
      }).catch(() => {});
    }

    const timer = setInterval(() => {
      setInterstitialCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowInterstitialAd(false);
          // Resume video playback
          if (currentShort && videoRefs.current[currentShort.id]) {
            videoRefs.current[currentShort.id]?.play().catch(() => {});
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInterstitialAd, currentShort, currentInterstitialType, activeInterstitialCustomAd]);

  // Like Toggle
  const handleLike = async (e: React.MouseEvent, shortId: string) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedStatus[shortId];
    setLikedStatus({ ...likedStatus, [shortId]: !isCurrentlyLiked });
    setLikesMap({
      ...likesMap,
      [shortId]: (likesMap[shortId] || 0) + (isCurrentlyLiked ? -1 : 1)
    });

    try {
      await fetch(`/api/shorts/${shortId}/like`, { method: 'POST' });
    } catch {}
  };

  // Video Completed -> Auto-scroll to next
  const handleVideoEnded = () => {
    if (isAutoScroll && activeIndex < shorts.length - 1) {
      scrollToIndex(activeIndex + 1);
    }
  };

  // Bottom ad click handler
  const handleBottomAdClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentShort) return;

    if (activeBottomAdType === 'custom' && customAds.length > 0) {
      const ad = customAds[activeIndex % customAds.length];
      if (ad) {
        fetch('/api/ads/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adId: ad.id })
        }).catch(() => {});

        fetch('/api/ads/record-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shortId: currentShort.id,
            creatorId: currentShort.authorId,
            type: 'click',
            adType: 'custom'
          })
        }).catch(() => {});

        window.open(ad.targetUrl || 'https://benix.space', '_blank');
      }
    } else {
      fetch('/api/ads/record-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortId: currentShort.id,
          creatorId: currentShort.authorId,
          type: 'click',
          adType: 'google'
        })
      }).catch(() => {});
    }
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showInterstitialAd) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        scrollToIndex(Math.min(shorts.length - 1, activeIndex + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        scrollToIndex(Math.max(0, activeIndex - 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
        if (currentShort && videoRefs.current[currentShort.id]) {
          const v = videoRefs.current[currentShort.id];
          if (v) {
            if (v.paused) v.play().catch(() => {});
            else v.pause();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, shorts.length, scrollToIndex, currentShort, showInterstitialAd]);

  return (
    <div className="space-y-4">
      {/* Feed Section Header with Launch Player & Auto-Scroll status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-4 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-tight">
                Trending TikTok Shorts & Stories Feed
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-500/30">
                Algorithm Ranked
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Curated vertical portrait reels, active & archived stories, with auto-scroll & creator monetization
            </p>
          </div>
        </div>

        {/* Controls: Auto-Scroll Toggle & Full Player Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAutoScroll((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              isAutoScroll
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="When active, videos auto-scroll to next reel upon finishing"
          >
            <span className={`w-2 h-2 rounded-full ${isAutoScroll ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            Auto-Scroll: {isAutoScroll ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setIsVerticalModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-rose-600/25 flex items-center gap-1.5 transition transform active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Watch as TikTok
          </button>
        </div>
      </div>

      {/* Main TikTok-Style Vertical Shorts Player */}
      <div className="relative w-full max-w-md mx-auto h-[640px] sm:h-[720px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none flex flex-col">
        {/* Scroll Container */}
        <div
          ref={containerRef}
          className="relative w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
        >
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <Sparkles className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-sm font-bold">Curating Trending Shorts & Stories...</p>
            </div>
          ) : shorts.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <Tv className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-sm font-bold text-white">No Shorts Available Yet</p>
              <p className="text-xs text-slate-500 mt-1">Post a story or vertical video to appear here!</p>
            </div>
          ) : (
            shorts.map((item, idx) => {
              const isCurrent = idx === activeIndex;
              const isLiked = !!likedStatus[item.id];
              const likesCount = likesMap[item.id] ?? item.likes;

              return (
                <div
                  key={item.id}
                  id={`short-slide-${idx}`}
                  className="w-full h-full snap-start relative flex items-center justify-center bg-black overflow-hidden"
                >
                  {/* Photo Story Progress Bar */}
                  {isCurrent && item.mediaType === 'image' && (
                    <div className="absolute top-2 left-3 right-3 z-30 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 transition-all duration-100 ease-linear"
                        style={{ width: `${photoProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Media (Video or Image) */}
                  {item.mediaType === 'video' ? (
                    <video
                      ref={(el) => { videoRefs.current[item.id] = el; }}
                      src={item.mediaUrl}
                      className="w-full h-full object-cover"
                      playsInline
                      muted={isMuted}
                      loop={!isAutoScroll}
                      onEnded={handleVideoEnded}
                      onClick={() => {
                        const v = videoRefs.current[item.id];
                        if (v) {
                          if (v.paused) {
                            v.play().catch(() => {});
                            setIsPlaying(true);
                          } else {
                            v.pause();
                            setIsPlaying(false);
                          }
                        }
                      }}
                    />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onClick={() => {
                        if (isAutoScroll && activeIndex < shorts.length - 1) {
                          scrollToIndex(activeIndex + 1);
                        }
                      }}
                    />
                  )}

                  {/* Pause Indicator overlay */}
                  {!isPlaying && item.mediaType === 'video' && isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
                      <div className="p-4 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                        <Play className="w-10 h-10 fill-white ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Top Bar Indicators */}
                  <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-rose-400">
                        {item.source === 'story' ? 'Story Moment' : 'Short Reel'}
                      </span>
                      {item.isMonetized && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30 flex items-center gap-0.5">
                          <DollarSign className="w-2.5 h-2.5" />
                          Monetized
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white pointer-events-auto hover:bg-black/80 transition"
                      title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </div>

                  {/* Right Action Sidebar (TikTok Style) */}
                  <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4 text-white">
                    {/* Creator Avatar */}
                    <div className="relative group">
                      <img
                        src={item.authorAvatar}
                        alt={item.authorName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-rose-500 shadow-xl"
                      />
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shadow">
                        +
                      </div>
                    </div>

                    {/* Like Button */}
                    <button
                      onClick={(e) => handleLike(e, item.id)}
                      className="flex flex-col items-center gap-1 focus:outline-none group"
                    >
                      <div className={`p-3 rounded-full backdrop-blur-md transition-transform group-hover:scale-110 ${
                        isLiked ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40' : 'bg-black/50 text-white hover:bg-black/70'
                      }`}>
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current animate-bounce' : ''}`} />
                      </div>
                      <span className="text-[11px] font-bold drop-shadow">
                        {likesCount.toLocaleString()}
                      </span>
                    </button>

                    {/* Views Indicator */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white">
                        <Flame className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className="text-[11px] font-bold drop-shadow">
                        {item.views.toLocaleString()}
                      </span>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                          navigator.share({
                            title: item.title,
                            url: window.location.href
                          }).catch(() => {});
                        } else {
                          navigator.clipboard?.writeText(window.location.href);
                          alert('Short link copied to clipboard!');
                        }
                      }}
                      className="flex flex-col items-center gap-1 focus:outline-none"
                    >
                      <div className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold drop-shadow">Share</span>
                    </button>
                  </div>

                  {/* Bottom Video Meta Information */}
                  <div className="absolute left-4 right-16 bottom-16 z-20 text-white pointer-events-none">
                    <div className="flex items-center gap-2 mb-1 pointer-events-auto">
                      <span className="text-xs font-black drop-shadow">
                        @{item.authorName}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                    </div>
                    <p className="text-xs font-medium line-clamp-2 drop-shadow leading-snug">
                      {item.title}
                    </p>
                  </div>

                  {/* Attached Bottom Ad Banner (Google AdSense or Custom Ad) */}
                  <div
                    onClick={handleBottomAdClick}
                    className="absolute bottom-0 left-0 right-0 z-30 bg-[#0B0F19]/95 border-t border-slate-800 p-2.5 flex items-center justify-between gap-2.5 backdrop-blur-md cursor-pointer transition hover:bg-slate-900"
                  >
                    {activeBottomAdType === 'custom' && customAds.length > 0 ? (
                      (() => {
                        const ad = customAds[idx % customAds.length];
                        return (
                          <>
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={ad.mediaUrl || '/logo.png'}
                                alt={ad.title}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded">
                                    Sponsored
                                  </span>
                                  <span className="text-xs font-bold text-white truncate">{ad.title}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">{ad.description || 'Promoted product on Benix.Space'}</p>
                              </div>
                            </div>
                            <button
                              onClick={handleBottomAdClick}
                              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black shrink-0 shadow flex items-center gap-1"
                            >
                              <span>{ad.ctaText || 'Learn More'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </>
                        );
                      })()
                    ) : (
                      <div className="w-full flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.2 bg-blue-500 text-white rounded">
                            Google Ad
                          </span>
                          <span className="text-[11px] font-bold text-white truncate">
                            Support @{item.authorName} • Monetized Partner
                          </span>
                        </div>
                        <AdSenseUnit slot="7034214536" className="my-0 min-h-[30px] hidden" />
                        <button
                          onClick={handleBottomAdClick}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black shrink-0 shadow"
                        >
                          Visit Sponsor
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Up / Down Navigation Controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-30 border border-white/10 transition"
            title="Previous Short"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(shorts.length - 1, activeIndex + 1))}
            disabled={activeIndex === shorts.length - 1}
            className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-30 border border-white/10 transition"
            title="Next Short"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6-SECOND NON-SKIPPABLE INTERSTITIAL AD MODAL */}
      {showInterstitialAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0F141F] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            {/* Header with Non-skippable countdown */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  {currentInterstitialType === 'google' ? 'Google AdSense' : 'Featured Custom Sponsor'}
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                Ad ends in: {interstitialCountdown}s
              </div>
            </div>

            {/* Ad Content */}
            {currentInterstitialType === 'custom' && activeInterstitialCustomAd ? (
              <div className="space-y-3">
                <div className="h-56 w-full rounded-2xl overflow-hidden bg-black border border-slate-800">
                  <img
                    src={activeInterstitialCustomAd.mediaUrl}
                    alt={activeInterstitialCustomAd.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{activeInterstitialCustomAd.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{activeInterstitialCustomAd.description}</p>
                </div>
                <a
                  href={activeInterstitialCustomAd.targetUrl || 'https://benix.space'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-extrabold text-xs block text-center shadow-lg transition hover:brightness-110"
                >
                  {activeInterstitialCustomAd.ctaText || 'Learn More Now'}
                </a>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Google Verified Ad</span>
                  <p className="text-sm font-black text-white">Supporting Benix Creators with Monetization</p>
                  <p className="text-xs text-slate-400">
                    Watching non-skippable ads helps creators earn direct revenue for their content.
                  </p>
                </div>
                <AdSenseUnit slot="7034214536" className="my-2 min-h-[90px]" />
              </div>
            )}

            <p className="text-[10px] text-slate-500">
              Shorts playback will resume automatically when countdown completes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
