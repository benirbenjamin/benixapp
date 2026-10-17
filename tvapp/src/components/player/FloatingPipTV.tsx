import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, X, Maximize2, Tv } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';

export const FloatingPipTV: React.FC = () => {
  const {
    activeTvStation,
    isTvPlaying,
    isTvMuted,
    isTvPipDismissed,
    hasTvStarted,
    currentStation,
    toggleTvPlay,
    toggleTvMute,
    closeTvPip,
  } = usePlayer();

  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Check if user is on a page that already has the primary TV player
  const isPrimaryTvPage =
    location.pathname === '/' ||
    location.pathname === '/tv';

  // Show PiP if TV was started, not dismissed, and user navigated to another page
  const shouldShowPip =
    !isPrimaryTvPage &&
    !isTvPipDismissed &&
    activeTvStation !== null &&
    hasTvStarted;

  useEffect(() => {
    if (!shouldShowPip || !activeTvStation) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 20,
        maxMaxBufferLength: 35,
        maxBufferSize: 15 * 1024 * 1024,
        backBufferLength: 0,
        liveSyncDurationCount: 2,
        startFragPrefetch: true,
      });

      hlsRef.current = hls;
      hls.loadSource(activeTvStation.stream_url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = isTvMuted;
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = activeTvStation.stream_url;
      video.muted = isTvMuted;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [shouldShowPip, activeTvStation?.stream_url]);

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

  if (!shouldShowPip || !activeTvStation) return null;

  return (
    <div
      className={`fixed ${
        currentStation ? 'bottom-20 sm:bottom-24' : 'bottom-6 sm:bottom-8'
      } right-4 z-40 w-64 sm:w-80 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-rba-blue/40 animate-scaleUp text-white group select-none transition-all duration-300`}
    >
      {/* Top Controls Bar */}
      <div className="p-2.5 bg-slate-900/90 backdrop-blur-sm flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isTvPlaying ? 'bg-red-500 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span className="font-bold text-xs text-white truncate flex items-center gap-1">
            <Tv className="w-3.5 h-3.5 text-rba-blue shrink-0" />
            {activeTvStation.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Expand to TV page */}
          <button
            onClick={() => navigate('/tv')}
            className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title="Expand to TV page"
            aria-label="Expand to TV page"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close PiP */}
          <button
            onClick={closeTvPip}
            className="p-1 rounded-lg hover:bg-red-600/80 text-slate-300 hover:text-white transition-colors"
            title="Close Picture in Picture"
            aria-label="Close Picture in Picture"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          playsInline
          muted={isTvMuted}
          className="w-full h-full object-contain cursor-pointer"
          onClick={toggleTvPlay}
        />

        {/* Big Center Play Icon when paused by Radio or User */}
        {!isTvPlaying && (
          <button
            onClick={toggleTvPlay}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/70 hover:bg-rba-blue text-white flex items-center justify-center backdrop-blur-sm shadow-xl transition-transform hover:scale-110 active:scale-95 z-10"
            aria-label="Resume Live TV"
            title="Resume Live TV"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </button>
        )}

        {/* Floating Quick Action Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto z-10">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
            <button
              onClick={toggleTvPlay}
              className="p-1 text-white hover:text-rba-blue transition-colors"
              aria-label={isTvPlaying ? 'Pause' : 'Play'}
            >
              {isTvPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>

            <button
              onClick={toggleTvMute}
              className="p-1 text-white hover:text-rba-yellow transition-colors"
              aria-label="Toggle mute"
            >
              {isTvMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rba-yellow" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <span
            className={`px-1.5 py-0.5 rounded text-white font-black text-[9px] uppercase tracking-wider ${
              isTvPlaying ? 'bg-red-600/90' : 'bg-amber-600/90'
            }`}
          >
            {isTvPlaying ? 'Live' : 'Paused'}
          </span>
        </div>
      </div>
    </div>
  );
};
