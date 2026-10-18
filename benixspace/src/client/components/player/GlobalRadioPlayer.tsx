import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  Radio as RadioIcon,
  AlertCircle,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';

export const GlobalRadioPlayer: React.FC = () => {
  const {
    currentStation,
    isPlaying,
    isLoading,
    isBuffering,
    volume,
    isMuted,
    error,
    isExpanded,
    togglePlay,
    setVolume,
    toggleMute,
    retryPlayback,
    stopStation,
    setIsExpanded,
  } = usePlayer();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!currentStation) return null;

  return (
    <>
      {/* Fullscreen Expanded Overlay for Mobile / Desktop */}
      {isExpanded && (
        <div className="fixed inset-0 z-[70] bg-[#0B0E14]/98 backdrop-blur-2xl flex flex-col justify-between p-6 text-white animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between max-w-lg w-full mx-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Live Broadcast • Benix Radio
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white transition-colors border border-slate-700/60"
              aria-label="Minimize player"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Center Art & Info */}
          <div className="flex flex-col items-center justify-center my-auto text-center max-w-sm mx-auto space-y-5">
            <div
              className="w-52 h-52 sm:w-64 sm:h-64 rounded-3xl p-6 shadow-2xl flex items-center justify-center relative overflow-hidden border border-slate-700/60"
              style={{ backgroundColor: currentStation.accent_color || '#0E1726' }}
            >
              <img
                src={currentStation.logo_url || currentStation.logoUrl || '/radio-icon.svg'}
                alt={currentStation.name}
                className="w-full h-full object-contain relative z-10 drop-shadow-xl"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-blue-500/10 animate-pulse pointer-events-none" />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold tracking-widest text-amber-400 uppercase">
                {currentStation.frequency || currentStation.genre || 'FM Radio'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{currentStation.name}</h2>
              <p className="text-xs text-slate-400 line-clamp-2">
                {currentStation.description || currentStation.location || 'Rwanda & Regional Live Stream'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
                <button
                  onClick={retryPlayback}
                  className="ml-auto underline font-bold hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Expanded Bottom Controls */}
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Playback Button */}
            <div className="flex items-center justify-center gap-6">
              {error ? (
                <button
                  onClick={retryPlayback}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
                >
                  <RotateCcw className="w-5 h-5 animate-spin" /> Retry Stream
                </button>
              ) : (
                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-2xl shadow-indigo-600/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
                >
                  {isLoading || isBuffering ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </button>
              )}
            </div>

            {/* Volume & Close Bar */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-48 accent-blue-500 cursor-pointer"
              />

              <button
                onClick={stopStation}
                className="text-slate-400 hover:text-rose-400 transition-colors"
                title="Stop radio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar (Visible Across All Pages) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-slate-800/90 text-white shadow-[0_-10px_30px_rgba(0,0,0,0.7)] px-3 sm:px-6 py-2.5 transition-all">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Station Brand & Live Pill */}
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1 sm:flex-initial"
          >
            <div
              className="w-11 h-11 rounded-xl p-1 shrink-0 flex items-center justify-center relative overflow-hidden border border-slate-700/80 group-hover:scale-105 transition-transform"
              style={{ backgroundColor: currentStation.accent_color || '#111827' }}
            >
              <img
                src={currentStation.logo_url || currentStation.logoUrl || '/radio-icon.svg'}
                alt={currentStation.name}
                className="w-full h-full object-contain"
              />
              {isPlaying && (
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <h4 className="font-extrabold text-xs sm:text-sm text-white truncate group-hover:text-blue-400 transition-colors">
                  {currentStation.name}
                </h4>
              </div>
              <p className="text-[11px] text-amber-400 font-bold truncate">
                {currentStation.frequency || currentStation.genre || 'Live Radio Stream'}
              </p>
            </div>
          </div>

          {/* Center: Play / Pause Control */}
          <div className="flex items-center gap-2">
            {error ? (
              <button
                onClick={retryPlayback}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition-all"
              >
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Retry</span>
              </button>
            ) : (
              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
              >
                {isLoading || isBuffering ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
            )}
          </div>

          {/* Right: Volume & Expand / Close */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Volume Slider */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Expand button */}
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Expand player"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={stopStation}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
              title="Stop radio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
