import React, { useState } from 'react';
import { Play, Pause, Heart, Radio as RadioIcon, MapPin, Activity } from 'lucide-react';
import { Station } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { AudioWaveform } from '../player/AudioWaveform';
import { isStationFavorite, toggleFavorite } from '../../utils/favorites';
import { Link } from 'react-router-dom';

import { useAds } from '../../context/AdContext';

interface StationCardProps {
  station: Station;
}

export const StationCard: React.FC<StationCardProps> = ({ station }) => {
  const { currentStation, isPlaying, playStation, pauseStation } = usePlayer();
  const { triggerRadioAdIfNeeded } = useAds();
  const [isFav, setIsFav] = useState(() => isStationFavorite(station.id));

  const isCurrent = currentStation?.id === station.id;
  const isPlayingThis = isCurrent && isPlaying;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlayingThis) {
      pauseStation();
    } else {
      triggerRadioAdIfNeeded(station, () => {
        playStation(station);
      });
    }
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(station.id);
    setIsFav(next);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Top Banner with Brand Logo */}
      <div
        className="h-36 relative flex items-center justify-center p-4 transition-colors"
        style={{ backgroundColor: station.accent_color ? `${station.accent_color}18` : '#f1f5f9' }}
      >
        <div className="w-24 h-24 rounded-2xl bg-white shadow-md p-2.5 flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform duration-300">
          <img
            src={station.logo_url || '/logo.png'}
            alt={station.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleToggleFav}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-colors ${
            isFav
              ? 'text-red-500 bg-red-50'
              : 'text-slate-400 hover:text-red-500 bg-white/90'
          }`}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>

        {/* Live indicator badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Live
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-rba-blue uppercase tracking-wider">
              {station.frequency || 'FM Stereo'}
            </span>
            {isPlayingThis && (
              <AudioWaveform isPlaying={true} barColor="bg-rba-blue" className="h-3.5" />
            )}
          </div>

          <Link
            to={`/radio/${station.slug}`}
            className="text-lg font-extrabold text-slate-900 hover:text-rba-blue transition-colors line-clamp-1"
          >
            {station.name}
          </Link>

          {station.location && (
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 mb-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{station.location}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {station.description || 'Live streaming official Benix Space TV radio broadcast.'}
          </p>
        </div>

        {/* Actions Bottom Bar */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={handlePlayToggle}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isPlayingThis
                ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600'
                : 'bg-rba-navy text-white hover:bg-rba-blue shadow-sm'
            }`}
          >
            {isPlayingThis ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Listen Live</span>
              </>
            )}
          </button>

          <Link
            to={`/radio/${station.slug}`}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};
