import React from 'react';
import { Play, Tv, CheckCircle2, Sparkles, Radio, Signal, Eye } from 'lucide-react';
import { Station } from '../../types';
import { AudioWaveform } from '../player/AudioWaveform';

interface TVChannelCardProps {
  station: Station;
  isSelected: boolean;
  isPlaying?: boolean;
  onSelect: (station: Station) => void;
  channelNumber?: string;
}

export const TVChannelCard: React.FC<TVChannelCardProps> = ({
  station,
  isSelected,
  isPlaying = false,
  onSelect,
  channelNumber,
}) => {
  const isRtv = station.slug === 'rtv';
  const isKc2 = station.slug === 'kc2';

  // Customized branding accents and genre tags
  const channelBadge = channelNumber || (isRtv ? 'CH 01' : isKc2 ? 'CH 02' : 'TV');
  const channelCategory = isRtv
    ? 'National Television Channel'
    : isKc2
    ? 'Youth, Sports & Entertainment'
    : 'Benix Space TV Network';

  const channelTags = isRtv
    ? ['National News', 'Documentaries', 'Culture', 'Current Affairs']
    : isKc2
    ? ['Live Sports', 'Youth Culture', 'Music', 'Entertainment']
    : ['Live TV', 'Broadcasting'];

  const bgGradient = isRtv
    ? 'from-blue-900 via-sky-800 to-slate-900'
    : isKc2
    ? 'from-orange-600 via-amber-600 to-slate-900'
    : 'from-slate-800 via-slate-700 to-slate-900';

  const accentColor = station.accent_color || (isRtv ? '#0284c7' : '#f97316');

  return (
    <div
      onClick={() => onSelect(station)}
      className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 text-left flex flex-col justify-between ${
        isSelected
          ? 'border-rba-blue bg-white shadow-xl ring-4 ring-rba-blue/20 scale-[1.01]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* Top Media Preview Header */}
      <div className={`h-40 sm:h-44 relative bg-gradient-to-br ${bgGradient} p-5 flex flex-col justify-between overflow-hidden`}>
        
        {/* Subtle Ambient Background Watermark */}
        <div className="absolute -right-6 -bottom-6 text-white/10 pointer-events-none transform scale-150">
          <Tv className="w-32 h-32" />
        </div>

        {/* Top Badges Row */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Live
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white font-black text-[10px] uppercase tracking-wider border border-white/10">
              {channelBadge}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold">
            <Signal className="w-3 h-3 text-rba-yellow" />
            <span>1080p HD</span>
          </div>
        </div>

        {/* Center / Bottom Channel Identity & Logo */}
        <div className="flex items-end justify-between z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/95 p-2 shadow-xl flex items-center justify-center border border-white/30 backdrop-blur-sm shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={station.logo_url || '/logo.png'}
                alt={station.name}
                className="max-h-full max-w-full object-contain drop-shadow"
              />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                {station.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rba-yellow" />
                {channelCategory}
              </p>
            </div>
          </div>

          {/* Currently Watching Waveform Indicator */}
          {isSelected && isPlaying && (
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-white/20">
              <AudioWaveform isPlaying={true} barColor="bg-rba-yellow" className="h-3" />
              <span className="text-[10px] font-extrabold text-rba-yellow uppercase tracking-wider hidden sm:inline">
                Watching
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Transmission Frequency & Location */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-3 pb-3 border-b border-slate-100">
            <span className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Signal className="w-3.5 h-3.5 text-rba-blue shrink-0" />
              {station.frequency || 'DTT Broadcast'}
            </span>
            <span className="text-slate-400">{station.location || 'Rwanda'}</span>
          </div>

          {/* Channel Description */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
            {station.description}
          </p>

          {/* Genre & Program Pills */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {channelTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(station);
          }}
          className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
            isSelected
              ? 'bg-rba-blue text-white shadow-rba-blue/20 shadow-lg'
              : 'bg-slate-900 text-white hover:bg-rba-navy'
          }`}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-rba-yellow" />
              <span>Currently On Screen</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Switch & Watch {station.name}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
