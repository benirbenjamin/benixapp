import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import {
  fetchTvStations,
  fetchRadioStations,
  type Station,
  type VideoItem
} from '../services/mediaService';
import { AppAccessWizardModal } from '../components/modals/AppAccessWizardModal';
import { WalletModal } from '../components/modals/WalletModal';
import { ReferralModal } from '../components/modals/ReferralModal';
import { CreateMediaModal } from '../components/modals/CreateMediaModal';
import { CompanionAdBanner } from '../components/ads/CompanionAdBanner';
import { SeoHead } from '../components/common/SeoHead';
import realVideosData from '../config/realVideos.json';
import {
  Tv,
  Play,
  Music,
  Heart,
  Briefcase,
  ShoppingBag,
  Gamepad2,
  MoreHorizontal,
  Star,
  Flame,
  ArrowRight,
  Wallet,
  Gift,
  FileText,
  Radio,
  Sparkles,
  ShieldCheck,
  Send,
  PlusCircle,
  Plus,
  Clock,
  History,
  Calculator,
  Film,
  Eye,
  X,
  Volume2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, wallet, hasAppProfile } = useAuth();
  const { playStation, playTvChannel } = usePlayer();

  const [tvStations, setTvStations] = useState<Station[]>([]);
  const [radioStations, setRadioStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Stories & Creator Media State (populated with real YouTube catalogue videos)
  const [stories, setStories] = useState<any[]>([]);
  const [creatorVideos, setCreatorVideos] = useState<any[]>(() => (realVideosData as any[]).slice(0, 8));
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showCreateMediaModal, setShowCreateMediaModal] = useState<boolean>(false);

  // Auto Slider Carousel State
  const [currentHeroSlide, setCurrentHeroSlide] = useState<number>(0);

  // Modals state
  const [wizardTargetKey, setWizardTargetKey] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);

  const loadStoriesAndVideos = async () => {
    try {
      const [storyRes, vidRes] = await Promise.all([
        fetch('/api/stories').catch(() => null),
        fetch('/api/modules/videos').catch(() => fetch('/api/videos').catch(() => null))
      ]);
      if (storyRes && storyRes.ok) {
        const sData = await storyRes.json();
        if (sData.stories && sData.stories.length > 0) {
          setStories(sData.stories);
        }
      }
      if (vidRes && vidRes.ok) {
        const vData = await vidRes.json();
        if (vData.videos && Array.isArray(vData.videos) && vData.videos.length > 0) {
          setCreatorVideos(vData.videos.slice(0, 8));
        }
      }
    } catch (err) {
      console.warn('Stories/Videos load error:', err);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [tv, radio] = await Promise.all([
          fetchTvStations(),
          fetchRadioStations()
        ]);
        setTvStations(tv);
        setRadioStations(radio);
        await loadStoriesAndVideos();
      } catch (e) {
        console.error('Failed to load media stations:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  const featuredTv = tvStations[0] || {
    id: 'rtv',
    name: 'RTV Live',
    slug: 'rtv',
    description: "Rwanda Television (RTV) is Rwanda's public service television broadcaster.",
    stream_url: 'https://5c46fa289c89f.streamlock.net/rtv25/rtv/playlist.m3u8',
    stream_type: 'HLS',
    station_type: 'TV'
  };

  // Story progress auto-advance
  useEffect(() => {
    if (activeStoryIndex === null || stories.length === 0) return;
    const timer = setTimeout(() => {
      if (activeStoryIndex < stories.length - 1) {
        setActiveStoryIndex((prev) => (prev !== null ? prev + 1 : null));
      } else {
        setActiveStoryIndex(null);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeStoryIndex, stories.length]);

  // Auto Slider Timer: Auto-advance every 5 seconds
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, []);

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-28 font-sans selection:bg-blue-600 selection:text-white">
      <SeoHead
        title="Benix.Space — All in One. For Everyone."
        description="Benix.Space Super-App: Watch live TV channels, 24/7 radio stations, stories, verified Kunda dating, Voxify music, EasyCalc, and digital marketplace."
      />

      {/* FULL WIDTH CONTAINER: max-w-[1720px] */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-8">
        
        {/* ==========================================
            1. STORIES & CREATOR REEL BAR
           ========================================== */}
        <section className="relative">
          <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none">
            
            {/* Create Story / Upload Button */}
            <button
              onClick={() => {
                if (!user) setWizardTargetKey('tv');
                else setShowCreateMediaModal(true);
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-blue-500 hover:border-blue-400 bg-blue-600/10 flex flex-col items-center justify-center transition-all group-hover:scale-105 group-hover:bg-blue-600/20 shadow-lg">
                <Plus className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
              </div>
              <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">
                Add Story
              </span>
            </button>

            {/* Active User Stories List */}
            {stories.map((story, idx) => (
              <button
                key={story.id || idx}
                onClick={() => setActiveStoryIndex(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0 group transition-transform active:scale-95"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform shadow-lg shadow-purple-900/30">
                  <div className="w-full h-full rounded-full border-2 border-[#0B0E14] overflow-hidden bg-slate-900">
                    <img
                      src={story.authorAvatar || story.mediaUrl}
                      alt={story.authorName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-300 group-hover:text-white truncate max-w-[70px] text-center">
                  {story.authorName}
                </span>
              </button>
            ))}

            {/* Clean empty state when no stories in DB */}
            {stories.length === 0 && (
              <div className="flex items-center gap-2 pl-3 py-2 text-xs text-slate-400">
                <span>No active stories right now. Click "Add Story" to share yours!</span>
              </div>
            )}
          </div>
        </section>

        {/* ==========================================
            2. MODULE SHORTCUTS (Horizontal Scroll Strip - Full Labels Without Truncation)
           ========================================== */}
        <section className="bg-[#121824]/80 p-3 sm:p-5 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                Ecosystem Platforms & Services
              </span>
            </div>
            <span className="text-[10px] text-blue-400 font-bold sm:hidden">
              Scroll Left/Right →
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none scroll-smooth">
            {[
              { id: 'videos', name: 'Creator Videos', badge: 'Shows', icon: Film, route: '/videos', color: 'from-purple-600 to-indigo-600' },
              { id: 'tv', name: 'Watch TV', badge: '17 CH', icon: Tv, route: '/tv', color: 'from-blue-600 to-indigo-600' },
              { id: 'radio', name: 'Live Radio', badge: '19 FM', icon: Radio, route: '/radio', color: 'from-purple-600 to-pink-600' },
              { id: 'kunda', name: 'Kunda Dating', badge: 'Singles', icon: Heart, route: '/dating', color: 'from-rose-500 to-pink-600' },
              { id: 'voxify', name: 'Voxify Music', badge: 'Choir', icon: Music, route: '/music', color: 'from-emerald-500 to-teal-600' },
              { id: 'marketplace', name: 'Marketplace', badge: 'Shop', icon: ShoppingBag, route: '/marketplace', color: 'from-amber-500 to-orange-600' },
              { id: 'games', name: 'RollDice Arena', badge: 'Win 1.9x', icon: Gamepad2, route: '/games', color: 'from-violet-600 to-indigo-700' },
              { id: 'calc', name: 'EasyCalc Pro', badge: 'Tax & Loan', icon: Calculator, route: '/calculators', color: 'from-teal-500 to-cyan-600' },
              { id: 'blog', name: 'News & Blog', badge: 'Articles', icon: FileText, route: '/blog', color: 'from-slate-700 to-slate-800' }
            ].map((m, idx) => {
              const Icon = m.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleProtectedAccess(m.id, m.route)}
                  className="flex flex-col items-center gap-2 shrink-0 p-2 sm:p-3 rounded-2xl hover:bg-slate-800/60 transition-all active:scale-95 group/app min-w-[82px] sm:min-w-[105px]"
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white shadow-lg shadow-black/40 group-hover/app:scale-105 transition-transform relative`}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-[#0B0E14] border border-white/20 text-[8px] font-black text-white">
                      {m.badge}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-200 group-hover/app:text-white text-center whitespace-nowrap">
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ==========================================
            3. FEATURED AUTO-SLIDER HERO CAROUSEL
           ========================================== */}
        <section className="relative rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl transition-all">
          
          {/* SLIDE 0: LIVE TV */}
          {currentHeroSlide === 0 && (
            <div className="bg-gradient-to-r from-[#141B2D] via-[#101726] to-[#0D121F] p-6 sm:p-10 transition-all">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>Live Rwandan Television (17 Channels)</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    Watch TV & Live Channels
                  </h1>
                  <p className="text-sm text-slate-300 max-w-lg font-medium leading-relaxed">
                    Stream RTV, KC2, BTN TV, TV10, Isibo TV, and Africa 24 live with low-latency adaptive HLS feeds and movable Picture-in-Picture mode across all pages.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => { playTvChannel(featuredTv); navigate('/tv'); }}
                      className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-blue-600/30 transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Watch {featuredTv.name}</span>
                    </button>
                    <button
                      onClick={() => navigate('/tv')}
                      className="px-6 py-3.5 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/80 transition-all"
                    >
                      Explore All TV Stations
                    </button>
                  </div>
                </div>
                <div className="md:col-span-5 relative flex justify-center cursor-pointer" onClick={() => { playTvChannel(featuredTv); navigate('/tv'); }}>
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl group">
                    <img src={featuredTv.logo_url || '/logo.png'} alt="Live TV" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
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
            </div>
          )}

          {/* SLIDE 1: KUNDA DATING */}
          {currentHeroSlide === 1 && (
            <div className="bg-gradient-to-r from-[#2D0F1E] via-[#200A15] to-[#0D121F] p-6 sm:p-10 transition-all">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>Verified Rwandan Matchmaking</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    Kunda Space Dating
                  </h1>
                  <p className="text-sm text-slate-300 max-w-lg font-medium leading-relaxed">
                    Find serious relationships and meaningful companions in Kigali and across Rwanda. Send crushes, enjoy private chats, and unlock verified contacts securely.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => navigate('/dating')}
                      className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-rose-600/30 transition-all active:scale-95"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                      <span>Explore Verified Matches</span>
                    </button>
                    <button
                      onClick={() => navigate('/messages')}
                      className="px-6 py-3.5 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/80 transition-all"
                    >
                      Open Private Chat
                    </button>
                  </div>
                </div>
                <div className="md:col-span-5 relative flex justify-center cursor-pointer" onClick={() => navigate('/dating')}>
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-rose-500/30 shadow-2xl group">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80" alt="Kunda Dating" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">100% VERIFIED</span>
                        <h3 className="font-black text-white text-sm mt-1">Aline M. (Kigali, Kacyiru)</h3>
                        <p className="text-[11px] text-rose-300">Software Designer • Online Now</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: LIVE RADIO */}
          {currentHeroSlide === 2 && (
            <div className="bg-gradient-to-r from-[#17122B] via-[#100C1F] to-[#0D121F] p-6 sm:p-10 transition-all">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold">
                    <Radio className="w-3.5 h-3.5" />
                    <span>19 Rwandan FM Radio Frequencies</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    24/7 Live Radio FM
                  </h1>
                  <p className="text-sm text-slate-300 max-w-lg font-medium leading-relaxed">
                    Tune into Kiss FM 102.3, Radio Rwanda 100.7 FM, Magic FM, Radio 10, Flash FM, and Royal FM with seamless background audio while you browse.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        const kiss = radioStations.find(r => r.slug.includes('kiss')) || radioStations[0];
                        if (kiss) playStation(kiss);
                        navigate('/radio');
                      }}
                      className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-purple-600/30 transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Tune Kiss FM 102.3</span>
                    </button>
                    <button
                      onClick={() => navigate('/radio')}
                      className="px-6 py-3.5 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/80 transition-all"
                    >
                      All 19 Radio Stations
                    </button>
                  </div>
                </div>
                <div className="md:col-span-5 relative flex justify-center cursor-pointer" onClick={() => navigate('/radio')}>
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl group">
                    <img src="https://i.postimg.cc/Cx2q12xV/kiss-fm.jpg" alt="Kiss FM" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black">FM BROADCAST</span>
                        <h3 className="font-black text-white text-sm mt-1">Kiss FM 102.3 Kigali</h3>
                        <p className="text-[11px] text-purple-300">The Beat of Kigali • Urban Hits</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: ROinterface DICE & WALLET */}
          {currentHeroSlide === 3 && (
            <div className="bg-gradient-to-r from-[#0F261E] via-[#0A1A14] to-[#0D121F] p-6 sm:p-10 transition-all">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>RollDice Arena & Central Wallet</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    Win 1.95x on RollDice
                  </h1>
                  <p className="text-sm text-slate-300 max-w-lg font-medium leading-relaxed">
                    Wager starting from 50 RWF and cash out instant winnings directly to your MTN Mobile Money account. Zero wait times.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => navigate('/games')}
                      className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-emerald-600/30 transition-all active:scale-95"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>Play RollDice Arena</span>
                    </button>
                    <button
                      onClick={() => navigate('/dashboard#wallet')}
                      className="px-6 py-3.5 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/80 transition-all"
                    >
                      Deposit 100 RWF (MoMo)
                    </button>
                  </div>
                </div>
                <div className="md:col-span-5 relative flex justify-center cursor-pointer" onClick={() => navigate('/games')}>
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl group">
                    <img src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80" alt="RollDice" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">INSTANT PAYOUTS</span>
                        <h3 className="font-black text-white text-sm mt-1">RollDice PVE Arena</h3>
                        <p className="text-[11px] text-emerald-300">Minimum Wager: 50 RWF</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Carousel Slide Indicators & Prev/Next Arrows */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={() => setCurrentHeroSlide((prev) => (prev === 0 ? 3 : prev - 1))}
              className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors"
              title="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {[0, 1, 2, 3].map((slide) => (
                <button
                  key={slide}
                  onClick={() => setCurrentHeroSlide(slide)}
                  className={`h-2 rounded-full transition-all ${
                    currentHeroSlide === slide ? 'w-6 bg-blue-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                  title={`Go to slide ${slide + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % 4)}
              className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors"
              title="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </section>

        {/* ==========================================
            4. LIVE TV CHANNELS (Click to Play with PiP)
           ========================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-blue-400" />
                Live Rwandan TV Stations
              </h2>
              <p className="text-xs text-slate-400">Streamed via low-latency adaptive HLS feeds. Supports movable Picture-in-Picture.</p>
            </div>
            <Link to="/tv" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <span>View All 17 TV Channels</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tvStations.slice(0, 6).map((station) => (
              <div
                key={station.id}
                onClick={() => {
                  playTvChannel(station);
                  navigate('/tv');
                }}
                className="group relative rounded-2xl bg-[#121824] border border-slate-800/80 hover:border-blue-500/50 overflow-hidden cursor-pointer transition-all shadow-md p-3 flex flex-col justify-between"
              >
                <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden mb-2.5 flex items-center justify-center">
                  <img src={station.logo_url} alt={station.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-black text-white truncate">{station.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{station.frequency || 'DTT Rwanda'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================
            5. LIVE RADIO FM FREQUENCIES (Continuous Bottom Player)
           ========================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-400" />
                Live Rwandan FM Radios
              </h2>
              <p className="text-xs text-slate-400">Plays continuously in background across all pages without interruption.</p>
            </div>
            <Link to="/radio" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">
              <span>View All 19 Radios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {radioStations.slice(0, 6).map((station) => (
              <div
                key={station.id}
                onClick={() => playStation(station)}
                className="group relative rounded-2xl bg-[#121824] border border-slate-800/80 hover:border-purple-500/50 overflow-hidden cursor-pointer transition-all shadow-md p-3 flex flex-col justify-between"
              >
                <div className="relative aspect-square rounded-xl bg-slate-900 overflow-hidden mb-2.5 flex items-center justify-center">
                  <img src={station.logo_url} alt={station.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                      <Volume2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-black uppercase">
                    FM
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-black text-white truncate">{station.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{station.frequency || 'Kigali FM'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================
            6. FEATURED CREATOR VIDEOS & SHOWS
           ========================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-400" />
                Featured Creator Videos & Shows
              </h2>
              <p className="text-xs text-slate-400">Stream exclusive choir concerts, comedy series, and cinema. Share your link to earn 15% commissions!</p>
            </div>
            <Link to="/videos" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">
              <span>View All Videos & Earn</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(creatorVideos.length > 0 ? creatorVideos : (realVideosData as any[])).slice(0, 8).map((vid) => {
              const videoId = vid.id || vid.slug;
              const title = vid.title;
              const creator = vid.channelName || vid.creator || 'Benix Space';
              const thumbnail = vid.thumbnailUrl || vid.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              const viewsCount = typeof vid.views === 'number' ? (vid.views > 999 ? `${Math.floor(vid.views / 1000)}K` : vid.views) : (vid.views || 'Verified');
              const priceLabel = Number(vid.price) > 0 ? `${Number(vid.price).toLocaleString()} RWF` : 'Free';

              return (
                <div
                  key={videoId}
                  onClick={() => navigate(`/videos/${videoId}`)}
                  className="rounded-2xl bg-[#121824] border border-slate-800/80 hover:border-purple-500/50 overflow-hidden shadow-lg p-3 space-y-2 group cursor-pointer transition-all hover:shadow-purple-950/20"
                >
                  <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden">
                    <img
                      src={thumbnail}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        priceLabel === 'Free' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-black'
                      }`}>
                        {priceLabel}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors" title={title}>
                      {title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      {creator} • {viewsCount} {typeof vid.views === 'number' && vid.views > 0 ? 'views' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ==========================================
            7. QUICK ACCESS CARDS (Kunda Space + Central Wallet)
           ========================================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Kunda Space */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C1625] via-[#161220] to-[#120F1A] border border-rose-900/40 shadow-xl flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/20 inline-flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
                Kunda Dating Space
              </span>
              <h3 className="text-xl font-black text-white">
                Meaningful Connections Across Rwanda
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Verified Rwandan singles with instant 24h/3d passes, central wallet messaging, and direct WhatsApp unlocks.
              </p>
            </div>

            <button
              onClick={() => handleProtectedAccess('kunda', '/dating')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Explore Kunda Singles</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Central Wallet Balance */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0F1E24] via-[#0C171C] to-[#0A1217] border border-emerald-900/40 shadow-xl flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  Unified Central Wallet
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  Deposit from 100 RWF
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400">Available Platform Balance</span>
                <div className="text-3xl font-black text-white tracking-tight mt-1">
                  {wallet ? Number(wallet.balance).toLocaleString() : '100.00'} <span className="text-sm font-bold text-emerald-400">{wallet?.currency || 'RWF'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  if (!user) setWizardTargetKey('calc');
                  else setShowWalletModal(true);
                }}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md text-center"
              >
                Top Up
              </button>
              <button
                onClick={() => {
                  if (!user) setWizardTargetKey('calc');
                  else setShowWalletModal(true);
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors text-center"
              >
                Withdraw
              </button>
              <button
                onClick={() => {
                  if (!user) setWizardTargetKey('calc');
                  else navigate('/dashboard#wallet');
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors text-center"
              >
                Ledger
              </button>
            </div>
          </div>

        </section>

        {/* ==========================================
            8. EXPLORE MORE (Cleaned Mini-Apps Grid - NO FAKE EBOOKS)
           ========================================== */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Explore All Applications</h2>
            <p className="text-xs text-slate-400">Direct access to verified services in the BenixSpace ecosystem.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { name: 'Live TV', icon: Tv, route: '/tv', color: 'bg-blue-500/15 text-blue-400', appKey: 'tv' },
              { name: 'Radio FM', icon: Radio, route: '/radio', color: 'bg-purple-500/15 text-purple-400', appKey: 'radio' },
              { name: 'Kunda Dating', icon: Heart, route: '/dating', color: 'bg-rose-500/15 text-rose-400', appKey: 'kunda' },
              { name: 'Voxify Choirs', icon: Music, route: '/music', color: 'bg-indigo-500/15 text-indigo-400', appKey: 'voxify' },
              { name: 'Marketplace', icon: ShoppingBag, route: '/marketplace', color: 'bg-emerald-500/15 text-emerald-400', appKey: 'marketplace' },
              { name: 'RollDice Arena', icon: Gamepad2, route: '/games', color: 'bg-amber-500/15 text-amber-400', appKey: 'games' },
              { name: 'EasyCalc Pro', icon: Calculator, route: '/calculators', color: 'bg-teal-500/15 text-teal-400', appKey: 'calc' },
              { name: 'Articles & Blog', icon: FileText, route: '/blog', color: 'bg-sky-500/15 text-sky-400', appKey: 'tv' }
            ].map((app, i) => {
              const Icon = app.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleProtectedAccess(app.appKey, app.route)}
                  className="p-4 rounded-2xl bg-[#121824] border border-slate-800/80 hover:border-slate-700 flex flex-col items-center justify-center gap-2.5 group transition-all"
                >
                  <div className={`p-3 rounded-2xl ${app.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white truncate w-full text-center">
                    {app.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ==========================================
            9. REFERRAL BANNER (Invite Friends & Earn Rewards)
           ========================================== */}
        <section className="relative rounded-3xl bg-gradient-to-r from-violet-950/80 via-purple-900/60 to-indigo-950/80 border border-purple-800/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="p-3.5 rounded-2xl bg-purple-500/20 text-purple-300 shrink-0 border border-purple-500/30">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Invite Friends & Earn Wallet Rewards</h3>
              <p className="text-xs sm:text-sm text-purple-200 mt-1">
                Share your personal code and earn 1,000 RWF for every active friend joining Benix.Space.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!user) setWizardTargetKey('calc');
              else setShowReferralModal(true);
            }}
            className="px-7 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 shrink-0 transition-all active:scale-95"
          >
            Open Referral Portal
          </button>
        </section>

      </div>

      {/* ==================== FULL-SCREEN STORY VIEWER MODAL ==================== */}
      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full aspect-[9/16] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col justify-between">
            
            {/* Top Bar with Auto-Advance Progress */}
            <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent space-y-2">
              <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                <div className="bg-white h-full animate-[progress_6s_linear]" />
              </div>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <img
                    src={stories[activeStoryIndex].authorAvatar || stories[activeStoryIndex].mediaUrl}
                    alt={stories[activeStoryIndex].authorName}
                    className="w-7 h-7 rounded-full object-cover border border-white/40"
                  />
                  <div>
                    <span className="text-xs font-bold block">{stories[activeStoryIndex].authorName}</span>
                    <span className="text-[10px] text-slate-300">{stories[activeStoryIndex].timestamp || '2h ago'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStoryIndex(null)}
                  className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Story Media (Image or Video) */}
            <div className="w-full h-full">
              <img
                src={stories[activeStoryIndex].mediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Caption & Controls */}
            {stories[activeStoryIndex].caption && (
              <div className="absolute bottom-0 inset-x-0 z-20 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {stories[activeStoryIndex].caption}
                </p>
              </div>
            )}

            {/* Left / Right Nav Taps */}
            <button
              onClick={() => setActiveStoryIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : null))}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveStoryIndex((prev) => (prev !== null && prev < stories.length - 1 ? prev + 1 : null))}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

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
