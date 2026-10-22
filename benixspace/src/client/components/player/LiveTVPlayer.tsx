import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Loader2,
  Tv,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { Station } from '../../services/mediaService';
import { usePlayer } from '../../context/PlayerContext';
import { TVAdOverlay } from './TVAdOverlay';

interface LiveTVPlayerProps {
  station: Station;
  className?: string;
  autoPlay?: boolean;
}

export const LiveTVPlayer: React.FC<LiveTVPlayerProps> = ({
  station,
  className = '',
  autoPlay = true
}) => {
  const {
    isTvPlaying,
    isTvMuted,
    toggleTvPlay,
    toggleTvMute,
    playTv,
    showTvAd,
    dismissTvAd
  } = usePlayer();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [centerFeedback, setCenterFeedback] = useState<'play' | 'pause' | null>(null);
  const feedbackTimerRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<any>(null);

  const triggerFeedback = (type: 'play' | 'pause') => {
    setCenterFeedback(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setCenterFeedback(null), 600);
  };

  const handleToggleTvPlay = () => {
    triggerFeedback(!isTvPlaying ? 'play' : 'pause');
    toggleTvPlay();
  };

  const streamUrl = station.stream_url || station.streamUrl || '';

  useEffect(() => {
    if (!streamUrl) {
      setError('Live stream URL not found for this channel.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 0,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.muted = isTvMuted;
        if (autoPlay) {
          playTv(station);
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setIsLoading(false);
              setError('Live broadcast feed temporarily unavailable. Click retry.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.muted = isTvMuted;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (autoPlay) {
          playTv(station);
          video.play().catch(() => {});
        }
      });
      video.addEventListener('error', () => {
        setIsLoading(false);
        setError('Live broadcast feed temporarily unavailable. Click retry.');
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, station.id]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isTvMuted;
    }
  }, [isTvMuted]);

  // Sync play/pause state
  useEffect(() => {
    if (!videoRef.current) return;
    if (showTvAd) {
      if (!videoRef.current.paused) videoRef.current.pause();
      return;
    }
    if (isTvPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else if (!isTvPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isTvPlaying, showTvAd]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isTvPlaying) setShowControls(false);
    }, 3500);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch (e) {}
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
        if (screen.orientation && 'unlock' in screen.orientation) {
          screen.orientation.unlock();
        }
      } catch (e) {}
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && screen.orientation && 'unlock' in screen.orientation) {
        try { screen.orientation.unlock(); } catch {}
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
    };
  }, []);

  // Keyboard Shortcuts: Space (Play/Pause), M (Mute/Unmute), F (Landscape Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.code === 'Space' || e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleToggleTvPlay();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleTvMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTvPlaying, isTvMuted, isFullscreen]);

  const retryPlayback = () => {
    setError(null);
    setIsLoading(true);
    if (hlsRef.current && streamUrl) {
      hlsRef.current.loadSource(streamUrl);
      hlsRef.current.startLoad();
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none group ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay={autoPlay}
        muted={isTvMuted}
      />

      {/* Middle Player Click Area: Click to Toggle Play/Pause, Double-Click for Landscape Fullscreen */}
      <div
        onClick={handleToggleTvPlay}
        onDoubleClick={toggleFullscreen}
        className="absolute inset-0 z-10 cursor-pointer pointer-events-auto"
        title="Click to Pause/Play • Double-Click for Landscape Fullscreen"
      />

      {/* Center Ripple Feedback (Play / Pause) */}
      {centerFeedback && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          <div className="p-5 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-2xl animate-in zoom-in duration-200">
            {centerFeedback === 'play' ? (
              <Play className="w-12 h-12 fill-current ml-1 text-blue-400" />
            ) : (
              <Pause className="w-12 h-12 fill-current text-blue-400" />
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Visible Exit Button */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2.5 rounded-2xl bg-black/85 hover:bg-black text-white font-extrabold text-xs border border-white/30 flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all active:scale-95"
          >
            <Minimize className="w-4 h-4 text-blue-400" />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      )}

      {/* Benix Space Watermark Branding */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 bg-[#0B0E14]/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
        <img
          src={localStorage.getItem('benix_platform_logo') || '/logo.png'}
          alt="Benix Logo"
          className="w-5 h-5 object-contain rounded"
        />
        <span className="font-black text-xs text-white">
          Benix<span className="text-blue-500">.Space</span> TV
        </span>
      </div>

      {/* Force TV Video Ad Overlay on Play */}
      {showTvAd && (
        <TVAdOverlay
          stationName={station.name}
          onClose={dismissTvAd}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white space-y-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-xs font-bold text-slate-300">Connecting to {station.name} live stream...</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center space-y-3 text-white">
          <AlertCircle className="w-10 h-10 text-amber-400" />
          <h4 className="font-extrabold text-sm sm:text-base">{station.name} Broadcast Stream</h4>
          <p className="text-xs text-slate-400 max-w-sm">{error}</p>
          <button
            onClick={retryPlayback}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Retry Stream
          </button>
        </div>
      )}

      {/* Player Control Bar (Hover & Active) */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls || !isTvPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Play/Pause & Live Station Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleTvPlay}
            className="p-2 sm:p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label={isTvPlaying ? 'Pause (Space)' : 'Play (Space)'}
            title={isTvPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isTvPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="font-extrabold text-xs sm:text-sm text-white truncate">{station.name}</span>
            <span className="hidden sm:inline-block text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-black uppercase">
              LIVE HD
            </span>
          </div>

          <span className="hidden md:inline-block text-[11px] text-slate-400 font-mono pl-2">
            Space: Pause • M: Mute • F: Fullscreen
          </span>
        </div>

        {/* Right: Volume & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTvMute}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isTvMuted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {isTvMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Toggle Landscape Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
