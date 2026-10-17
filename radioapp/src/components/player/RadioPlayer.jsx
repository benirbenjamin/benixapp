import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { useStation } from '../../context/StationContext';

export function RadioPlayer({ variant = 'hero' }) {
  const {
    station,
    branding,
    streams,
    activeStream,
    setActiveStream,
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

  const [streamDropdownOpen, setStreamDropdownOpen] = useState(false);

  if (!activeStream) {
    return (
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
        <span>No active radio streams are currently configured.</span>
      </div>
    );
  }

  // Variant-specific card styles
  const isDarkVariant = variant === 'entertainment' || variant === 'hero' || variant === 'news';

  const cardStyle = (() => {
    switch (variant) {
      case 'entertainment':
        return 'bg-slate-900/80 backdrop-blur-xl border border-pink-500/30 text-white shadow-2xl';
      case 'classic':
        return 'bg-white/95 backdrop-blur-md border border-slate-200 text-slate-900 shadow-xl';
      case 'news':
        return 'bg-slate-950/90 backdrop-blur-md border border-red-600/30 text-white shadow-xl';
      case 'minimal':
        return 'bg-slate-50 border border-slate-200/80 text-slate-900 shadow-sm';
      case 'hero':
      default:
        return 'bg-slate-900/75 backdrop-blur-xl border border-white/15 text-white shadow-2xl';
    }
  })();

  const primaryColor = branding?.primary_color || '#4F46E5';

  return (
    <div className={`relative rounded-3xl p-4 sm:p-6 transition-all duration-300 ${cardStyle}`}>
      
      {/* Top Header: Live Badge, Audio Visualizer, Multi-Stream Switcher */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10 dark:border-white/10 border-slate-200/60">
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-500 border border-red-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            {playerStatus === 'connecting' ? 'CONNECTING' : playerStatus === 'live' ? 'LIVE ON AIR' : 'BROADCAST'}
          </span>

          {/* Sound wave equalizer */}
          {isPlaying && playerStatus === 'live' && (
            <div className="flex items-center gap-0.5 h-4 px-1">
              <span className="wave-bar w-1 bg-red-500 rounded-full h-2"></span>
              <span className="wave-bar w-1 bg-red-500 rounded-full h-3.5"></span>
              <span className="wave-bar w-1 bg-red-500 rounded-full h-4"></span>
              <span className="wave-bar w-1 bg-red-500 rounded-full h-2.5"></span>
              <span className="wave-bar w-1 bg-red-500 rounded-full h-1.5"></span>
            </div>
          )}
        </div>

        {/* Multi-Stream Switcher */}
        {streams && streams.length > 1 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setStreamDropdownOpen(!streamDropdownOpen)}
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-current transition-colors border border-white/10"
            >
              <span className="truncate max-w-[100px] sm:max-w-[130px]">{activeStream.name}</span>
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            </button>

            {streamDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Available Audio Streams
                </div>
                {streams.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setActiveStream(st);
                      setStreamDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      st.id === activeStream.id ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-200'
                    }`}
                  >
                    <span className="truncate">{st.name}</span>
                    {st.is_default && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-bold">Main</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle: Station / Show Info */}
      <div className="flex items-center gap-3.5 py-4">
        <div className="relative flex-shrink-0">
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt={station?.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-sm ring-2 ring-white/15"
            />
          ) : (
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <Radio className="w-6 h-6" />
            </div>
          )}
          
          {isPlaying && playerStatus === 'live' && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-slate-900"></span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-base sm:text-lg leading-tight truncate text-current">
            {station?.name || 'Radio Station'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {nowOnAir ? (
              <span>Now: <strong className="text-current font-bold">{nowOnAir.title}</strong></span>
            ) : (
              station?.slogan || 'Independent Live Audio Stream'
            )}
          </p>
        </div>
      </div>

      {/* Bottom: Play Controls & Volume Slider */}
      <div className="pt-3 border-t border-white/10 dark:border-white/10 border-slate-200/60 flex items-center justify-between gap-3">
        
        {/* Play / Pause Primary Button */}
        {playerStatus === 'error' ? (
          <button
            onClick={retryPlayback}
            className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-500 shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Stream Offline — Retry</span>
          </button>
        ) : (
          <button
            onClick={togglePlay}
            disabled={playerStatus === 'connecting'}
            className="flex-1 py-3 px-5 rounded-2xl font-black text-xs sm:text-sm text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {playerStatus === 'connecting' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Connecting...</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current text-white" />
                <span>PAUSE STREAM</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                <span>LISTEN LIVE</span>
              </>
            )}
          </button>
        )}

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-shrink-0 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
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
            className="w-16 sm:w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>

      </div>

    </div>
  );
}
export default RadioPlayer;
