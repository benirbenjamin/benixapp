import React from 'react';
import { Tv, Signal } from 'lucide-react';
import { Station } from '../../types';
import { TVChannelCard } from './TVChannelCard';

interface TVChannelListProps {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  isPlaying?: boolean;
  layout?: 'grid' | 'strip';
  title?: string;
  subtitle?: string;
}

export const TVChannelList: React.FC<TVChannelListProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  isPlaying = false,
  layout = 'grid',
  title = 'Benix Space TV Channels',
  subtitle = 'Experience high-definition live broadcasts across Benix Space TV network',
}) => {
  const tvStations = Array.isArray(stations)
    ? stations.filter((s) => s && s.station_type === 'TV' && s.is_active)
    : [];


  if (tvStations.length === 0) return null;

  // Strip Layout: Sleek pill switcher for headers
  if (layout === 'strip') {
    return (
      <div className="flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/15 shadow-inner overflow-x-auto scrollbar-none">
        {tvStations.map((tv, index) => {
          const isSelected = selectedStation?.id === tv.id;
          const channelNum = `CH ${String(index + 1).padStart(2, '0')}`;

          return (
            <button
              key={tv.id}
              onClick={() => onSelectStation(tv)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 relative ${
                isSelected
                  ? 'bg-rba-blue text-white shadow-lg shadow-rba-blue/30 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {isSelected ? (
                <span className="w-2 h-2 rounded-full bg-rba-yellow animate-ping" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              <span className="px-1.5 py-0.5 rounded bg-black/30 text-[9px] font-black uppercase tracking-wider text-slate-300">
                {channelNum}
              </span>
              <span className="truncate max-w-[120px]">{tv.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Grid Layout: High-impact TV Channel Showcase Section
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 text-rba-blue font-black text-xs uppercase tracking-widest">
            <Tv className="w-4 h-4" />
            <span>Benix Space TV Channels</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <Signal className="w-3.5 h-3.5 text-emerald-600" />
          <span>{tvStations.length} Live Television Streams</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {tvStations.map((station, index) => {
          const channelNum = `CH ${String(index + 1).padStart(2, '0')}`;
          return (
            <TVChannelCard
              key={station.id}
              station={station}
              isSelected={selectedStation?.id === station.id}
              isPlaying={isPlaying}
              onSelect={onSelectStation}
              channelNumber={channelNum}
            />
          );
        })}
      </div>
    </section>
  );
};
