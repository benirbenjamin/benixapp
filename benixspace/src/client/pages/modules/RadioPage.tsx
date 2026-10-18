import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchRadioStations, type Station } from '../../services/mediaService';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { BenixPlayerModal } from '../../components/modals/BenixPlayerModal';
import { CompanionAdBanner } from '../../components/ads/CompanionAdBanner';
import { SeoHead } from '../../components/common/SeoHead';
import {
  Radio,
  Play,
  Pause,
  Search,
  Sparkles,
  Volume2,
  Tv,
  Heart,
  Share2,
  ChevronRight,
  Headphones,
  Signal,
  Flame,
  Globe
} from 'lucide-react';

const GENRES = [
  { id: 'all', label: 'All Frequencies' },
  { id: 'kigali', label: 'Kigali Hits' },
  { id: 'news', label: 'News & Talk' },
  { id: 'gospel', label: 'Faith & Gospel' },
  { id: 'national', label: 'Public & Regional' }
];

export const RadioPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasAppProfile } = useAuth();

  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  // Currently playing stream in persistent audio
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [wizardTarget, setWizardTarget] = useState<string | null>(null);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('benix_fav_radio') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    async function load() {
      try {
        const radioData = await fetchRadioStations();
        setStations(radioData);
        if (radioData.length > 0 && !activeStation) {
          // Pre-select Kiss FM or first station for quick player
          setActiveStation(radioData[0]);
        }
      } catch (err) {
        console.error('Error loading radio stations:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleFavorite = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    if (!user) {
      setWizardTarget('radio');
      return;
    }
    setFavoriteSlugs((prev) => {
      const updated = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem('benix_fav_radio', JSON.stringify(updated));
      return updated;
    });
  };

  const handlePlayStation = (station: Station) => {
    if (!user) {
      setActiveStation(station);
    } else if (!hasAppProfile('radio')) {
      setWizardTarget('radio');
    } else {
      setActiveStation(station);
    }
  };

  const filteredStations = stations.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.frequency && st.frequency.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.description && st.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.location && st.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedGenre === 'all') return true;
    if (selectedGenre === 'kigali') {
      return st.location?.toLowerCase().includes('kigali') || st.slug.includes('kiss') || st.slug.includes('royal');
    }
    if (selectedGenre === 'news') {
      return st.name.toLowerCase().includes('rwanda') || st.slug.includes('kt-radio') || st.slug.includes('radio-10') || st.slug.includes('flash');
    }
    if (selectedGenre === 'gospel') {
      return st.slug.includes('maria') || st.description?.toLowerCase().includes('faith') || st.description?.toLowerCase().includes('gospel');
    }
    if (selectedGenre === 'national') {
      return st.slug.includes('rwanda') || st.slug.includes('salus') || st.location?.toLowerCase().includes('huye');
    }
    return true;
  });

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-24 font-sans selection:bg-purple-600 selection:text-white">
      <SeoHead
        title="Live Radio Stations & Audio Streams — BenixSpace"
        description="Listen to 24/7 live Rwandan radio stations. Stream Kiss FM, Radio Rwanda, Flash FM, Radio 10, Royal FM, KT Radio, and Radio Maria online in pristine quality."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Top Hero Banner with Audio Visualizer */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#181126] via-[#100D1C] to-[#0B0E14] shadow-2xl p-6 sm:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-pink-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-600 text-white shadow-lg shadow-purple-600/30">
                  <Signal className="w-3.5 h-3.5 animate-pulse" />
                  Live On Air 24/7
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  High-Fidelity Icecast Streams
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  {stations.length} Real Radios
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Stream Your Favorite <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-400 bg-clip-text text-transparent">
                  FM Radios & Shows Live
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Connect directly to official radio station streams in Kigali, across Rwanda, and worldwide. Enjoy music, morning talk shows, breaking news, and sports commentary.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {activeStation && (
                  <button
                    onClick={() => handlePlayStation(activeStation)}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 flex items-center gap-2.5 transition-all transform active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Listen to {activeStation.name}
                  </button>
                )}
                <button
                  onClick={() => navigate('/tv')}
                  className="px-5 py-3.5 rounded-2xl bg-[#1A1828] hover:bg-[#252038] text-slate-200 font-semibold text-sm border border-slate-700/60 flex items-center gap-2 transition-all"
                >
                  <Tv className="w-4 h-4 text-blue-400" />
                  Switch to Live TV
                </button>
              </div>
            </div>

            {/* Currently Selected Station Card */}
            {activeStation && (
              <div className="w-full md:w-80 p-5 rounded-2xl bg-[#1D172E]/90 border border-purple-500/30 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-purple-500/40 p-2 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                    {activeStation.logo_url ? (
                      <img
                        src={activeStation.logo_url}
                        alt={activeStation.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/logo.png';
                        }}
                      />
                    ) : (
                      <Radio className="w-8 h-8 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      NOW BROADCASTING
                    </span>
                    <h4 className="font-extrabold text-base text-white mt-1">
                      {activeStation.name}
                    </h4>
                    <p className="text-xs text-purple-300 font-bold">{activeStation.frequency || 'FM'}</p>
                  </div>
                </div>

                {/* Animated Audio Equalizer */}
                <div className="flex items-end justify-center gap-1.5 h-10 bg-black/40 rounded-xl p-2 border border-purple-500/20 mb-4">
                  {[40, 75, 55, 95, 60, 85, 45, 100, 70, 90, 50, 65].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-purple-600 to-pink-400 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${(i * 120) % 800}ms`,
                        animationDuration: '600ms'
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => handlePlayStation(activeStation)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Headphones className="w-4 h-4" />
                  Open Live Audio Player
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Radio Broadcast Sponsor Banner */}
        <div className="max-w-5xl mx-auto">
          <CompanionAdBanner label="Live Radio Stream Partner" />
        </div>

        {/* Search & Genre Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Genres */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedGenre === g.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-[#131926] text-slate-400 hover:text-white hover:bg-[#1a2234] border border-slate-800'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, FM or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#131926] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        {/* Stations Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-extrabold text-white">
                Live Rwandan FM Radios ({filteredStations.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Direct Icecast / Shoutcast Streams
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-44 rounded-3xl bg-[#131926] animate-pulse border border-slate-800/80" />
              ))}
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-3xl bg-[#131926] border border-slate-800 text-slate-400">
              <Radio className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="font-bold text-white text-base">No radio stations found</p>
              <p className="text-xs text-slate-500 mt-1">Try another frequency or name filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStations.map((station) => {
                const isFav = favoriteSlugs.includes(station.slug);
                const isCurrent = activeStation?.slug === station.slug;

                return (
                  <div
                    key={station.id || station.slug}
                    onClick={() => handlePlayStation(station)}
                    className={`group rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                      isCurrent
                        ? 'bg-[#181126] border-purple-500/70 shadow-xl shadow-purple-900/20'
                        : 'bg-[#131926] border-slate-800/80 hover:border-purple-500/50 hover:shadow-xl'
                    }`}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0A0D14] p-2 flex items-center justify-center border border-slate-800 group-hover:border-purple-500/40 transition-colors shadow-inner overflow-hidden">
                          {station.logo_url ? (
                            <img
                              src={station.logo_url}
                              alt={station.name}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/logo.png';
                              }}
                            />
                          ) : (
                            <Radio className="w-6 h-6 text-purple-400" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {station.frequency && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-600/20 text-purple-300 border border-purple-500/30">
                              {station.frequency}
                            </span>
                          )}
                          <button
                            onClick={(e) => toggleFavorite(e, station.slug)}
                            className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-pink-500 text-pink-500' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Station Title & Details */}
                      <div>
                        <h3 className="font-extrabold text-sm text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                          {station.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {station.description || '24/7 Live Radio stream from Kigali, Rwanda.'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {station.location || 'Rwanda'}
                      </span>

                      <button className="text-xs font-bold text-purple-400 group-hover:text-purple-300 flex items-center gap-1 transition-colors">
                        <Play className="w-3 h-3 fill-purple-400" />
                        Play Stream
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
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#131926] to-pink-950/60 border border-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-black text-white">Join BenixSpace for Live Song Requests & Chats</h3>
              <p className="text-xs text-slate-400">
                Register with your WhatsApp phone and country to vote in radio charts, send live studio greetings, and save your presets.
              </p>
            </div>
            <button
              onClick={() => setWizardTarget('radio')}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 whitespace-nowrap transition-all"
            >
              Sign Up in 10 Seconds
            </button>
          </div>
        )}

      </div>

      {/* Access Wizard Modal for Radio Preferences */}
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
