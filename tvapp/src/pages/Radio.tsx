import React, { useEffect, useState } from 'react';
import {
  Radio as RadioIcon,
  Search,
  Heart,
  MapPin,
  Volume2,
  Sparkles,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { Station } from '../types';
import { getStations } from '../services/api';
import { StationCard } from '../components/radio/StationCard';
import { usePlayer } from '../context/PlayerContext';
import { AudioWaveform } from '../components/player/AudioWaveform';
import { isStationFavorite } from '../utils/favorites';
import { SEO } from '../components/common/SEO';
import { InContentAdBanner } from '../components/ads/InContentAdBanner';

export const RadioPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'national' | 'community' | 'favorites'>('all');
  const [loading, setLoading] = useState(true);

  const { currentStation, isPlaying } = usePlayer();

  useEffect(() => {
    const loadRadioStations = async () => {
      try {
        const data = await getStations({ type: 'RADIO' });
        setStations(data);
      } catch (err) {
        console.error('Failed to load radio stations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRadioStations();
  }, []);

  // Filter logic
  const filteredStations = stations.filter((station) => {
    // Search match
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (station.location && station.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (station.frequency && station.frequency.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'favorites') {
      return isStationFavorite(station.id);
    }
    if (filterType === 'national') {
      return station.slug === 'radio-rwanda' || station.slug === 'magic-fm' || station.slug === 'radio-inteko';
    }
    if (filterType === 'community') {
      return station.slug !== 'radio-rwanda' && station.slug !== 'magic-fm';
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-rba-grayBg pb-20">
      <SEO
        title="Listen Live Radio | Radio Rwanda & Community Radios"
        description="Listen to RTV's radio stations from anywhere. Radio Rwanda 100.7 FM, Magic FM, Rubavu, Musanze, Huye, Rusizi, Nyagatare, Inteko."
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rba-navy via-rba-navyLight to-rba-navy text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rba-yellow/20 text-rba-yellow text-xs font-bold uppercase tracking-wider mb-3">
            <RadioIcon className="w-3.5 h-3.5" /> Live Radio Network
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
            Listen Live
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            Listen to RTV's radio stations from anywhere across Rwanda and the diaspora.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6">
        {/* Currently Playing Station Spotlight Banner */}
        {currentStation && currentStation.station_type === 'RADIO' && (
          <div className="bg-white rounded-2xl border border-rba-blue/30 shadow-lg p-4 sm:p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-md"
                style={{ backgroundColor: currentStation.accent_color || '#0b1e36' }}
              >
                <img
                  src={currentStation.logo_url || '/logo.png'}
                  alt={currentStation.name}
                  className="max-h-full max-w-full object-contain drop-shadow"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rba-blue uppercase tracking-wider">
                    Currently Playing
                  </span>
                  <AudioWaveform isPlaying={isPlaying} barColor="bg-rba-yellow" className="h-3" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{currentStation.name}</h3>
                <p className="text-xs text-slate-500">
                  {currentStation.frequency} • {currentStation.location || 'Rwanda'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Audio Active
              </span>
            </div>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station by name, FM, location..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rba-blue focus:bg-white"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-rba-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Stations ({stations.length})
            </button>
            <button
              onClick={() => setFilterType('national')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'national'
                  ? 'bg-rba-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              National Radios
            </button>
            <button
              onClick={() => setFilterType('community')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'community'
                  ? 'bg-rba-navy text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Regional Community
            </button>
            <button
              onClick={() => setFilterType('favorites')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                filterType === 'favorites'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Favorites
            </button>
          </div>
        </div>

        {/* Minimal In-Content Sponsor Banner */}
        <InContentAdBanner sponsorIndex={3} label="National Broadcast Sponsor" />

        {/* Stations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <RadioIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-900 text-base">No stations found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
