import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Radio as RadioIcon, Heart } from 'lucide-react';
import { Station } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { AudioWaveform } from '../player/AudioWaveform';
import { isStationFavorite, toggleFavorite } from '../../utils/favorites';
import { Link } from 'react-router-dom';

interface RadioSliderProps {
  stations: Station[];
}

export const RadioSlider: React.FC<RadioSliderProps> = ({ stations }) => {
  const { currentStation, isPlaying, playStation, pauseStation } = usePlayer();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const touchStartX = useRef<number | null>(null);

  const radioStations = Array.isArray(stations)
    ? stations.filter((s) => s && s.station_type === 'RADIO' && s.is_active)
    : [];


  // Auto-scroll interval (every 4.5 seconds)
  useEffect(() => {
    if (isPaused || radioStations.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % radioStations.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, radioStations.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? radioStations.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % radioStations.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

  const handlePlayToggle = (st: Station, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStation?.id === st.id && isPlaying) {
      pauseStation();
    } else {
      playStation(st);
    }
  };

  const handleToggleFav = (stationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(stationId);
    setFavorites([...favorites, stationId]);
  };

  if (radioStations.length === 0) return null;

  return (
    <div
      className="relative w-full py-6 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rba-blue/10 text-rba-blue">
            <RadioIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Live Radio Network</h3>
            <p className="text-xs text-slate-500">Live community and national broadcasts across Rwanda</p>
          </div>
        </div>

        {/* Previous / Next Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all hover:scale-105 active:scale-95"
            aria-label="Previous station"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all hover:scale-105 active:scale-95"
            aria-label="Next station"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out gap-4"
          style={{
            transform: `translateX(-${currentIndex * 260}px)`,
          }}
        >
          {radioStations.map((station) => {
            const isCurrentlyActive = currentStation?.id === station.id;
            const isStationPlaying = isCurrentlyActive && isPlaying;
            const isFav = isStationFavorite(station.id);

            return (
              <div
                key={station.id}
                className="w-[245px] sm:w-[260px] shrink-0 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group/card relative"
              >
                {/* Station Banner Header */}
                <div
                  className="h-28 relative flex items-center justify-center p-4 transition-colors"
                  style={{ backgroundColor: station.accent_color ? `${station.accent_color}15` : '#f1f5f9' }}
                >
                  <div className="w-20 h-20 rounded-xl bg-white shadow-md p-2 flex items-center justify-center border border-slate-100 group-hover/card:scale-105 transition-transform duration-300">
                    <img
                      src={station.logo_url || '/logo.png'}
                      alt={station.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Favorite button */}
                  <button
                    onClick={(e) => handleToggleFav(station.id, e)}
                    className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${
                      isFav ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500 bg-white/80'
                    }`}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  {/* Live badge */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-rba-blue uppercase tracking-wider">
                        {station.frequency || 'FM Radio'}
                      </span>
                      {isStationPlaying && (
                        <AudioWaveform isPlaying={true} barColor="bg-rba-blue" className="h-3" />
                      )}
                    </div>
                    <Link
                      to={`/radio/${station.slug}`}
                      className="font-bold text-slate-900 hover:text-rba-blue line-clamp-1 text-base transition-colors"
                    >
                      {station.name}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {station.location || 'Rwanda'}
                    </p>
                  </div>

                  {/* Play Action Button */}
                  <button
                    onClick={(e) => handlePlayToggle(station, e)}
                    className={`mt-4 w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isStationPlaying
                        ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600'
                        : 'bg-rba-navy text-white hover:bg-rba-blue shadow-sm'
                    }`}
                  >
                    {isStationPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>Now Playing</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Listen Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
