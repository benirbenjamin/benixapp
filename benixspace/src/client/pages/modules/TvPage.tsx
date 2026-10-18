import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { fetchTvStations, type Station } from '../../services/mediaService';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { LiveTVPlayer } from '../../components/player/LiveTVPlayer';
import { SidebarRecommendationsMixedAds } from '../../components/ads/SidebarRecommendationsMixedAds';
import { CompanionAdBanner } from '../../components/ads/CompanionAdBanner';
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
  Film,
  ArrowLeft
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
    if (!user) {
      playTv(station);
    } else if (!hasAppProfile('tv')) {
      setWizardTarget('tv');
    } else {
      playTv(station);
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

  const activeChannel = activeTvStation || stations[0] || featuredStation;

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-28 font-sans selection:bg-blue-600 selection:text-white">
      <SeoHead
        title="Live TV Broadcasts & Channels — BenixSpace"
        description="Stream official live television channels in Rwanda and globally. Watch RTV, KC2, BTN, TV10, Isibo TV, France 24, and CBS News in high definition."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Prominent Back to Home Button & Broadcast Banner */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all hover:scale-105 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <span className="text-xs text-blue-400 font-bold flex items-center gap-1.5 bg-[#121824] px-3 py-1.5 rounded-xl border border-slate-800">
            <Tv className="w-3.5 h-3.5" />
            <span>24/7 Live Broadcasts • Movable PiP Enabled</span>
          </span>
        </div>

        {/* Embedded Live TV Player & Sidebar Recommendations Mixed with Ads */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Video Player & Details */}
          <div className="lg:col-span-8 space-y-4">
            <LiveTVPlayer
              station={activeChannel}
              autoPlay={true}
            />

            <div className="p-4 sm:p-5 rounded-3xl bg-[#121824] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {activeChannel.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black uppercase border border-red-500/30">
                    Live Broadcast
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  {activeChannel.description || 'Public service high definition live television broadcast.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate('/radio')}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Radio className="w-4 h-4 text-purple-400" />
                  <span>Switch to Radio FM</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Recommendations Mixed with User Ads + Google AdSense */}
          <div className="lg:col-span-4">
            <SidebarRecommendationsMixedAds
              items={stations}
              type="tv"
              activeItemId={activeChannel.id}
              onSelectItem={(st) => handlePlayStation(st)}
            />
          </div>

        </div>

        {/* Search & Category Filter Strip */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
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
    </div>
  );
};
