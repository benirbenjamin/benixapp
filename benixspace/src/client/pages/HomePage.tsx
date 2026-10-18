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

  // Stories & Creator Media State
  const [stories, setStories] = useState<any[]>([]);
  const [creatorVideos, setCreatorVideos] = useState<any[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showCreateMediaModal, setShowCreateMediaModal] = useState<boolean>(false);

  // Modals state
  const [wizardTargetKey, setWizardTargetKey] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);

  const loadStoriesAndVideos = async () => {
    try {
      const [storyRes, vidRes] = await Promise.all([
        fetch('/api/stories').catch(() => null),
        fetch('/api/videos').catch(() => null)
      ]);
      if (storyRes && storyRes.ok) {
        const sData = await storyRes.json();
        setStories(sData.stories || []);
      }
      if (vidRes && vidRes.ok) {
        const vData = await vidRes.json();
        setCreatorVideos(vData.videos || []);
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

            {/* Fallback sample stories if empty */}
            {stories.length === 0 && (
              <div className="flex items-center gap-3">
                {[
                  { name: 'Kigali Live', img: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=300' },
                  { name: 'Choir Fest', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' },
                  { name: 'Sports 250', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300' }
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 opacity-60">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-slate-800">
                      <div className="w-full h-full rounded-full border-2 border-[#0B0E14] overflow-hidden">
                        <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==========================================
            2. MODULE SHORTCUTS (Quick Access Strip)
           ========================================== */}
        <section className="bg-[#121824]/60 p-4 sm:p-5 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-sm">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
            {[
              { id: 'tv', name: 'Watch TV', icon: Tv, route: '/tv', color: 'from-blue-600 to-indigo-600' },
              { id: 'radio', name: 'Live Radio', icon: Radio, route: '/radio', color: 'from-purple-600 to-pink-600' },
              { id: 'kunda', name: 'Kunda Dating', icon: Heart, route: '/dating', color: 'from-rose-500 to-pink-600' },
              { id: 'voxify', name: 'Voxify Music', icon: Music, route: '/music', color: 'from-emerald-500 to-teal-600' },
              { id: 'marketplace', name: 'Marketplace', icon: ShoppingBag, route: '/marketplace', color: 'from-amber-500 to-orange-600' },
              { id: 'games', name: 'RollDice', icon: Gamepad2, route: '/games', color: 'from-violet-600 to-indigo-700' },
              { id: 'calc', name: 'EasyCalc', icon: Calculator, route: '/calculators', color: 'from-teal-500 to-cyan-600' },
              { id: 'tv', name: 'Articles', icon: FileText, route: '/blog', color: 'from-slate-700 to-slate-800' }
            ].map((m, idx) => {
              const Icon = m.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleProtectedAccess(m.id, m.route)}
                  className="flex flex-col items-center gap-2 group p-2 rounded-2xl hover:bg-slate-800/40 transition-all active:scale-95"
                >
                  <div
                    className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white shadow-lg shadow-black/40 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white text-center truncate w-full">
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ==========================================
            3. HERO BANNER (Watch TV & Live Channels)
           ========================================== */}
        <section className="relative rounded-3xl bg-gradient-to-r from-[#141B2D] via-[#101726] to-[#0D121F] border border-slate-800/90 overflow-hidden shadow-2xl p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Featured Live Broadcast</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Watch TV & Live Channels
              </h1>
              <p className="text-sm text-slate-300 max-w-lg font-medium leading-relaxed">
                Stream 17 Rwandan TV stations and 19 Radio FM frequencies live. Enjoy seamless background audio and movable Picture-in-Picture mode across all pages.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    playTvChannel(featuredTv);
                    navigate('/tv');
                  }}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-blue-600/30 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Watch {featuredTv.name}</span>
                </button>

                <button
                  onClick={() => {
                    if (radioStations.length > 0) playStation(radioStations[0]);
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/80 flex items-center gap-2 transition-all"
                >
                  <Radio className="w-4 h-4 text-purple-400" />
                  <span>Tune Radio (Background)</span>
                </button>
              </div>
            </div>

            <div className="md:col-span-5 relative flex justify-center">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl group cursor-pointer"
                onClick={() => {
                  playTvChannel(featuredTv);
                  navigate('/tv');
                }}
              >
                <img
                  src={featuredTv.logo_url || 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800'}
                  alt={featuredTv.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
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
            6. CREATOR VIDEOS & COMMUNITY UPLOADS
           ========================================== */}
        {creatorVideos.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-rose-400" />
                  Creator Videos & Community Broadcasts
                </h2>
                <p className="text-xs text-slate-400">User uploaded content with multi-account Google Drive storage & creator monetization.</p>
              </div>
              <button
                onClick={() => {
                  if (!user) setWizardTargetKey('tv');
                  else setShowCreateMediaModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Video</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {creatorVideos.map((vid: any) => (
                <div
                  key={vid.id}
                  className="rounded-2xl bg-[#121824] border border-slate-800 overflow-hidden shadow-lg p-3 space-y-2 group"
                >
                  <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden">
                    <video src={vid.videoUrl} className="w-full h-full object-cover" preload="metadata" />
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        vid.isPaid ? 'bg-amber-500 text-black' : 'bg-emerald-600 text-white'
                      }`}>
                        {vid.isPaid ? `${vid.price.toLocaleString()} RWF` : 'Free'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{vid.title}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{vid.authorName} • {vid.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
