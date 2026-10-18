import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchTvStations,
  fetchRadioStations,
  fetchVideos,
  type Station,
  type VideoItem
} from '../services/mediaService';
import { AppAccessWizardModal } from '../components/modals/AppAccessWizardModal';
import { BenixPlayerModal } from '../components/modals/BenixPlayerModal';
import { WalletModal } from '../components/modals/WalletModal';
import { ReferralModal } from '../components/modals/ReferralModal';
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
  BookOpen,
  FileText,
  Radio,
  Sparkles,
  ShieldCheck,
  Send,
  PlusCircle,
  Clock,
  History
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, wallet, hasAppProfile } = useAuth();

  const [tvStations, setTvStations] = useState<Station[]>([]);
  const [radioStations, setRadioStations] = useState<Station[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [activePlayerStation, setActivePlayerStation] = useState<Station | null>(null);
  const [wizardTargetKey, setWizardTargetKey] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [tv, radio, vids] = await Promise.all([
          fetchTvStations(),
          fetchRadioStations(),
          fetchVideos()
        ]);
        setTvStations(tv);
        setRadioStations(radio);
        setVideos(vids);
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

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-24 font-sans selection:bg-blue-600 selection:text-white">
      <SeoHead
        title="Benix.Space — All in One. For Everyone."
        description="Benix.Space Super-App: Watch live TV channels, 24/7 radio stations, verified Kunda dating, Voxify music, and digital marketplace."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 space-y-7">
        
        {/* ==========================================
            1. MODULE SHORTCUTS (Quick Access Strip)
           ========================================== */}
        <section>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-2">
            {[
              {
                id: 'tv',
                name: 'Watch TV',
                icon: Tv,
                route: '/tv',
                color: 'from-blue-600 to-indigo-600'
              },
              {
                id: 'tv',
                name: 'Videos',
                icon: Play,
                route: '/tv',
                color: 'from-rose-600 to-red-600'
              },
              {
                id: 'voxify',
                name: 'Music',
                icon: Music,
                route: '/music',
                color: 'from-emerald-500 to-teal-600'
              },
              {
                id: 'kunda',
                name: 'Kunda Space',
                icon: Heart,
                route: '/dating',
                color: 'from-pink-500 to-rose-600'
              },
              {
                id: 'calc',
                name: 'Jobs',
                icon: Briefcase,
                route: '/projects',
                color: 'from-sky-500 to-blue-600'
              },
              {
                id: 'marketplace',
                name: 'Marketplace',
                icon: ShoppingBag,
                route: '/marketplace',
                color: 'from-amber-500 to-orange-600'
              },
              {
                id: 'games',
                name: 'Games',
                icon: Gamepad2,
                route: '/games',
                color: 'from-purple-600 to-violet-700'
              },
              {
                id: 'radio',
                name: 'More',
                icon: MoreHorizontal,
                route: '/dashboard',
                color: 'from-slate-700 to-slate-800'
              }
            ].map((m, idx) => {
              const Icon = m.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleProtectedAccess(m.id, m.route)}
                  className="flex flex-col items-center gap-1.5 group p-1 transition-transform active:scale-95"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white shadow-lg shadow-black/40 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 group-hover:text-white text-center truncate w-full">
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>


        {/* ==========================================
            2. HERO BANNER (Watch TV & Live Channels)
           ========================================== */}
        <section className="relative rounded-3xl bg-gradient-to-r from-[#141B2D] via-[#101726] to-[#0D121F] border border-slate-800/90 overflow-hidden shadow-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Featured Broadcast
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Watch TV & Live Channels
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md font-medium leading-relaxed">
                Live News, Sports, Movies, and Entertainment 24/7. Stream Rwanda Television and international stations directly from the database.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setActivePlayerStation(featuredTv)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-blue-600/30 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Watch Now</span>
                </button>

                <button
                  onClick={() => handleProtectedAccess('tv', '/tv')}
                  className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700/60 transition-colors"
                >
                  All Channels ({tvStations.length || 17})
                </button>
              </div>
            </div>

            {/* TV Screen Mockup with Live Badge */}
            <div className="md:col-span-5 relative">
              <div
                onClick={() => setActivePlayerStation(featuredTv)}
                className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl group cursor-pointer aspect-video bg-black"
              >
                <img
                  src="https://images.unsplash.com/photo-1593784991095-a205069470b6?w=700&auto=format&fit=crop&q=80"
                  alt="Live TV Broadcast"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                
                {/* Live Badge */}
                <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Live
                </span>

                {/* Station Info Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-white drop-shadow-md">{featuredTv.name}</h4>
                    <p className="text-[10px] text-slate-300">{featuredTv.frequency || 'Live HLS Feed'}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Featured Stream Sponsor Ad Banner */}
        <div className="max-w-5xl mx-auto">
          <CompanionAdBanner label="Featured Broadcast Partner" />
        </div>

        {/* ==========================================
            3. CONTINUE WATCHING (Resume Streams)
           ========================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Continue Watching</h2>
              <p className="text-[11px] text-slate-400">Resume your recently watched videos, shows or live events.</p>
            </div>
            <Link to="/tv" className="text-xs font-bold text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                title: 'RTV Tele-Amakuru',
                subtitle: 'S3 • E7',
                time: '45:30',
                station: tvStations.find(s => s.slug === 'rtv') || featuredTv,
                img: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=80'
              },
              {
                title: 'KC2 Sports League',
                subtitle: 'Semi Final',
                time: '1:15:10',
                station: tvStations.find(s => s.slug === 'kc2') || featuredTv,
                img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80'
              },
              {
                title: 'Isibo TV Entertainment',
                subtitle: 'Live Studio',
                time: 'Live',
                station: tvStations.find(s => s.slug === 'isibo-tv') || featuredTv,
                img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80'
              },
              {
                title: 'Rwanda Today Highlights',
                subtitle: 'Documentary',
                time: '28:15',
                station: tvStations.find(s => s.slug === 'btn-tv') || featuredTv,
                img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=80'
              }
            ].map((v, i) => (
              <div
                key={i}
                onClick={() => setActivePlayerStation(v.station)}
                className="group relative rounded-2xl bg-[#121824] border border-slate-800/80 overflow-hidden cursor-pointer hover:border-slate-700 transition-all shadow-md"
              >
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={v.img}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-black">
                    {v.time}
                  </span>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3 space-y-0.5">
                  <h4 className="text-xs font-black text-white truncate">{v.title}</h4>
                  <p className="text-[10px] text-slate-400">{v.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* ==========================================
            4. RECOMMENDED FOR YOU (Personalized)
           ========================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Recommended For You</h2>
              <p className="text-[11px] text-slate-400">Personalized suggestions based on your activity and preferences.</p>
            </div>
            <button
              onClick={() => handleProtectedAccess('tv', '/tv')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                title: 'Kiss FM 102.3 Kigali',
                cat: 'Live Radio Hits',
                rating: '4.9',
                station: radioStations.find(s => s.slug === 'kiss-fm') || radioStations[0],
                badge: 'Popular',
                img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&auto=format&fit=crop&q=80'
              },
              {
                title: 'Kigali Wave Music Awards',
                cat: 'Music Album',
                rating: '4.8',
                station: radioStations.find(s => s.slug === 'kigali-wave') || radioStations[1],
                badge: 'Hot',
                img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'
              },
              {
                title: 'Tech & Career Hub',
                cat: 'Jobs near you',
                rating: '4.7',
                badge: 'New',
                route: '/projects',
                appKey: 'calc',
                img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=80'
              },
              {
                title: 'Benix Marketplace Deals',
                cat: 'Best Deals',
                rating: '4.8',
                badge: 'Featured',
                route: '/marketplace',
                appKey: 'marketplace',
                img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&auto=format&fit=crop&q=80'
              }
            ].map((r, i) => (
              <div
                key={i}
                onClick={() => {
                  if (r.station) {
                    setActivePlayerStation(r.station);
                  } else if (r.appKey && r.route) {
                    handleProtectedAccess(r.appKey, r.route);
                  }
                }}
                className="group relative rounded-2xl bg-[#121824] border border-slate-800/80 overflow-hidden cursor-pointer hover:border-slate-700 transition-all shadow-md p-3 flex flex-col justify-between"
              >
                <div className="relative aspect-square rounded-xl bg-slate-900 overflow-hidden mb-2">
                  <img src={r.img} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase">
                    {r.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-black text-white truncate">{r.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{r.cat}</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold shrink-0">
                      <Star className="w-3 h-3 fill-current" />
                      {r.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* ==========================================
            5. TRENDING NOW (Ranked List 1, 2, 3, 4)
           ========================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 fill-current" />
                Trending Now
              </h2>
              <p className="text-[11px] text-slate-400">What's hot right now across videos, music, news, and more.</p>
            </div>
            <Link to="/tv" className="text-xs font-bold text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                rank: 1,
                title: 'RTV Tele-Amakuru Special Edition',
                cat: 'News & National',
                station: tvStations.find(s => s.slug === 'rtv') || featuredTv,
                badgeBg: 'bg-amber-500 text-black'
              },
              {
                rank: 2,
                title: 'Rwanda Premier League Match Highlights',
                cat: 'Sports & Live',
                station: tvStations.find(s => s.slug === 'kc2') || featuredTv,
                badgeBg: 'bg-slate-300 text-slate-900'
              },
              {
                rank: 3,
                title: 'Kigali Wave Urban Hits & Afrobeats',
                cat: 'Radio & Music',
                station: radioStations.find(s => s.slug === 'kigali-wave') || radioStations[0],
                badgeBg: 'bg-amber-700 text-white'
              },
              {
                rank: 4,
                title: 'Benix Space Digital Tech Innovations',
                cat: 'Technology & Business',
                station: featuredTv,
                badgeBg: 'bg-blue-600 text-white'
              }
            ].map((item) => (
              <div
                key={item.rank}
                onClick={() => {
                  if (item.station) setActivePlayerStation(item.station);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#121824] border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
              >
                <div className={`w-8 h-8 rounded-full ${item.badgeBg} flex items-center justify-center font-black text-xs shrink-0 shadow-md`}>
                  {item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                  <p className="text-[10px] text-slate-400">{item.cat}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* ==========================================
            6. QUICK ACCESS CARDS (Kunda Space + Central Wallet)
           ========================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Kunda Space */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C1625] via-[#161220] to-[#120F1A] border border-rose-900/40 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/20 inline-flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
                Kunda Space
              </span>
              <h3 className="text-base font-extrabold text-white">
                Meet amazing people who share your interests
              </h3>
              <p className="text-xs text-slate-400">
                Verified dating, safe messaging, and meaningful connections designed for Rwanda and East Africa.
              </p>
            </div>

            <button
              onClick={() => handleProtectedAccess('kunda', '/dating')}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Explore Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Central Wallet Balance */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0F1E24] via-[#0C171C] to-[#0A1217] border border-emerald-900/40 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  Wallet Balance
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Bonus: 100 RWF
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400">Your Available Balance</span>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                  {wallet ? Number(wallet.balance).toLocaleString() : '100.00'} <span className="text-sm font-bold text-emerald-400">{wallet?.currency || 'RWF'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  if (!user) setWizardTargetKey('calc');
                  else setShowWalletModal(true);
                }}
                className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md text-center"
              >
                Top Up
              </button>
              <button
                onClick={() => {
                  if (!user) setWizardTargetKey('calc');
                  else setShowWalletModal(true);
                }}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors text-center"
              >
                Transfer
              </button>
              <button
                onClick={() => {
                  if (!user) setWizardTargetKey('calc');
                  else navigate('/dashboard#wallet');
                }}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors text-center"
              >
                History
              </button>
            </div>
          </div>

        </section>


        {/* ==========================================
            7. EXPLORE MORE (Mini-Apps Grid)
           ========================================== */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">Explore More</h2>
            <p className="text-[11px] text-slate-400">Discover more mini apps and useful features in the platform.</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
            {[
              { name: 'Articles', icon: FileText, route: '/blog', color: 'bg-blue-500/15 text-blue-400', appKey: 'tv' },
              { name: 'Live Radio', icon: Radio, route: '/radio', color: 'bg-rose-500/15 text-rose-400', appKey: 'radio' },
              { name: 'eBooks', icon: BookOpen, route: '/marketplace', color: 'bg-emerald-500/15 text-emerald-400', appKey: 'marketplace' },
              { name: 'Shorts', icon: Play, route: '/tv', color: 'bg-purple-500/15 text-purple-400', appKey: 'tv' },
              { name: 'Business', icon: Briefcase, route: '/services', color: 'bg-amber-500/15 text-amber-400', appKey: 'calc' },
              { name: 'Services', icon: Sparkles, route: '/services', color: 'bg-cyan-500/15 text-cyan-400', appKey: 'calc' },
              { name: 'More', icon: MoreHorizontal, route: '/dashboard', color: 'bg-slate-800 text-slate-400', appKey: 'tv' }
            ].map((app, i) => {
              const Icon = app.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleProtectedAccess(app.appKey, app.route)}
                  className="p-3 rounded-2xl bg-[#121824] border border-slate-800/80 hover:border-slate-700 flex flex-col items-center justify-center gap-2 group transition-all"
                >
                  <div className={`p-2.5 rounded-xl ${app.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate w-full text-center">
                    {app.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>


        {/* ==========================================
            8. REFERRAL BANNER (Invite Friends & Earn Rewards)
           ========================================== */}
        <section className="relative rounded-3xl bg-gradient-to-r from-violet-950/80 via-purple-900/60 to-indigo-950/80 border border-purple-800/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="p-3.5 rounded-2xl bg-purple-500/20 text-purple-300 shrink-0 border border-purple-500/30">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Invite Friends & Earn Rewards</h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Get up to <span className="font-extrabold text-amber-300">$10</span> (or 10,000 RWF) for every friend who joins Benix.Space.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!user) setWizardTargetKey('calc');
              else setShowReferralModal(true);
            }}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 shrink-0 transition-all active:scale-95"
          >
            Invite Now
          </button>
        </section>

      </div>

      {/* Global Real Media Player Modal */}
      {activePlayerStation && (
        <BenixPlayerModal
          station={activePlayerStation}
          onClose={() => setActivePlayerStation(null)}
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
