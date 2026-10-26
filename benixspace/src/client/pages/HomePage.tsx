import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useSidebar } from '../context/SidebarContext';
import {
  fetchTvStations,
  fetchRadioStations,
  type Station,
  type VideoItem
} from '../services/mediaService';
import { fetchArticles } from '../services/api';
import { type Article } from '../types';
import { AppAccessWizardModal } from '../components/modals/AppAccessWizardModal';
import { WalletModal } from '../components/modals/WalletModal';
import { ReferralModal } from '../components/modals/ReferralModal';
import { CreateMediaModal } from '../components/modals/CreateMediaModal';
import { SeoHead } from '../components/common/SeoHead';
import realVideosData from '../config/realVideos.json';
import {
  Tv,
  Play,
  Music,
  Heart,
  ShoppingBag,
  Gamepad2,
  ArrowRight,
  Wallet,
  Gift,
  FileText,
  Radio,
  Sparkles,
  ShieldCheck,
  Plus,
  Clock,
  Calculator,
  Film,
  X,
  Volume2,
  VolumeX,
  Pause,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Share2,
  Newspaper,
  Flame,
  RadioTower,
  Eye,
  SlidersHorizontal,
  ExternalLink,
  Crown,
  Lock,
  Disc
} from 'lucide-react';

// Lightweight Viewport Lazy Loader component for instant initial page paint (<100ms)
const LazyViewport: React.FC<{ children: React.ReactNode; minHeight?: string }> = ({
  children,
  minHeight = '300px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isVisible) return;
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '350px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={containerRef} style={{ minHeight: isVisible ? undefined : minHeight }}>
      {isVisible ? (
        children
      ) : (
        <div className="w-full h-44 rounded-3xl bg-slate-900/30 border border-slate-800/40 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, wallet, hasAppProfile } = useAuth();
  const { playStation, playTvChannel, currentStation, isPlaying } = usePlayer();
  const { isExpanded } = useSidebar();

  // Media Data
  const [tvStations, setTvStations] = useState<Station[]>([]);
  const [radioStations, setRadioStations] = useState<Station[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Stories & Creator Media State
  const [stories, setStories] = useState<any[]>([]);
  const [creatorVideos, setCreatorVideos] = useState<any[]>(() => (realVideosData as any[]).slice(0, 12));
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [isStoryPaused, setIsStoryPaused] = useState<boolean>(false);
  const [isStoryMuted, setIsStoryMuted] = useState<boolean>(false);
  const storyVideoRef = useRef<HTMLVideoElement | null>(null);
  const [customAds, setCustomAds] = useState<any[]>([]);
  const [showCreateMediaModal, setShowCreateMediaModal] = useState<boolean>(false);

  // Active Category Chip
  const [activeChip, setActiveChip] = useState<string>('All');

  // Hero Spotlight Sliding Animation State: [slideIndex, direction]
  const [[heroSlideIndex, heroDirection], setHeroSlide] = useState<[number, number]>([0, 0]);
  const [isHeroHovered, setIsHeroHovered] = useState<boolean>(false);

  // Horizontal Carousel Refs for Auto-Scrolling
  const tvRowRef = useRef<HTMLDivElement | null>(null);
  const radioRowRef = useRef<HTMLDivElement | null>(null);
  const [isTvHovered, setIsTvHovered] = useState<boolean>(false);
  const [isRadioHovered, setIsRadioHovered] = useState<boolean>(false);

  // Modals state
  const [wizardTargetKey, setWizardTargetKey] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);

  // Section anchor refs for smooth chip jumping
  const tvSectionRef = useRef<HTMLElement | null>(null);
  const radioSectionRef = useRef<HTMLElement | null>(null);
  const videosSectionRef = useRef<HTMLElement | null>(null);
  const newsSectionRef = useRef<HTMLElement | null>(null);
  const shortsSectionRef = useRef<HTMLElement | null>(null);

  // Dynamic Reload Handler for Stories and Creator Videos
  const loadStoriesAndVideos = useCallback(() => {
    fetch('/api/stories')
      .then((r) => r.json())
      .then((d) => {
        if (d?.stories && Array.isArray(d.stories)) setStories(d.stories);
      })
      .catch(() => {});

    fetch('/api/modules/videos')
      .then((r) => r.json())
      .then((d) => {
        if (d?.videos && Array.isArray(d.videos)) setCreatorVideos(d.videos);
      })
      .catch(() => {});
  }, []);

  // Instant Non-Blocking Parallel Data Loading (Page renders immediately in <100ms)
  useEffect(() => {
    fetchTvStations().then(setTvStations).catch(() => {});
    fetchRadioStations().then(setRadioStations).catch(() => {});
    fetchArticles().then((artList) => {
      if (artList && artList.length > 0) setArticles(artList);
    }).catch(() => {});

    loadStoriesAndVideos();

    fetch('/api/ads/active')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ads && Array.isArray(d.ads) && d.ads.length > 0) setCustomAds(d.ads);
      })
      .catch(() => {});
  }, [loadStoriesAndVideos]);

  // Protected feature click handler
  const handleProtectedAccess = (appKey: string, targetRoute: string) => {
    if (!user) {
      setWizardTargetKey(appKey);
    } else if (!hasAppProfile(appKey)) {
      setWizardTargetKey(appKey);
    } else {
      navigate(targetRoute);
    }
  };

  // Hero Spotlight Pagination
  const paginateHero = (newDirection: number) => {
    setHeroSlide(([prev]) => {
      const next = (prev + newDirection + 4) % 4;
      return [next, newDirection];
    });
  };

  const jumpToSlide = (idx: number) => {
    setHeroSlide(([prev]) => [idx, idx > prev ? 1 : -1]);
  };

  // Auto-Slide Timer for Hero Spotlight
  useEffect(() => {
    if (isHeroHovered) return;
    const timer = setInterval(() => {
      paginateHero(1);
    }, 5500);
    return () => clearInterval(timer);
  }, [isHeroHovered]);

  // TV Horizontal Auto-Scrolling
  useEffect(() => {
    if (isTvHovered) return;
    const interval = setInterval(() => {
      if (tvRowRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tvRowRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          tvRowRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          tvRowRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 3800);
    return () => clearInterval(interval);
  }, [isTvHovered, tvStations.length]);

  // Radio Horizontal Auto-Scrolling
  useEffect(() => {
    if (isRadioHovered) return;
    const interval = setInterval(() => {
      if (radioRowRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = radioRowRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          radioRowRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          radioRowRef.current.scrollBy({ left: 280, behavior: 'smooth' });
        }
      }
    }, 4200);
    return () => clearInterval(interval);
  }, [isRadioHovered, radioStations.length]);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, offset: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Chips click handler: Navigate directly to pages as requested by user
  const handleChipClick = (chip: string) => {
    setActiveChip(chip);
    if (chip === 'Watch TV') {
      navigate('/tv');
    } else if (chip === 'Live Radio') {
      navigate('/radio');
    } else if (chip === 'Creator Videos') {
      navigate('/videos');
    } else if (chip === 'News & Articles') {
      navigate('/blog');
    } else if (chip === 'Shorts') {
      navigate('/videos?category=Shorts');
    } else if (chip === 'Kunda Dating') {
      navigate('/dating');
    } else if (chip === 'Voxify Music') {
      navigate('/music');
    } else if (chip === 'Marketplace') {
      navigate('/marketplace');
    } else if (chip === 'RollDice Arena') {
      navigate('/games');
    } else if (chip === 'Calculators') {
      navigate('/calculators');
    }
  };

  const handleNextStory = useCallback(() => {
    setStoryProgress(0);
    setActiveStoryIndex((prev) => {
      if (prev === null) return null;
      if (prev < stories.length - 1) return prev + 1;
      return null;
    });
  }, [stories.length]);

  const handlePrevStory = useCallback(() => {
    setStoryProgress(0);
    setActiveStoryIndex((prev) => {
      if (prev === null || prev === 0) return 0;
      return prev - 1;
    });
  }, []);

  // Photo story auto-advance (5 seconds smooth progress)
  useEffect(() => {
    if (activeStoryIndex === null || stories.length === 0 || isStoryPaused) return;
    const currentStory = stories[activeStoryIndex];
    const mediaUrl = currentStory?.mediaUrl || '';
    const isVideo =
      mediaUrl.startsWith('data:video') ||
      /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(mediaUrl) ||
      currentStory?.mediaType === 'video';

    if (isVideo) return; // Video story driven by video's onTimeUpdate & onEnded

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeStoryIndex, stories, isStoryPaused, handleNextStory]);

  // Reset progress and pause state when activeStoryIndex changes
  useEffect(() => {
    setStoryProgress(0);
    setIsStoryPaused(false);
  }, [activeStoryIndex]);

  // Track story ad impression on story load (rewards monetized creators with custom ads & AdSense, and increments story views)
  useEffect(() => {
    if (activeStoryIndex === null || !stories[activeStoryIndex]) return;
    const currentStory = stories[activeStoryIndex];
    const authorId = (currentStory as any).authorId || (currentStory as any).author_id || (currentStory as any).userId;
    const currentCustomAd = customAds.length > 0 ? customAds[activeStoryIndex % customAds.length] : null;

    // Increment story view count
    if (currentStory.id) {
      fetch(`/api/stories/${currentStory.id}/view`, { method: 'POST' }).catch(() => {});
    }

    if (currentCustomAd) {
      fetch('/api/ads/track-impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: currentCustomAd.id })
      }).catch(() => {});
    }

    fetch('/api/ads/record-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId: currentStory.id,
        creatorId: authorId,
        action: 'impression',
        mediaType: 'story',
        adSource: currentCustomAd ? 'custom' : 'adsense'
      })
    }).catch(() => {});
  }, [activeStoryIndex, stories, customAds]);

  const handleStoryAdClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStoryIndex === null || !stories[activeStoryIndex]) return;
    const currentStory = stories[activeStoryIndex];
    const authorId = (currentStory as any).authorId || (currentStory as any).author_id || (currentStory as any).userId;
    const currentCustomAd = customAds.length > 0 ? customAds[activeStoryIndex % customAds.length] : null;

    if (currentCustomAd) {
      fetch('/api/ads/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: currentCustomAd.id })
      }).catch(() => {});
    }

    fetch('/api/ads/record-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId: currentStory.id,
        creatorId: authorId,
        action: 'click',
        mediaType: 'story',
        adSource: currentCustomAd ? 'custom' : 'adsense'
      })
    }).catch(() => {});

    if (currentCustomAd?.targetUrl) {
      window.open(currentCustomAd.targetUrl, '_blank');
    } else {
      window.open('https://benix.space', '_blank');
    }
  };

  // Hero Slide Variants for Framer Motion animation
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 280, damping: 28 },
        opacity: { duration: 0.35 }
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 280, damping: 28 },
        opacity: { duration: 0.3 }
      }
    })
  };

  const featuredTv = tvStations[0] || {
    id: 'rtv',
    name: 'RTV Live',
    slug: 'rtv',
    description: "Rwanda Television (RTV) is Rwanda's public service television broadcaster.",
    stream_url: 'https://5c46fa289c89f.streamlock.net/rtv25/rtv/playlist.m3u8',
    stream_type: 'HLS',
    station_type: 'TV'
  };

  // Fallback Articles if API has few
  const displayArticles: Article[] = articles.length > 0 ? articles : [
    {
      id: 1,
      title: 'Building Modern Web Applications for Rwanda’s Digital Ecosystem',
      slug: 'building-modern-web-applications-rwanda-digital-ecosystem',
      summary: 'How scalable cloud infrastructure and adaptive video feeds power next-generation African media platforms.',
      content: '',
      featured_image_url: 'https://i.postimg.cc/Hnj1LYRT/online-banks.png',
      category: 'Technology',
      author_name: 'Benir Benjamin',
      published_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Rwanda Media Revolution: How 17 TV Channels and 19 Radios Stream Seamlessly',
      slug: 'rwanda-media-revolution-hls-streaming',
      summary: 'An inside look into low-latency HLS video delivery, audio background players, and unified digital subscriptions.',
      content: '',
      featured_image_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=80',
      category: 'Media & Tech',
      author_name: 'Editorial Desk',
      published_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      title: 'Instant Mobile Money Integration: Central Wallet System for Micro-Transactions',
      slug: 'instant-mobile-money-central-wallet-rwanda',
      summary: 'Empowering Rwandan creators and everyday users with friction-free MTN & Airtel-Tigo payments starting from 50 RWF.',
      content: '',
      featured_image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
      category: 'Fintech',
      author_name: 'Benix Finance',
      published_at: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-28 font-sans selection:bg-blue-600 selection:text-white">
      <SeoHead
        title="Benix.Space — All in One. For Everyone."
        description="Watch live TV channels, 24/7 radio stations, creator videos, verified Kunda dating, Voxify music, and digital marketplace in YouTube-style experience."
      />

      {/* ========================================================
          1. YOUTUBE-STYLE FILTER CHIPS BAR (Sticky below top navbar)
         ======================================================== */}
      <div className="sticky top-14 z-20 bg-[#0B0E14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-[1720px] mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth">
          {[
            'All',
            'Watch TV',
            'Live Radio',
            'Creator Videos',
            'News & Articles',
            'Shorts',
            'Kunda Dating',
            'Voxify Music',
            'Marketplace',
            'RollDice Arena',
            'Calculators'
          ].map((chip) => {
            const isActive = activeChip === chip;
            return (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isActive
                    ? 'bg-slate-100 text-black font-bold shadow-md shadow-white/10'
                    : 'bg-[#181F2E] hover:bg-[#222B3D] text-slate-300 hover:text-white border border-slate-700/50'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* FULL WIDTH MAIN CONTENT CONTAINER */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-10">

        {/* ========================================================
            1. SHORTS & REELS BAR (COME UP BEFORE FEATURED SECTION)
           ======================================================== */}
        <section ref={shortsSectionRef} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Shorts & Stories
              </h2>
            </div>

            <button
              onClick={() => {
                if (!user) setWizardTargetKey('tv');
                else setShowCreateMediaModal(true);
              }}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your Story</span>
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {/* Create Story Button */}
            <button
              onClick={() => {
                if (!user) setWizardTargetKey('tv');
                else setShowCreateMediaModal(true);
              }}
              className="w-32 sm:w-36 h-56 sm:h-64 rounded-2xl border-2 border-dashed border-blue-500/60 hover:border-blue-400 bg-blue-600/10 flex flex-col items-center justify-center gap-2 shrink-0 group transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                Add Story
              </span>
            </button>

            {/* Stories List (Supports Video & Photo stories) */}
            {stories.map((story, idx) => {
              const isVideo =
                story.mediaType === 'video' ||
                story.mediaUrl?.startsWith('data:video') ||
                /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(story.mediaUrl);

              return (
                <div
                  key={story.id || idx}
                  onClick={() => setActiveStoryIndex(idx)}
                  className="w-32 sm:w-36 h-56 sm:h-64 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/60 overflow-hidden relative cursor-pointer shrink-0 group transition-all shadow-lg"
                >
                  {isVideo ? (
                    <video
                      src={story.mediaUrl}
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    />
                  ) : (
                    <img
                      src={story.mediaUrl || story.authorAvatar}
                      alt={story.authorName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                    <div className="w-7 h-7 rounded-full border-2 border-blue-500 overflow-hidden">
                      <img
                        src={story.authorAvatar || story.mediaUrl}
                        alt={story.authorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                        {story.caption || story.authorName}
                      </h4>
                      <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                        {story.authorName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {stories.length === 0 && (
              <div className="flex items-center gap-3 text-xs text-slate-400 px-3 py-6">
                <span>No stories active yet. Click "Add Story" to upload yours!</span>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================
            2. FEATURED CREATOR VIDEOS (COME UP BEFORE FEATURED SECTION)
           ======================================================== */}
        <section ref={videosSectionRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Featured Creator Videos & Shows</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Exclusive concerts, cinema & tutorials. Share your unique link to earn 15% wallet commissions.
                </p>
              </div>
            </div>

            <Link
              to="/videos"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>View All Videos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 3 CARDS IN A ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
            {creatorVideos.slice(0, 9).map((vid, idx) => {
              const videoId = vid.id || vid.slug || `vid-${idx}`;
              const title = vid.title;
              const creator = vid.channelName || vid.creator || 'Benix Space Channel';
              const avatar = vid.channelAvatar || '/logo.png';
              const thumbnail = vid.thumbnailUrl || vid.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              const duration = vid.duration || '10:00';
              const viewsNum = typeof vid.views === 'number' ? vid.views : (parseInt(vid.views, 10) || 0);
              const viewsCount = viewsNum > 999999
                ? `${(viewsNum / 1000000).toFixed(1)}M`
                : viewsNum > 999
                  ? `${(viewsNum / 1000).toFixed(1)}K`
                  : viewsNum.toLocaleString();
              const priceLabel = Number(vid.price) > 0 ? `${Number(vid.price).toLocaleString()} RWF` : 'Free';

              return (
                <div
                  key={videoId}
                  onClick={() => navigate(`/videos/${videoId}`)}
                  className="group flex flex-col cursor-pointer space-y-3"
                >
                  {/* Video Thumbnail (16:9 ratio with duration badge) */}
                  <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden border border-slate-800/80 group-hover:border-slate-700 transition-all shadow-md">
                    <img
                      src={thumbnail}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      }}
                    />

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Price / Free Tag */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase shadow-md ${
                        priceLabel === 'Free' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-black'
                      }`}>
                        {priceLabel}
                      </span>
                    </div>

                    {/* Duration Badge (Bottom Right, YouTube Style) */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-[10px] font-mono font-bold text-white shadow-md">
                      {duration}
                    </div>
                  </div>

                  {/* Video Info (YouTube Style: Avatar + Title + Channel & Views) */}
                  <div className="flex items-start gap-3 px-0.5">
                    {/* Channel Avatar */}
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/80 overflow-hidden shrink-0 mt-0.5">
                      <img
                        src={avatar}
                        alt={creator}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/logo.png';
                        }}
                      />
                    </div>

                    {/* Title & Metadata */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors"
                        title={title}
                      >
                        {title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs">
                        <span className="truncate hover:text-slate-200 transition-colors">{creator}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <span>{viewsCount} views</span>
                        <span className="mx-1.5">•</span>
                        <span>Verified Media</span>
                      </div>
                    </div>

                    {/* 3-dots Menu Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard?.writeText(`${window.location.origin}/videos/${videoId}`);
                        alert('Video link copied to clipboard!');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Share / Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================
            3. FEATURED SPOTLIGHT HERO SECTION WITH ANIMATED SLIDING
           ======================================================== */}
        <section
          className="relative rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl bg-[#0F1420]"
          onMouseEnter={() => setIsHeroHovered(true)}
          onMouseLeave={() => setIsHeroHovered(false)}
        >
          {/* Animated Carousel Track */}
          <div className="relative min-h-[380px] sm:min-h-[340px] flex items-center overflow-hidden">
            <AnimatePresence initial={false} custom={heroDirection} mode="wait">
              {heroSlideIndex === 0 && (
                <motion.div
                  key="slide-tv"
                  custom={heroDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full bg-gradient-to-r from-[#141B2D] via-[#101726] to-[#0D121F] p-6 sm:p-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-3.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>Live Rwandan Television (17 Channels)</span>
                      </div>
                      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                        Watch TV & Live Channels
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                        Stream RTV, KC2, BTN TV, TV10, Isibo TV, and Africa 24 live with low-latency adaptive HLS feeds and movable Picture-in-Picture mode across all pages.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => { playTvChannel(featuredTv); navigate('/tv'); }}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-blue-600/30 transition-all active:scale-95"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Watch {featuredTv.name}</span>
                        </button>
                        <button
                          onClick={() => navigate('/tv')}
                          className="px-5 py-3 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/80 transition-all"
                        >
                          Explore All 17 TV Stations
                        </button>
                      </div>
                    </div>

                    <div
                      className="md:col-span-5 relative flex justify-center cursor-pointer"
                      onClick={() => { playTvChannel(featuredTv); navigate('/tv'); }}
                    >
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl group">
                        <img
                          src={featuredTv.logo_url || '/logo.png'}
                          alt="Live TV"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                            <div>
                              <h3 className="font-black text-white text-sm">{featuredTv.name}</h3>
                              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Now
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {heroSlideIndex === 1 && (
                <motion.div
                  key="slide-dating"
                  custom={heroDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full bg-gradient-to-r from-[#2D0F1E] via-[#200A15] to-[#0D121F] p-6 sm:p-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-3.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>Verified Rwandan Matchmaking</span>
                      </div>
                      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                        Kunda Space Dating
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                        Find serious relationships and meaningful companions in Kigali and across Rwanda. Send crushes, enjoy private chats, and unlock verified contacts securely.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => navigate('/dating')}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-rose-600/30 transition-all active:scale-95"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                          <span>Explore Verified Matches</span>
                        </button>
                        <button
                          onClick={() => navigate('/messages')}
                          className="px-5 py-3 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/80 transition-all"
                        >
                          Open Private Chat
                        </button>
                      </div>
                    </div>

                    <div
                      className="md:col-span-5 relative flex justify-center cursor-pointer"
                      onClick={() => navigate('/dating')}
                    >
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-rose-500/30 shadow-2xl group">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                          alt="Kunda Dating"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-4">
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">100% VERIFIED</span>
                            <h3 className="font-black text-white text-sm mt-1">Aline M. (Kigali, Kacyiru)</h3>
                            <p className="text-[11px] text-rose-300">Software Designer • Online Now</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {heroSlideIndex === 2 && (
                <motion.div
                  key="slide-radio"
                  custom={heroDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full bg-gradient-to-r from-[#17122B] via-[#100C1F] to-[#0D121F] p-6 sm:p-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-3.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold">
                        <Radio className="w-3.5 h-3.5" />
                        <span>19 Rwandan FM Radio Frequencies</span>
                      </div>
                      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                        24/7 Live Radio FM
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                        Tune into Kiss FM 102.3, Radio Rwanda 100.7 FM, Magic FM, Radio 10, Flash FM, and Royal FM with seamless background audio while you browse.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => {
                            const kiss = radioStations.find((r) => r.slug.includes('kiss')) || radioStations[0];
                            if (kiss) playStation(kiss);
                            navigate('/radio');
                          }}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-purple-600/30 transition-all active:scale-95"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Tune Kiss FM 102.3</span>
                        </button>
                        <button
                          onClick={() => navigate('/radio')}
                          className="px-5 py-3 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/80 transition-all"
                        >
                          All 19 Radio Stations
                        </button>
                      </div>
                    </div>

                    <div
                      className="md:col-span-5 relative flex justify-center cursor-pointer"
                      onClick={() => navigate('/radio')}
                    >
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl group">
                        <img
                          src="https://i.postimg.cc/Cx2q12xV/kiss-fm.jpg"
                          alt="Kiss FM"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-4">
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black">FM BROADCAST</span>
                            <h3 className="font-black text-white text-sm mt-1">Kiss FM 102.3 Kigali</h3>
                            <p className="text-[11px] text-purple-300">The Beat of Kigali • Urban Hits</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {heroSlideIndex === 3 && (
                <motion.div
                  key="slide-games"
                  custom={heroDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full bg-gradient-to-r from-[#0F261E] via-[#0A1A14] to-[#0D121F] p-6 sm:p-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-3.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>RollDice Arena & Central Wallet</span>
                      </div>
                      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                        Win 1.95x on RollDice
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                        Wager starting from 50 RWF and cash out instant winnings directly to your MTN Mobile Money account. Zero wait times.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => navigate('/games')}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-emerald-600/30 transition-all active:scale-95"
                        >
                          <Gamepad2 className="w-4 h-4" />
                          <span>Play RollDice Arena</span>
                        </button>
                        <button
                          onClick={() => navigate('/dashboard#wallet')}
                          className="px-5 py-3 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/80 transition-all"
                        >
                          Deposit 100 RWF (MoMo)
                        </button>
                      </div>
                    </div>

                    <div
                      className="md:col-span-5 relative flex justify-center cursor-pointer"
                      onClick={() => navigate('/games')}
                    >
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl group">
                        <img
                          src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80"
                          alt="RollDice"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-4">
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">INSTANT PAYOUTS</span>
                            <h3 className="font-black text-white text-sm mt-1">RollDice PVE Arena</h3>
                            <p className="text-[11px] text-emerald-300">Minimum Wager: 50 RWF</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Left / Right Slide Controls & Pagination Bullets */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={() => paginateHero(-1)}
              className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-colors shadow-lg active:scale-95"
              title="Previous Spotlight"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2 bg-black/40 backdrop-blur-md py-1.5 rounded-full border border-white/10">
              {[0, 1, 2, 3].map((slide) => (
                <button
                  key={slide}
                  onClick={() => jumpToSlide(slide)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    heroSlideIndex === slide ? 'w-6 bg-blue-500' : 'w-2 bg-slate-500 hover:bg-slate-400'
                  }`}
                  title={`Go to slide ${slide + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => paginateHero(1)}
              className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-colors shadow-lg active:scale-95"
              title="Next Spotlight"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ========================================================
            3. ROW 1: LIVE TV - AUTO-SCROLLING HORIZONTALLY (SLIDING)
           ======================================================== */}
        <section ref={tvSectionRef} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Live Rwandan Television</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Auto-sliding channels with low-latency adaptive HLS feeds. Supports movable Picture-in-Picture.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollContainer(tvRowRef, -320)}
                className="p-2 rounded-xl bg-[#141C2B] hover:bg-[#1C273C] text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollContainer(tvRowRef, 320)}
                className="p-2 rounded-xl bg-[#141C2B] hover:bg-[#1C273C] text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <Link
                to="/tv"
                className="hidden sm:flex text-xs font-bold text-blue-400 hover:text-blue-300 items-center gap-1 ml-2"
              >
                <span>All 17 Channels</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Horizontal Scrolling Strip (Auto-sliding with pause on hover) */}
          <div
            ref={tvRowRef}
            onMouseEnter={() => setIsTvHovered(true)}
            onMouseLeave={() => setIsTvHovered(false)}
            className="flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
          >
            {tvStations.map((station) => (
              <div
                key={station.id}
                onClick={() => {
                  playTvChannel(station);
                  navigate('/tv');
                }}
                className="w-64 sm:w-72 shrink-0 group relative rounded-2xl bg-[#121824] border border-slate-800/80 hover:border-blue-500/50 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] shadow-md p-3 flex flex-col justify-between"
              >
                <div className="relative aspect-video rounded-xl bg-slate-900/90 overflow-hidden mb-2.5 flex items-center justify-center">
                  <img
                    src={station.logo_url}
                    alt={station.name}
                    className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </span>
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-mono text-slate-300">
                    HLS HD
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-blue-400 transition-colors">
                    {station.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {station.frequency || 'DTT Rwanda • Adaptive Feed'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            4. ROW 2: LIVE RADIOS - SLIDING HORIZONTALLY
           ======================================================== */}
        <LazyViewport minHeight="260px">
        <section ref={radioSectionRef} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Live Rwandan FM Radios</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/40">
                    24/7 BACKGROUND AUDIO
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Auto-sliding stations that stream continuously across all pages without interruption.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollContainer(radioRowRef, -300)}
                className="p-2 rounded-xl bg-[#141C2B] hover:bg-[#1C273C] text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollContainer(radioRowRef, 300)}
                className="p-2 rounded-xl bg-[#141C2B] hover:bg-[#1C273C] text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <Link
                to="/radio"
                className="hidden sm:flex text-xs font-bold text-purple-400 hover:text-purple-300 items-center gap-1 ml-2"
              >
                <span>All 19 Radios</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Horizontal Radio Scrolling Strip */}
          <div
            ref={radioRowRef}
            onMouseEnter={() => setIsRadioHovered(true)}
            onMouseLeave={() => setIsRadioHovered(false)}
            className="flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
          >
            {radioStations.map((station) => {
              const isCurrentPlaying = currentStation?.id === station.id && isPlaying;

              return (
                <div
                  key={station.id}
                  onClick={() => playStation(station)}
                  className={`w-56 sm:w-64 shrink-0 group relative rounded-2xl bg-[#121824] border transition-all hover:scale-[1.02] shadow-md p-3 flex flex-col justify-between cursor-pointer ${
                    isCurrentPlaying
                      ? 'border-purple-500 bg-purple-950/20 shadow-purple-900/30 ring-1 ring-purple-500'
                      : 'border-slate-800/80 hover:border-purple-500/50'
                  }`}
                >
                  <div className="relative aspect-video rounded-xl bg-slate-900/90 overflow-hidden mb-2.5 flex items-center justify-center">
                    <img
                      src={station.logo_url}
                      alt={station.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                        {isCurrentPlaying ? (
                          <Volume2 className="w-4 h-4 animate-bounce" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </div>
                    </div>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-black uppercase">
                      FM
                    </span>

                    {/* Animated Equalizer Waveform when station is actively playing */}
                    {isCurrentPlaying && (
                      <div className="absolute bottom-2 right-2 flex items-end gap-1 h-3 px-1.5 py-0.5 bg-black/70 rounded-md">
                        <span className="w-1 bg-purple-400 animate-[bounce_0.6s_ease-in-out_infinite] h-3" />
                        <span className="w-1 bg-purple-400 animate-[bounce_0.8s_ease-in-out_infinite] h-2" />
                        <span className="w-1 bg-purple-400 animate-[bounce_0.5s_ease-in-out_infinite] h-3" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-purple-400 transition-colors">
                      {station.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {station.frequency || 'Kigali FM • Live Audio'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        </LazyViewport>



        {/* ========================================================
            6. ROW 4: ARTICLES FROM NEWS (3 CARDS IN A ROW)
           ======================================================== */}
        <LazyViewport minHeight="320px">
        <section ref={newsSectionRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Latest News & Editorial Articles</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Insights into Rwanda's digital ecosystem, software architecture, and regional technology trends.
                </p>
              </div>
            </div>

            <Link
              to="/blog"
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>View All Articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 3 News Cards in a row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
            {displayArticles.slice(0, 3).map((art) => (
              <div
                key={art.id}
                onClick={() => navigate(`/blog/${art.slug}`)}
                className="group flex flex-col bg-[#121824] rounded-2xl border border-slate-800/80 hover:border-sky-500/50 overflow-hidden cursor-pointer transition-all hover:scale-[1.01] shadow-lg"
              >
                {/* Article Cover Image */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src={art.featured_image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80'}
                    alt={art.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-black uppercase shadow-md">
                      {art.category || 'News'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{art.published_at ? new Date(art.published_at).toLocaleDateString() : 'Recent'}</span>
                      <span>•</span>
                      <span>5 min read</span>
                    </div>
                    <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-sky-300 transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="truncate">{art.author_name || 'NebeluRw Media'}</span>
                    <span className="text-sky-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        </LazyViewport>



        {/* ========================================================
            8. ROW 6: ECOSYSTEM SPOTLIGHT CARDS (3 CARDS IN A ROW)
           ======================================================== */}
        <LazyViewport minHeight="280px">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">Ecosystem Services & Rewards</h2>
            <p className="text-xs text-slate-400">Integrated super-app tools available to every verified account.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 xl:gap-6">
            {/* Card 1: Kunda Space */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C1625] via-[#161220] to-[#120F1A] border border-rose-900/40 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/20 inline-flex items-center gap-1.5">
                  <Heart className="w-3 h-3 fill-current text-rose-400" />
                  Kunda Dating Space
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Meaningful Relationships in Rwanda
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Verified Kigali singles, instant 24h passes, wallet messaging, and direct WhatsApp unlocks.
                </p>
              </div>

              <button
                onClick={() => handleProtectedAccess('kunda', '/dating')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Find Matches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Central Wallet Balance */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0F1E24] via-[#0C171C] to-[#0A1217] border border-emerald-900/40 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5">
                    <Wallet className="w-3 h-3 text-emerald-400" />
                    Central Wallet
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Deposit from 100 RWF
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Available Balance</span>
                  <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                    {wallet ? Number(wallet.balance).toLocaleString() : '100.00'}{' '}
                    <span className="text-xs font-bold text-emerald-400">{wallet?.currency || 'RWF'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (!user) setWizardTargetKey('calc');
                    else setShowWalletModal(true);
                  }}
                  className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md text-center"
                >
                  Top Up MoMo
                </button>
                <button
                  onClick={() => {
                    if (!user) setWizardTargetKey('calc');
                    else navigate('/dashboard#wallet');
                  }}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors text-center"
                >
                  View Ledger
                </button>
              </div>
            </div>

            {/* Card 3: RollDice Arena */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C1825] via-[#15121D] to-[#0E0C14] border border-violet-900/40 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-400 bg-violet-500/15 px-2.5 py-1 rounded-full border border-violet-500/20 inline-flex items-center gap-1.5">
                  <Gamepad2 className="w-3 h-3 text-violet-400" />
                  RollDice PVE Arena
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Win 1.95x Instant Cash
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Provably fair dice rolls starting from 50 RWF. Direct payouts to your MTN Mobile Money wallet.
                </p>
              </div>

              <button
                onClick={() => handleProtectedAccess('games', '/games')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Play & Win</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
        </LazyViewport>

        {/* ========================================================
        {/* ========================================================
            8.5 ORIGINAL SONGS TO BUY & OWN (VOXIFY MARKETPLACE)
           ======================================================== */}
        <LazyViewport minHeight="300px">
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Original Songs to Buy & Own</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    EXCLUSIVE LICENSES
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Own exclusive master copyrights and licensed choral arrangements directly from Rwandan composers.
                </p>
              </div>
            </div>

            <Link
              to="/voxify"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
            >
              <span>Explore All Songs in Voxify</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                id: 'song-01',
                title: 'Umunsi Mukuru (Easter Choral Anthem)',
                composer: 'Chorale de Kigali Masters',
                price: 25000,
                type: 'exclusive',
                lyrics: 'Verse 1: Umunsi mukuru urageze, abatunganye bose nibishime...',
                image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80'
              },
              {
                id: 'song-02',
                title: 'Nzahora Nshima (Acoustic Choral Score)',
                composer: 'Gakwaya Innocent & St. Paul Choir',
                price: 15000,
                type: 'digital_copy',
                lyrics: 'Verse 1: Nzahora nshima Nyagasani ibihe byose, ishimwe rye...',
                image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80'
              },
              {
                id: 'song-03',
                title: 'Imana Ni Urukundo (Sacred SATB Full Stem)',
                composer: 'Kigali Choral Fellowship',
                price: 45000,
                type: 'exclusive',
                lyrics: 'Verse 1: Imana ni urukundo ruzira icyasha, urukundo ruhebuje...',
                image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80'
              }
            ].map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-3xl bg-[#121824] border border-slate-800 hover:border-amber-500/40 space-y-4 flex flex-col justify-between transition-all hover:scale-[1.01] shadow-lg"
              >
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                    <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        {s.type === 'exclusive' ? 'Exclusive Ownership' : 'Digital License'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm line-clamp-1">{s.title}</h3>
                    <p className="text-[11px] text-slate-400">By {s.composer}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 italic line-clamp-2">
                    "{s.lyrics}"
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-emerald-400">{s.price.toLocaleString()}</span>{' '}
                    <span className="text-[10px] text-slate-400">RWF</span>
                  </div>

                  <Link
                    to="/voxify"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95"
                  >
                    <span>Buy & Own</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
        </LazyViewport>

        {/* ========================================================
            9. REFERRAL BANNER (Invite Friends & Earn Rewards)
           ======================================================== */}
        <LazyViewport minHeight="120px">
        <section className="relative rounded-3xl bg-gradient-to-r from-violet-950/80 via-purple-900/60 to-indigo-950/80 border border-purple-800/40 p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 shrink-0 border border-purple-500/30">
              <Gift className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">Invite Friends & Earn Wallet Rewards</h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Share your personal code and earn 1,000 RWF for every active friend joining Benix.Space.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!user) setWizardTargetKey('calc');
              else setShowReferralModal(true);
            }}
            className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 shrink-0 transition-all active:scale-95"
          >
            Open Referral Portal
          </button>
        </section>
        </LazyViewport>

      </div>

      {/* ==================== FULL-SCREEN STORY VIEWER MODAL ==================== */}
      {activeStoryIndex !== null && stories[activeStoryIndex] && (() => {
        const currentStory = stories[activeStoryIndex];
        const mediaUrl = currentStory.mediaUrl || '';
        const isVideo =
          mediaUrl.startsWith('data:video') ||
          /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(mediaUrl) ||
          currentStory.mediaType === 'video';
        const currentCustomAd = customAds.length > 0 ? customAds[activeStoryIndex % customAds.length] : null;

        const handleScreenTap = (e: React.MouseEvent<HTMLDivElement>) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;

          if (clickX < width * 0.35) {
            handlePrevStory();
          } else if (clickX > width * 0.65) {
            handleNextStory();
          } else {
            // Center tap: toggle play/pause
            if (isVideo && storyVideoRef.current) {
              if (storyVideoRef.current.paused) {
                storyVideoRef.current.play().catch(() => {});
                setIsStoryPaused(false);
              } else {
                storyVideoRef.current.pause();
                setIsStoryPaused(true);
              }
            } else {
              setIsStoryPaused((p) => !p);
            }
          }
        };

        const toggleMuteStory = (e: React.MouseEvent) => {
          e.stopPropagation();
          setIsStoryMuted((prev) => {
            const next = !prev;
            if (storyVideoRef.current) storyVideoRef.current.muted = next;
            return next;
          });
        };

        const togglePlayStory = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isVideo && storyVideoRef.current) {
            if (storyVideoRef.current.paused) {
              storyVideoRef.current.play().catch(() => {});
              setIsStoryPaused(false);
            } else {
              storyVideoRef.current.pause();
              setIsStoryPaused(true);
            }
          } else {
            setIsStoryPaused((p) => !p);
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none overflow-hidden">
            <div className="relative max-w-md w-full h-[94dvh] sm:h-[88vh] max-h-[96dvh] rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex flex-col justify-between">
              
              {/* Top Segmented Progress Bar & Creator Header */}
              <div className="absolute top-0 inset-x-0 z-30 p-3 sm:p-4 bg-gradient-to-b from-black/95 via-black/60 to-transparent space-y-2.5 pointer-events-none">
                {/* Multi-story Segmented Progress Bars */}
                <div className="flex items-center gap-1.5 w-full">
                  {stories.map((st, i) => {
                    let widthPercent = 0;
                    if (i < activeStoryIndex) widthPercent = 100;
                    else if (i === activeStoryIndex) widthPercent = storyProgress;
                    else widthPercent = 0;

                    return (
                      <div key={st.id || i} className="flex-1 bg-white/20 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-white h-full transition-[width] duration-75 ease-linear"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Creator Info & Custom Player Controls */}
                <div className="flex items-center justify-between text-white pointer-events-auto">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentStory.authorAvatar || mediaUrl}
                      alt={currentStory.authorName}
                      className="w-8 h-8 rounded-full object-cover border border-white/40"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold block">{currentStory.authorName}</span>
                        {currentStory.views !== undefined && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-black/50 px-1.5 py-0.2 rounded-full border border-amber-400/30">
                            <Eye className="w-2.5 h-2.5 text-amber-400" />
                            {currentStory.views}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-300">{currentStory.timestamp || 'Active 24h Story'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Play/Pause Button */}
                    <button
                      onClick={togglePlayStory}
                      className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                      title={isStoryPaused ? 'Resume' : 'Pause'}
                    >
                      {isStoryPaused ? <Play className="w-4 h-4 fill-current ml-0.5" /> : <Pause className="w-4 h-4 fill-current" />}
                    </button>

                    {/* Mute/Unmute for Videos */}
                    {isVideo && (
                      <button
                        onClick={toggleMuteStory}
                        className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                        title={isStoryMuted ? 'Unmute' : 'Mute'}
                      >
                        {isStoryMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Close Story Button */}
                    <button
                      onClick={() => setActiveStoryIndex(null)}
                      className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Story Media with Screen Tap Navigation (<35% Prev, >65% Next) */}
              <div
                onClick={handleScreenTap}
                className="w-full flex-1 flex items-center justify-center bg-black overflow-hidden relative cursor-pointer"
              >
                {isVideo ? (
                  <video
                    ref={storyVideoRef}
                    key={currentStory.id || activeStoryIndex}
                    src={mediaUrl}
                    autoPlay
                    playsInline
                    muted={isStoryMuted}
                    controls={false}
                    className="w-full h-full object-contain pointer-events-none"
                    onTimeUpdate={(e) => {
                      const dur = e.currentTarget.duration || 1;
                      const cur = e.currentTarget.currentTime;
                      setStoryProgress(Math.min(100, (cur / dur) * 100));
                    }}
                    onEnded={handleNextStory}
                    onPlay={() => setIsStoryPaused(false)}
                    onPause={() => setIsStoryPaused(true)}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Story"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                )}

                {/* Pause Indicator overlay if paused */}
                {isStoryPaused && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/25">
                    <div className="p-4 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20">
                      <Pause className="w-8 h-8 fill-current" />
                    </div>
                  </div>
                )}
              </div>

              {/* Story Caption (if provided) */}
              {currentStory.caption && (
                <div className="p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                  <p className="text-xs sm:text-sm font-semibold text-white text-center">
                    {currentStory.caption}
                  </p>
                </div>
              )}

              {/* Small Story Ad Banner (Loads on all stories; monetized owner earns impression & click revenue) */}
              <div
                className="w-full bg-[#121824]/95 border-t border-slate-800 p-2.5 flex items-center justify-between gap-2 z-40 backdrop-blur-md cursor-pointer select-none"
                onClick={handleStoryAdClick}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded">Sponsored Ad</span>
                      <span className="text-xs font-bold text-white truncate">Benix Super App • Kigali</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Creator earns ad revenue per view & click
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStoryAdClick}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-extrabold shrink-0 transition shadow-md"
                >
                  Learn More
                </button>
              </div>

              {/* Desktop Navigation Arrows */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                title="Previous Story"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                title="Next Story"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Create Story & Video Upload Modal */}
      {showCreateMediaModal && (
        <CreateMediaModal
          isOpen={showCreateMediaModal}
          onClose={() => setShowCreateMediaModal(false)}
          onSuccess={() => {
            setShowCreateMediaModal(false);
            loadStoriesAndVideos();
          }}
        />
      )}

      {/* App Requirement / Authentication Wizard Modal */}
      {wizardTargetKey && (
        <AppAccessWizardModal
          isOpen={!!wizardTargetKey}
          onClose={() => setWizardTargetKey(null)}
          targetAppKey={wizardTargetKey}
          onSuccess={() => setWizardTargetKey(null)}
        />
      )}

      {/* Wallet Modal */}
      {showWalletModal && (
        <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <ReferralModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
        />
      )}
    </div>
  );
};
