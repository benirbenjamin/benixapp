import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  X,
  Maximize2,
  Minimize2,
  Radio as RadioIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { AudioWaveform } from './AudioWaveform';
import { Link } from 'react-router-dom';

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
      {/* Fullscreen Expanded Overlay for Mobile/Desktop */}
      {isExpanded && (
        <div className="fixed inset-0 z-[60] bg-rba-dark/95 backdrop-blur-md flex flex-col justify-between p-6 text-white animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Live Broadcast</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Minimize player"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Center Station Art & Info */}
          <div className="flex flex-col items-center justify-center my-auto text-center max-w-sm mx-auto">
            <div
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl p-6 shadow-2xl flex items-center justify-center relative overflow-hidden mb-8 border border-white/10"
              style={{ backgroundColor: currentStation.accent_color || '#0b1e36' }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
              <img
                src={currentStation.logo_url || '/logo.png'}
                alt={currentStation.name}
                className="w-full h-full object-contain relative z-10 drop-shadow-md"
              />
              {isPlaying && (
                <div className="absolute bottom-4 right-4 z-20">
                  <AudioWaveform isPlaying={true} barColor="bg-rba-yellow" />
                </div>
              )}
            </div>

            <span className="text-sm font-semibold tracking-wider text-rba-yellow uppercase mb-1">
              {currentStation.frequency || 'Live Radio'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{currentStation.name}</h2>
            <p className="text-sm text-slate-300 line-clamp-2 max-w-xs">{currentStation.description || currentStation.location}</p>

            {error && (
              <div className="mt-4 p-3 bg-red-900/40 border border-red-500/50 rounded-xl flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
                <button
                  onClick={retryPlayback}
                  className="ml-auto underline font-semibold hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Expanded Bottom Controls */}
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6">
              {error ? (
                <button
                  onClick={retryPlayback}
                  className="p-5 rounded-full bg-rba-yellow text-rba-dark hover:scale-105 transition-all shadow-lg flex items-center gap-2 font-bold"
                >
                  <RotateCcw className="w-6 h-6 animate-spin" /> Retry Stream
                </button>
              ) : (
                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="w-20 h-20 rounded-full bg-rba-blue hover:bg-rba-blueHover text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
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

            {/* Volume bar */}
            <div className="flex items-center gap-3 px-4">
              <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rba-blue"
              />
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar (Desktop & Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-rba-navy/95 border-t border-rba-navyLight/80 backdrop-blur-md shadow-2xl text-white transition-transform duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          
          {/* Station Info & Thumbnail */}
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-72">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center p-1.5 shrink-0 shadow-md relative overflow-hidden"
              style={{ backgroundColor: currentStation.accent_color || '#142a4a' }}
            >
              <img
                src={currentStation.logo_url || '/logo.png'}
                alt={currentStation.name}
                className="w-full h-full object-contain drop-shadow"
              />
              {isPlaying && (
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-rba-yellow ring-2 ring-rba-navy animate-ping" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  to={`/radio/${currentStation.slug}`}
                  className="font-bold text-sm sm:text-base text-white hover:text-rba-blueLight truncate transition-colors"
                >
                  {currentStation.name}
                </Link>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600/90 text-white uppercase tracking-wider">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">
                {currentStation.frequency ? `${currentStation.frequency} • ` : ''}
                {currentStation.location || 'Rwanda'}
              </p>
            </div>
          </div>

          {/* Error Message if stream dropped */}
          {error ? (
            <div className="hidden md:flex items-center gap-2 bg-red-950/60 border border-red-500/40 px-3 py-1.5 rounded-lg text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="truncate max-w-xs">{error}</span>
              <button
                onClick={retryPlayback}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-medium ml-1 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            /* Animated Equalizer Waveform */
            <div className="hidden lg:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <AudioWaveform isPlaying={isPlaying} barColor="bg-rba-yellow" />
              <span className="text-xs font-semibold text-slate-300">
                {isBuffering ? 'Buffering...' : isPlaying ? 'On Air' : 'Paused'}
              </span>
            </div>
          )}

          {/* Central Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {error && (
              <button
                onClick={retryPlayback}
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-rba-yellow text-rba-dark hover:bg-amber-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="Retry stream"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Retry</span>
              </button>
            )}

            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rba-blue hover:bg-rba-blueHover text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading || isBuffering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          </div>

          {/* Right Tools (Volume, Expand, Stop) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Volume Slider */}
            <div
              className="relative hidden sm:flex items-center gap-2"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle mute"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <div className={`transition-all duration-200 overflow-hidden ${showVolumeSlider ? 'w-24 opacity-100' : 'w-16 opacity-70'}`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-rba-blue"
                  aria-label="Volume slider"
                />
              </div>
            </div>

            {/* Expand Modal button */}
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Expand player"
              aria-label="Expand player"
            >
              <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Stop/Close Radio */}
            <button
              onClick={stopStation}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Close radio player"
              aria-label="Close radio player"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
