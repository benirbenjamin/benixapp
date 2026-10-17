import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, RefreshCw, X } from 'lucide-react';
import { useStation } from '../../context/StationContext';

export function PersistentPlayerBar() {
  const {
    station,
    branding,
    activeStream,
    isPlaying,
    playerStatus,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    togglePlay,
    retryPlayback,
    nowOnAir
  } = useStation();

  const [showDock, setShowDock] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show dock when user scrolls past 300px
      if (window.scrollY > 280) {
        setShowDock(true);
      } else {
        setShowDock(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!activeStream || !showDock || minimized) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl py-3 px-4 sm:px-8 transition-transform duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Station & Show info */}
        <div className="flex items-center gap-3 min-w-0">
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt={station?.name}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: branding?.primary_color || '#4F46E5' }}
            >
              <Radio className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">LIVE STREAM</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {nowOnAir ? nowOnAir.title : station?.name}
            </p>
          </div>
        </div>

        {/* Center: Play / Pause button */}
        <div className="flex items-center gap-3">
          {playerStatus === 'error' ? (
            <button
              onClick={retryPlayback}
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          ) : (
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform"
              style={{ backgroundColor: branding?.primary_color || '#4F46E5' }}
            >
              {playerStatus === 'connecting' ? (
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current text-white" />
              ) : (
                <Play className="w-5 h-5 fill-current text-white ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Right: Volume & Dismiss */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
            />
          </div>

          <button
            onClick={() => setMinimized(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Minimize bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
