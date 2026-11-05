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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Flame,
  Radio,
  Clock,
  DollarSign,
  Maximize2,
  Music,
  UserPlus,
  Check,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { AdSenseUnit } from '../common/AdSenseUnit';
import { getAuthToken } from '../../services/api';
import realVideosData from '../../config/realVideos.json';

export interface ShortFeedItem {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  title: string;
  mediaType: 'video' | 'image';
  duration: number;
  views: number;
  likes: number;
  source: 'story' | 'video';
  createdAt?: string;
  isMonetized?: boolean;
  trendingScore?: number;
  subscribersCount?: number;
  category?: string;
  isPersonalized?: boolean;
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

interface ShortsFeedProps {
  isStandalonePage?: boolean;
  initialIndex?: number;
}


function extractYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1] : null;
}

function getVisitorId(): string {
  try {
    let vid = localStorage.getItem('benix_visitor_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('benix_visitor_id', vid);
    }
    return vid;
  } catch {
    return 'v_guest';
  }
}

function getFallbackShorts(): ShortFeedItem[] {
  return [];
}

export const ShortsFeed: React.FC<ShortsFeedProps> = ({
  isStandalonePage = false,
  initialIndex = 0
}) => {
  const { user } = useAuth();
  const { setActivePipMedia } = usePlayer();

  const [shorts, setShorts] = useState<ShortFeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customAds, setCustomAds] = useState<CustomAdItem[]>([]);

  // Vertical Player State
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const [photoProgress, setPhotoProgress] = useState<number>(0);
  const [isVerticalModalOpen, setIsVerticalModalOpen] = useState<boolean>(isStandalonePage);

  // Subscribed Creators State
  const [subscribedCreators, setSubscribedCreators] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('benix_subscribed_creators') || '[]');
    } catch {
      return [];
    }
  });

  // Likes & Social State
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [likedStatus, setLikedStatus] = useState<Record<string, boolean>>({});
  const [subscribersMap, setSubscribersMap] = useState<Record<string, number>>({});

  // 6-Second Non-Skippable Interstitial Ad Sequencer State
  const [scrolledVideosCount, setScrolledVideosCount] = useState<number>(0);
  const [nextInterstitialThreshold, setNextInterstitialThreshold] = useState<number>(() => Math.floor(Math.random() * 6) + 5); // 5 to 10
  const [interstitialAdIndex, setInterstitialAdIndex] = useState<number>(0);
  const [showInterstitialAd, setShowInterstitialAd] = useState<boolean>(false);
  const [interstitialCountdown, setInterstitialCountdown] = useState<number>(6);
  const [currentInterstitialType, setCurrentInterstitialType] = useState<'google' | 'custom'>('google');
  const [activeInterstitialCustomAd, setActiveInterstitialCustomAd] = useState<CustomAdItem | null>(null);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const horizontalReelRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const recordedViewsRef = useRef<Set<string>>(new Set());

  // 1. Fetch algorithmically ranked shorts and active custom ads
  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const token = getAuthToken();
      const visitorId = getVisitorId();
      const headers: Record<string, string> = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-visitor-id': visitorId
      };

      const [feedRes, adsRes] = await Promise.all([
        fetch(`/api/shorts/feed?visitorId=${encodeURIComponent(visitorId)}`, { signal: controller.signal, headers })
          .then((r) => r.json())
          .catch(() => ({ shorts: [] })),
        fetch('/api/ads/active', { signal: controller.signal })
          .then((r) => r.json())
          .catch(() => ({ ads: [] }))
      ]);
      clearTimeout(timer);

      let loadedShorts: ShortFeedItem[] = feedRes?.shorts && Array.isArray(feedRes.shorts)
        ? feedRes.shorts.filter((s: ShortFeedItem) => {
            if (s.source === 'story') return true;
            if (s.isPortrait) return true;
            const cat = (s.category || '').toLowerCase();
            const title = (s.title || '').toLowerCase();
            return cat.includes('short') || cat.includes('tiktok') || cat.includes('reels') || cat.includes('portrait') || title.includes('#short');
          })
        : [];

      setShorts(loadedShorts);
      const lMap: Record<string, number> = {};
      const sMap: Record<string, number> = {};
      loadedShorts.forEach((s: ShortFeedItem) => {
        lMap[s.id] = s.likes || 0;
        const authorKey = s.authorId || s.authorName;
        if (s.subscribersCount !== undefined) {
          sMap[authorKey] = s.subscribersCount;
        }
      });
      setLikesMap(lMap);
      setSubscribersMap(sMap);

      if (adsRes?.ads && Array.isArray(adsRes.ads) && adsRes.ads.length > 0) {
        setCustomAds(adsRes.ads);
      }
    } catch (err) {
      console.error('Error loading shorts feed:', err);
      const fallback = getFallbackShorts();
      setShorts(fallback);
      const lMap: Record<string, number> = {};
      const sMap: Record<string, number> = {};
      fallback.forEach((s: ShortFeedItem) => {
        lMap[s.id] = s.likes || 0;
        const authorKey = s.authorId || s.authorName;
        if (s.subscribersCount !== undefined) {
          sMap[authorKey] = s.subscribersCount;
        }
      });
      setLikesMap(lMap);
      setSubscribersMap(sMap);
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

    const token = getAuthToken();
    const visitorId = getVisitorId();

    // Increment view count on server & register interaction for recommendation algorithm
    fetch(`/api/shorts/${short.id}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        visitorId,
        authorId: short.authorId,
        category: short.category || (short.source === 'story' ? 'story' : 'short'),
        title: short.title
      })
    }).catch(() => {});

    // Silent Wallet Credit if author is monetized
    fetch('/api/ads/record-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shortId: short.id,
        creatorId: short.authorId,
        type: 'view',
        adType: 'short_impression',
        source: short.source
      })
    }).catch(() => {});
  }, []);

  // 2. Manage Active Video Playback: Strict Audio/Video Isolation (Prevents Audio Overlap)
  useEffect(() => {
    if (!currentShort) return;

    trackViewAndMonetization(currentShort);

    // Pause and mute all off-screen videos immediately, play only current video
    Object.keys(videoRefs.current).forEach((key) => {
      const v = videoRefs.current[key];
      if (v) {
        if (key === currentShort.id && !showInterstitialAd && (isStandalonePage || isVerticalModalOpen)) {
          v.currentTime = 0;
          v.muted = isMuted;
          v.play().catch(() => {});
        } else {
          v.pause();
          v.currentTime = 0;
        }
      }
    });
  }, [activeIndex, currentShort, showInterstitialAd, trackViewAndMonetization, isMuted, isStandalonePage, isVerticalModalOpen]);

  // 3. Scroll to Index Handler with Interstitial Ad Sequencer (3 Google : 1 Custom)
  const triggerInterstitialCheck = useCallback(() => {
    setScrolledVideosCount((prev) => {
      const nextCount = prev + 1;
      if (nextCount >= nextInterstitialThreshold) {
        const isCustom = interstitialAdIndex % 4 === 3;
        if (isCustom && customAds.length > 0) {
          const chosen = customAds[Math.floor(Math.random() * customAds.length)];
          setCurrentInterstitialType('custom');
          setActiveInterstitialCustomAd(chosen);
          fetch('/api/ads/track-impression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adId: chosen.id })
          }).catch(() => {});
        } else {
          setCurrentInterstitialType('google');
          setActiveInterstitialCustomAd(null);
        }
        setShowInterstitialAd(true);
        setInterstitialCountdown(6);
        setNextInterstitialThreshold(Math.floor(Math.random() * 6) + 5);
        setInterstitialAdIndex((i) => i + 1);
        return 0;
      }
      return nextCount;
    });
  }, [nextInterstitialThreshold, interstitialAdIndex, customAds]);

  const scrollToIndex = useCallback((index: number) => {
    if (index < 0 || index >= shorts.length) return;

    // Immediately stop currently playing video to ensure zero audio overlap
    if (currentShort && videoRefs.current[currentShort.id]) {
      videoRefs.current[currentShort.id]?.pause();
    }

    setActiveIndex(index);
    setPhotoProgress(0);
    triggerInterstitialCheck();

    const el = document.getElementById(`short-slide-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [shorts.length, currentShort, triggerInterstitialCheck]);

  // 4. Scroll Listener / Intersection Observer for container scroll (Touch swipe / Wheel)
  const handleContainerScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = container.children;
    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childTop = child.offsetTop - containerTop;
      if (childTop >= -containerHeight / 2 && childTop < containerHeight / 2) {
        if (i !== activeIndex) {
          // Pause previous
          if (currentShort && videoRefs.current[currentShort.id]) {
            videoRefs.current[currentShort.id]?.pause();
          }
          setActiveIndex(i);
          setPhotoProgress(0);
          triggerInterstitialCheck();
        }
        break;
      }
    }
  }, [activeIndex, currentShort, triggerInterstitialCheck]);

  // 5. Photo Story Auto-Advance Timer (6 seconds)
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

  // 6. Interstitial Ad 6-second non-skippable countdown
  useEffect(() => {
    if (!showInterstitialAd) return;

    const timer = setInterval(() => {
      setInterstitialCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowInterstitialAd(false);
          return 6;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInterstitialAd]);

  // Video Ended Handler
  const handleVideoEnded = () => {
    if (isAutoScroll && activeIndex < shorts.length - 1) {
      scrollToIndex(activeIndex + 1);
    }
  };

  // Like Toggle Handler
  const handleLike = (e: React.MouseEvent, shortId: string) => {
    e.stopPropagation();
    const isCurrentlyLiked = !!likedStatus[shortId];
    setLikedStatus((prev) => ({ ...prev, [shortId]: !isCurrentlyLiked }));
    setLikesMap((prev) => ({
      ...prev,
      [shortId]: (prev[shortId] || 0) + (isCurrentlyLiked ? -1 : 1)
    }));

    const token = getAuthToken();
    const visitorId = getVisitorId();
    fetch(`/api/shorts/${shortId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        action: isCurrentlyLiked ? 'unlike' : 'like',
        visitorId,
        authorId: currentShort?.authorId,
        category: currentShort?.category
      })
    }).catch(() => {});
  };

  // Subscribe Creator Handler
  const handleToggleSubscribe = (e: React.MouseEvent, creatorTarget: string) => {
    e.stopPropagation();
    const token = getAuthToken();
    if (!token && !user) {
      alert('Please sign in to subscribe to creators and receive their newest updates.');
      return;
    }

    const isSub = subscribedCreators.includes(creatorTarget);
    const next = isSub
      ? subscribedCreators.filter((c) => c !== creatorTarget)
      : [...subscribedCreators, creatorTarget];
    setSubscribedCreators(next);
    localStorage.setItem('benix_subscribed_creators', JSON.stringify(next));

    // Optimistically update subscriber count immediately
    const curCount = subscribersMap[creatorTarget] ?? currentShort?.subscribersCount ?? 0;
    const newCount = isSub ? Math.max(0, curCount - 1) : curCount + 1;
    setSubscribersMap((prev) => ({ ...prev, [creatorTarget]: newCount }));

    // Backend sync with Authorization token
    const endpoint = isSub
      ? `/api/creators/${encodeURIComponent(creatorTarget)}/unsubscribe`
      : `/api/creators/${encodeURIComponent(creatorTarget)}/subscribe`;

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.subscribersCount === 'number') {
          setSubscribersMap((prev) => ({ ...prev, [creatorTarget]: data.subscribersCount }));
        }
      })
      .catch((err) => {
        console.warn('Subscription sync error:', err);
      });
  };

  // Native Picture-in-Picture & Draggable In-App PiP Trigger
  const handleTriggerPiP = async (short: ShortFeedItem) => {
    const video = videoRefs.current[short.id];
    if (video) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (video.requestPictureInPicture) {
          await video.requestPictureInPicture();
          return;
        }
      } catch (e) {
        console.warn('Native PiP not available, using in-app floating player:', e);
      }
    }

    // In-app movable PiP fallback
    setActivePipMedia({
      type: 'short',
      id: short.id,
      title: short.title,
      creator: short.authorName,
      videoUrl: short.mediaUrl,
      thumbnailUrl: short.authorAvatar,
      isMuted: isMuted
    });
    setIsVerticalModalOpen(false);
  };

  // Horizontal Reel Scroll Handlers
  const scrollHorizontal = (direction: 'left' | 'right') => {
    if (!horizontalReelRef.current) return;
    const distance = 300;
    horizontalReelRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  };

  // Format compact numbers e.g. 163K
  const formatNumber = (num: number = 0): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  };

  // --- RENDER 1: HORIZONTAL SHELF ON HOME PAGE ---
  if (!isStandalonePage && !isVerticalModalOpen) {
    return (
      <section className="relative w-full py-6 select-none">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-4 px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Trending Shorts</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {shorts.length} Clips
                </span>
              </h3>
              <p className="text-xs text-slate-400">Portrait videos & stories from verified creators</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollHorizontal('left')}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700/60"
              title="Previous Shorts"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollHorizontal('right')}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700/60"
              title="Next Shorts"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveIndex(0);
                setIsVerticalModalOpen(true);
              }}
              className="ml-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition active:scale-95 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch All</span>
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={horizontalReelRef}
          className="flex items-center gap-3.5 overflow-x-auto scrollbar-none py-2 px-1 snap-x snap-mandatory"
        >
          {loading ? (
            <div className="flex items-center gap-3 w-full py-10 justify-center text-slate-400">
              <Sparkles className="w-6 h-6 text-rose-500 animate-spin" />
              <span className="text-xs font-bold">Loading trending shorts...</span>
            </div>
          ) : shorts.length === 0 ? (
            <div className="w-full text-center py-10 text-slate-500 text-xs">
              No shorts uploaded yet. Upload a vertical clip to be featured here!
            </div>
          ) : (
            shorts.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveIndex(idx);
                  setIsVerticalModalOpen(true);
                }}
                className="w-40 sm:w-48 h-64 sm:h-76 shrink-0 rounded-2xl overflow-hidden relative group cursor-pointer border border-slate-800 hover:border-rose-500/60 shadow-lg hover:shadow-rose-500/25 transition-all duration-200 transform hover:scale-[1.02] snap-start bg-slate-900"
              >
                {/* Media Preview (Video poster, YouTube thumbnail, or Image) */}
                {(() => {
                  const ytId = extractYouTubeId(item.mediaUrl) || extractYouTubeId(item.id);
                  if (ytId) {
                    return (
                      <img
                        src={item.thumbnailUrl || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    );
                  }
                  if (item.mediaType === 'video') {
                    if (item.thumbnailUrl) {
                      return (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      );
                    }
                    return (
                      <video
                        src={item.mediaUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        muted
                        playsInline
                        preload="none"
                      />
                    );
                  }
                  return (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  );
                })()}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                {/* Top Source Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-rose-400 border border-white/10">
                    {item.source === 'story' ? 'Moment' : 'Short'}
                  </span>
                </div>

                {/* Center Hover Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <div className="w-11 h-11 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl shadow-rose-600/50">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Bottom Card Metadata */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 space-y-1 pointer-events-none">
                  <p className="text-xs font-bold text-white line-clamp-2 drop-shadow-md leading-tight">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1">
                    <span className="truncate max-w-[85px] font-semibold flex items-center gap-1">
                      <img
                        src={item.authorAvatar}
                        alt={item.authorName}
                        className="w-3.5 h-3.5 rounded-full object-cover border border-white/30"
                      />
                      <span>{item.authorName}</span>
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-300 shrink-0">
                      <Flame className="w-3 h-3 fill-amber-400" />
                      <span>{formatNumber(item.views)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    );
  }

  // --- RENDER 2: FULL VERTICAL PLAYER (Matching Reference Design Exactly) ---
  return (
    <div
      className={
        isStandalonePage
          ? 'relative w-full max-w-lg mx-auto py-4 select-none min-h-[85vh] flex flex-col items-center justify-center'
          : 'fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200'
      }
    >
      {/* Close button if in modal overlay */}
      {!isStandalonePage && (
        <button
          onClick={() => {
            setIsVerticalModalOpen(false);
            if (currentShort && videoRefs.current[currentShort.id]) {
              videoRefs.current[currentShort.id]?.pause();
            }
          }}
          className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-black/80 hover:bg-slate-800 text-white border border-white/20 transition-all hover:scale-110"
          title="Close Shorts Player"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Main 9:16 Video Player Container (Strictly Clean, No Skyscraper Ads Inside) */}
      <div className="relative w-full max-w-[420px] h-[82vh] max-h-[780px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
        {/* Scrollable Container with Snap */}
        <div
          ref={containerRef}
          onScroll={handleContainerScroll}
          className="relative w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
        >
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <Sparkles className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-sm font-bold">Curating Shorts...</p>
            </div>
          ) : shorts.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <Tv className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-sm font-bold text-white">No Shorts Available</p>
              <p className="text-xs text-slate-500 mt-1">Upload a vertical clip or post a story to appear here!</p>
            </div>
          ) : (
            shorts.map((item, idx) => {
              const isCurrent = idx === activeIndex;
              const isLiked = !!likedStatus[item.id];
              const likesCount = likesMap[item.id] ?? item.likes;
              const authorKey = item.authorId || item.authorName;
              const isSubscribed = subscribedCreators.includes(authorKey);
              const subsCount = item.subscribersCount || 0;

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

                  {/* Media (Video, YouTube Iframe, or Image) */}
                  {(() => {
                    const ytId = extractYouTubeId(item.mediaUrl) || extractYouTubeId(item.id);
                    if (ytId) {
                      return (
                        <div className="w-full h-full relative overflow-hidden bg-black pointer-events-auto flex items-center justify-center">
                          <iframe
                            key={ytId}
                            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&controls=0&mute=${isMuted ? 1 : 0}&loop=1&playlist=${ytId}&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                            title={item.title}
                            className="w-full h-full object-cover pointer-events-auto border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                    if (item.mediaType === 'video') {
                      // Windowed Lazy Loading: Only mount video for active or immediately next item
                      const isNearActive = Math.abs(idx - activeIndex) <= 1;
                      if (!isNearActive) {
                        return (
                          <div className="w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
                            {item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-700">
                                <Play className="w-12 h-12 fill-current opacity-30" />
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <video
                          ref={(el) => {
                            videoRefs.current[item.id] = el;
                          }}
                          src={item.mediaUrl}
                          className="w-full h-full object-cover"
                          playsInline
                          preload={isCurrent ? 'auto' : 'metadata'}
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
                      );
                    }
                    return (
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
                    );
                  })()}

                  {/* Gradient Backdrops for Controls Legibility */}
                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-10" />

                  {/* Center Pause Indicator */}
                  {!isPlaying && item.mediaType === 'video' && isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
                      <div className="p-4 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                        <Play className="w-10 h-10 fill-white ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Top Bar Controls */}
                  <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-rose-400">
                        {item.source === 'story' ? 'Moment' : 'Short'}
                      </span>
                      {item.isMonetized && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30 flex items-center gap-0.5">
                          <DollarSign className="w-2.5 h-2.5" />
                          Monetized
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* PiP Popout Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerPiP(item);
                        }}
                        className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition"
                        title="Picture-in-Picture (Float over screen)"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      {/* Audio Mute/Unmute */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMuted(!isMuted);
                        }}
                        className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition"
                        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      </button>
                    </div>
                  </div>

                  {/* --- BOTTOM-LEFT INFO AREA (Matches Reference Mockup) --- */}
                  <div className="absolute left-3.5 bottom-20 right-16 z-20 space-y-2 text-white">
                    {/* Creator Row: Avatar + @Handle + Subscribe Pill */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <img
                        src={item.authorAvatar}
                        alt={item.authorName}
                        className="w-9 h-9 rounded-full object-cover border border-white/40 shadow-lg"
                      />
                      <div className="flex flex-col">
                        <span className="font-extrabold text-xs text-white drop-shadow">
                          @{item.authorName.replace(/\s+/g, '').toLowerCase()}
                        </span>
                        <span className="text-[10px] text-slate-300 font-medium">
                          {formatNumber(subscribersMap[authorKey] ?? subsCount)} {(subscribersMap[authorKey] ?? subsCount) === 1 ? 'subscriber' : 'subscribers'}
                        </span>
                      </div>

                      {/* Clean Reference "Subscribe" Pill Button */}
                      <button
                        onClick={(e) => handleToggleSubscribe(e, authorKey)}
                        className={`px-3 py-1 rounded-full text-xs font-black shadow-md transition-all active:scale-95 ${
                          isSubscribed
                            ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20'
                            : 'bg-white hover:bg-slate-200 text-slate-950 shadow-white/20'
                        }`}
                      >
                        {isSubscribed ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            Subscribed
                          </span>
                        ) : (
                          'Subscribe'
                        )}
                      </button>
                    </div>

                    {/* Video Title */}
                    <p className="text-sm font-semibold text-white drop-shadow-md line-clamp-2 leading-snug">
                      {item.title}
                    </p>

                    {/* Music Track Info Ticker */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300/90 drop-shadow">
                      <Music className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
                      <span className="truncate">Original Audio • {item.authorName}</span>
                    </div>


                  </div>

                  {/* --- RIGHT ACTION SIDEBAR (Matches Reference Mockup) --- */}
                  <div className="absolute right-2.5 bottom-20 z-20 flex flex-col items-center gap-3.5 text-white">
                    {/* 1. Like Button */}
                    <button
                      onClick={(e) => handleLike(e, item.id)}
                      className="flex flex-col items-center gap-0.5 focus:outline-none group"
                    >
                      <div className={`p-2.5 rounded-full backdrop-blur-md transition-transform group-hover:scale-110 ${
                        isLiked ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40' : 'bg-black/50 text-white hover:bg-black/70'
                      }`}>
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">
                        {formatNumber(likesCount)}
                      </span>
                    </button>

                    {/* 2. Comments Button */}
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">
                        {formatNumber(Math.floor(item.views * 0.05))}
                      </span>
                    </div>

                    {/* 3. Share Button */}
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
                          alert('Clip link copied to clipboard!');
                        }
                      }}
                      className="flex flex-col items-center gap-0.5 focus:outline-none group"
                      title="Share Video"
                    >
                      <div className="p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition group-hover:scale-110">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">Share</span>
                    </button>

                    {/* 4. Views / Flame Counter */}
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="p-2.5 rounded-full bg-black/50 backdrop-blur-md text-amber-400">
                        <Flame className="w-5 h-5 fill-amber-400" />
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">
                        {formatNumber(item.views)}
                      </span>
                    </div>

                    {/* 5. Spinning Audio Disc (Matches Reference Mockup) */}
                    <div className="relative pt-1">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-700 bg-slate-900 p-0.5 animate-spin duration-3000 shadow-lg">
                        <img
                          src={item.authorAvatar}
                          alt={item.authorName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- DOCKED BOTTOM AD CONTAINER (3 Google Ads : 1 Custom Ad Rotation) --- */}
                  <div
                    className="absolute inset-x-0 bottom-0 z-30 bg-[#0B0E14]/95 backdrop-blur-md border-t border-slate-800/80 px-2.5 py-1 flex flex-col justify-center min-h-[60px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(() => {
                      const isCustomAd = (idx % 4 === 3) && customAds.length > 0;
                      const customAd = isCustomAd ? customAds[Math.floor(idx / 4) % customAds.length] : null;

                      if (customAd) {
                        return (
                          <div
                            onClick={() => {
                              fetch('/api/ads/track-click', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ adId: customAd.id })
                              }).catch(() => {});
                              fetch('/api/ads/record-reward', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  storyId: item.id,
                                  creatorId: item.authorId,
                                  type: 'click',
                                  adType: 'custom',
                                  mediaType: 'short'
                                })
                              }).catch(() => {});
                              if (customAd.targetUrl) window.open(customAd.targetUrl, '_blank');
                            }}
                            className="w-full flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-800/40 p-1 rounded-xl transition"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={customAd.mediaUrl || '/logo.png'}
                                alt={customAd.title}
                                className="w-8 h-8 rounded-lg object-cover border border-amber-500/30 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded">
                                    Sponsored
                                  </span>
                                  <span className="text-xs font-bold text-white truncate">{customAd.title}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {customAd.description || 'Visit sponsor website'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black shrink-0 shadow-md flex items-center gap-1"
                            >
                              <span>{customAd.ctaText || 'Learn More'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      }

                      // Google Ad Unit (Slot 7034214536)
                      return (
                        <div
                          onClick={() => {
                            fetch('/api/ads/record-reward', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                storyId: item.id,
                                creatorId: item.authorId,
                                type: 'click',
                                adType: 'google',
                                mediaType: 'short'
                              })
                            }).catch(() => {});
                          }}
                          className="w-full flex flex-col items-center justify-center cursor-pointer"
                        >
                          <div className="w-full flex items-center justify-between px-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                            <span className="flex items-center gap-1 text-blue-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                              Ad by Google
                            </span>
                            <span className="truncate max-w-[160px]">Supporting @{item.authorName}</span>
                          </div>
                          <div className="w-full overflow-hidden flex items-center justify-center max-h-[55px]">
                            <AdSenseUnit
                              slot="7034214536"
                              clientId="ca-pub-4078466828008985"
                              format="horizontal"
                              minHeight={50}
                              className="w-full my-0 py-0"
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- UP / DOWN NAVIGATION CONTROLS (MOVED TO LEFT SIDE TO PREVENT BUTTON COLLISION) --- */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="p-2 rounded-full bg-black/70 hover:bg-black/95 text-white disabled:opacity-20 border border-white/20 transition shadow-lg hover:scale-105 active:scale-95"
            title="Previous Short"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(shorts.length - 1, activeIndex + 1))}
            disabled={activeIndex === shorts.length - 1}
            className="p-2 rounded-full bg-black/70 hover:bg-black/95 text-white disabled:opacity-20 border border-white/20 transition shadow-lg hover:scale-105 active:scale-95"
            title="Next Short"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6-SECOND NON-SKIPPABLE INTERSTITIAL AD MODAL (Rotation: 3 Google : 1 Custom) */}
      {showInterstitialAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200 select-none">
          <div className="relative w-full max-w-md bg-[#0F141F] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            {/* Header with Non-skippable countdown */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  {currentInterstitialType === 'google' ? 'Sponsored Partner' : 'Featured Sponsor'}
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                Next video in: {interstitialCountdown}s
              </div>
            </div>

            {/* Ad Content Container */}
            {currentInterstitialType === 'custom' && activeInterstitialCustomAd ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700 bg-black">
                  {activeInterstitialCustomAd.mediaType === 'video' ? (
                    <video
                      src={activeInterstitialCustomAd.mediaUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={activeInterstitialCustomAd.mediaUrl}
                      alt={activeInterstitialCustomAd.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <h4 className="font-extrabold text-base text-white">{activeInterstitialCustomAd.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{activeInterstitialCustomAd.description}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (activeInterstitialCustomAd) {
                      fetch('/api/ads/track-click', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ adId: activeInterstitialCustomAd.id })
                      }).catch(() => {});
                      if (currentShort) {
                        fetch('/api/ads/record-reward', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            shortId: currentShort.id,
                            creatorId: currentShort.authorId,
                            type: 'click',
                            adType: 'custom',
                            source: currentShort.source
                          })
                        }).catch(() => {});
                      }
                      if (activeInterstitialCustomAd.targetUrl) {
                        window.open(activeInterstitialCustomAd.targetUrl, '_blank');
                      }
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <span>{activeInterstitialCustomAd.ctaText || 'Learn More'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <div className="w-full min-h-[160px] max-h-[280px] bg-[#0A0E17] rounded-2xl p-2 border border-blue-500/30 flex flex-col items-center justify-center overflow-hidden">
                  <AdSenseUnit
                    slot="7034214536"
                    clientId="ca-pub-4078466828008985"
                    format="rectangle"
                    responsive={true}
                    className="my-0 max-h-[260px]"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span className="flex items-center gap-1 font-semibold text-blue-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> Official Google AdSense Partner
                  </span>
                  <span className="text-[10px] text-slate-500">Google Ads Network</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
