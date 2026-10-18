import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchTvStations, type Station } from '../../services/mediaService';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { BenixPlayerModal } from '../../components/modals/BenixPlayerModal';
import { SeoHead } from '../../components/common/SeoHead';
import {
  Tv,
  Play,
  Search,
  Sparkles,
  Radio,
  Eye,
  ShieldCheck,
  Heart,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  Globe,
  Film
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Channels' },
  { id: 'rwanda', label: 'Rwanda National' },
  { id: 'news', label: 'News & Info' },
  { id: 'entertainment', label: 'Entertainment & Music' },
  { id: 'international', label: 'International Live' }
];

export const TvPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasAppProfile } = useAuth();

  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modals
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [wizardTarget, setWizardTarget] = useState<string | null>(null);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('benix_fav_tv') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    async function load() {
      try {
        const tvData = await fetchTvStations();
        setStations(tvData);
      } catch (err) {
        console.error('Error loading TV stations:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleFavorite = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    if (!user) {
      setWizardTarget('tv');
      return;
    }
    setFavoriteSlugs((prev) => {
      const updated = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem('benix_fav_tv', JSON.stringify(updated));
      return updated;
    });
  };

  const handlePlayStation = (station: Station) => {
    // Check if user is logged in and has TV profile filled
    if (!user) {
      // Allow preview or prompt login
      setActiveStation(station);
    } else if (!hasAppProfile('tv')) {
      setWizardTarget('tv');
    } else {
      setActiveStation(station);
    }
  };

  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (station.description && station.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (station.location && station.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'rwanda') {
      return station.location?.toLowerCase().includes('rwanda') || station.slug.includes('rtv') || station.slug.includes('kc2') || station.slug.includes('btn') || station.slug.includes('tv10') || station.slug.includes('isibo');
    }
    if (selectedCategory === 'news') {
      return station.name.toLowerCase().includes('news') || station.description?.toLowerCase().includes('news') || station.slug.includes('rtv') || station.slug.includes('cbs') || station.slug.includes('france24');
    }
    if (selectedCategory === 'entertainment') {
      return station.description?.toLowerCase().includes('entertainment') || station.description?.toLowerCase().includes('music') || station.slug.includes('isibo') || station.slug.includes('tv1');
    }
    if (selectedCategory === 'international') {
      return station.location?.toLowerCase().includes('france') || station.location?.toLowerCase().includes('usa') || station.slug.includes('cbs') || station.slug.includes('france24') || station.slug.includes('africa24');
    }
    return true;
  });

  const featuredStation = stations[0] || {
    id: 'rtv',
    name: 'RTV Live',
    slug: 'rtv',
    description: "Rwanda Television (RTV) is Rwanda's premier public service broadcaster streaming 24/7 in HD.",
    stream_url: 'https://5c46fa289c89f.streamlock.net/rtv25/rtv/playlist.m3u8',
    stream_type: 'HLS',
    station_type: 'TV',
    logo_url: 'https://i.postimg.cc/k47vB4L2/rtv.png'
  };

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-24 font-sans selection:bg-blue-600 selection:text-white">
      <SeoHead
        title="Live TV Broadcasts & Channels — BenixSpace"
        description="Stream official live television channels in Rwanda and globally. Watch RTV, KC2, BTN, TV10, Isibo TV, France 24, and CBS News in high definition."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Top Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#121926] via-[#0e1422] to-[#0B0E14] shadow-2xl p-6 sm:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-lg shadow-red-600/30">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Live Broadcast
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  HLS Full HD Stream
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  {stations.length} Active Channels
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Watch Live TV Channels <br />
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                  Anytime, Anywhere on BenixSpace
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Enjoy real-time streaming directly from public broadcasting feeds without delay. Clean audio, zero YouTube embeds, and direct low-latency HLS video.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handlePlayStation(featuredStation)}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center gap-2.5 transition-all transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch {featuredStation.name} Now
                </button>
                <button
                  onClick={() => navigate('/radio')}
                  className="px-5 py-3.5 rounded-2xl bg-[#1A2234] hover:bg-[#222c42] text-slate-200 font-semibold text-sm border border-slate-700/60 flex items-center gap-2 transition-all"
                >
                  <Radio className="w-4 h-4 text-purple-400" />
                  Switch to Live Radio
                </button>
              </div>
            </div>

            {/* Featured Channel Card Preview */}
            <div
              onClick={() => handlePlayStation(featuredStation)}
              className="w-full md:w-80 p-5 rounded-2xl bg-[#161F30]/90 border border-slate-700/70 shadow-2xl backdrop-blur-md cursor-pointer hover:border-blue-500/60 group transition-all"
            >
              <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-800 mb-4">
                {featuredStation.logo_url ? (
                  <img
                    src={featuredStation.logo_url}
                    alt={featuredStation.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                ) : (
                  <Tv className="w-12 h-12 text-slate-600" />
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-all">
                  <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-white group-hover:text-blue-400 transition-colors">
                    {featuredStation.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">{featuredStation.location || 'Kigali, Rwanda'}</p>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-500/30">
                  LIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Strip */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-[#131926] text-slate-400 hover:text-white hover:bg-[#1a2234] border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search TV stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#131926] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Stations Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-extrabold text-white">
                Available TV Channels ({filteredStations.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Verified Neon Database Streams
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-56 rounded-3xl bg-[#131926] animate-pulse border border-slate-800/80" />
              ))}
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-3xl bg-[#131926] border border-slate-800 text-slate-400">
              <Tv className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="font-bold text-white text-base">No TV channels found</p>
              <p className="text-xs text-slate-500 mt-1">Try another search term or select "All Channels".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredStations.map((station) => {
                const isFav = favoriteSlugs.includes(station.slug);
                return (
                  <div
                    key={station.id || station.slug}
                    onClick={() => handlePlayStation(station)}
                    className="group rounded-3xl bg-[#131926] border border-slate-800/80 hover:border-blue-500/50 p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Logo / Thumbnail Frame */}
                      <div className="relative aspect-video rounded-2xl bg-gradient-to-b from-slate-900 to-[#0A0D14] overflow-hidden flex items-center justify-center border border-slate-800/80 group-hover:border-slate-700 transition-all">
                        {station.logo_url ? (
                          <img
                            src={station.logo_url}
                            alt={station.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/logo.png';
                            }}
                          />
                        ) : (
                          <Tv className="w-10 h-10 text-slate-600" />
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            LIVE
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-slate-200">
                            1080p
                          </span>
                        </div>

                        {/* Favorite Button */}
                        <button
                          onClick={(e) => toggleFavorite(e, station.slug)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-black/80 transition-all"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        {/* Hover Overlay Play Button */}
                        <div className="absolute inset-0 bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/50 transform group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Station Info */}
                      <div className="mt-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-extrabold text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                            {station.name}
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                            {station.station_type || 'TV'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {station.description || 'Watch live broadcasts, regional news, and high quality streaming.'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Metadata & Play Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Globe className="w-3.5 h-3.5" />
                        {station.location || 'Rwanda'}
                      </span>
                      <button className="text-xs font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 transition-colors">
                        Stream Now
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Non-Logged In Callout Banner */}
        {!user && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/60 via-[#131926] to-indigo-950/60 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-black text-white">Create your free BenixSpace Account</h3>
              <p className="text-xs text-slate-400">
                Register in seconds with just Name, Email, WhatsApp Phone, and Country to unlock personalized favorite TV channels, live chat rooms, and central wallet perks.
              </p>
            </div>
            <button
              onClick={() => setWizardTarget('tv')}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 whitespace-nowrap transition-all"
            >
              Sign Up in 10 Seconds
            </button>
          </div>
        )}

      </div>

      {/* Access Wizard Modal for TV Onboarding */}
      <AppAccessWizardModal
        isOpen={!!wizardTarget}
        targetAppKey={wizardTarget}
        onClose={() => setWizardTarget(null)}
        onSuccess={() => {
          setWizardTarget(null);
        }}
      />

      {/* Benix Live Streaming Player Modal */}
      <BenixPlayerModal
        isOpen={!!activeStation}
        station={activeStation}
        onClose={() => setActiveStation(null)}
      />
    </div>
  );
};
