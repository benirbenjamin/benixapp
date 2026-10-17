import React from 'react';
import { Tv, Play, Signal, Eye, CheckCircle2 } from 'lucide-react';
import { Station } from '../../types';
import { AudioWaveform } from '../player/AudioWaveform';

interface TVChannelSidebarProps {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  isPlaying?: boolean;
}

export const TVChannelSidebar: React.FC<TVChannelSidebarProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  isPlaying = false,
}) => {
  const tvStations = Array.isArray(stations)
    ? stations.filter((s) => s && s.station_type === 'TV' && s.is_active)
    : [];


  if (tvStations.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-2xl flex flex-col text-white select-none">
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rba-blue text-white shadow-md">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              Live TV Channels
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Benix Space TV Network
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          {tvStations.length} Live
        </span>
      </div>

      {/* Vertical Scrollable Channels List */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
        {tvStations.map((station, index) => {
          const isSelected = selectedStation?.id === station.id;
          const channelNum = `CH ${String(index + 1).padStart(2, '0')}`;
          const isPlayingThis = isSelected && isPlaying;

          return (
            <button
              key={station.id}
              onClick={() => onSelectStation(station)}
              className={`w-full p-2.5 sm:p-3 rounded-2xl text-left transition-all duration-200 flex items-center justify-between gap-3 border ${
                isSelected
                  ? 'bg-gradient-to-r from-rba-blue/40 via-rba-blue/25 to-transparent border-rba-blue text-white shadow-lg ring-1 ring-rba-blue/50'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/10'
              }`}
            >
              {/* Channel Number & Logo & Title */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Channel Number Badge */}
                <span
                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm ${
                    isSelected
                      ? 'bg-rba-blue text-white'
                      : 'bg-black/50 text-slate-400 border border-white/10'
                  }`}
                >
                  {channelNum}
                </span>

                {/* Station Thumbnail/Logo */}
                <div className="w-9 h-9 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
                  <img
                    src={station.logo_url || '/logo.png'}
                    alt={station.name}
                    className="max-h-full max-w-full object-contain drop-shadow"
                  />
                </div>

                {/* Station Name & Category */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                      {station.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {station.frequency || 'Live Stream HD'}
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0 flex items-center gap-2">
                {isPlayingThis ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-rba-yellow/40">
                    <AudioWaveform isPlaying={true} barColor="bg-rba-yellow" className="h-2.5" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-rba-yellow hidden sm:inline">
                      On Air
                    </span>
                  </div>
                ) : isSelected ? (
                  <span className="flex items-center gap-1 text-[10px] font-black text-rba-blue uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rba-blue" />
                    Active
                  </span>
                ) : (
                  <div className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-slate-400 hover:text-white transition-colors">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info Pill */}
      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <Signal className="w-3 h-3 text-emerald-400" />
          <span>HD 1080p Ultra Streaming</span>
        </span>
        <span className="text-slate-500">Tap channel to switch</span>
      </div>

    </div>
  );
};
