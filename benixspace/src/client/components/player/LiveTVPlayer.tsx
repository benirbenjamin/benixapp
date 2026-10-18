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
  const controlsTimeoutRef = useRef<any>(null);

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
    if (isTvPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else if (!isTvPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isTvPlaying]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isTvPlaying) setShowControls(false);
    }, 3500);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

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
            onClick={toggleTvPlay}
            className="p-2 sm:p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label={isTvPlaying ? 'Pause' : 'Play'}
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
        </div>

        {/* Right: Volume & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTvMute}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isTvMuted ? 'Unmute' : 'Mute'}
          >
            {isTvMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
