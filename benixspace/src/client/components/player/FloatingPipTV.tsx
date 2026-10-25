import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, X, Maximize2, Tv, Move } from 'lucide-react';
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
    closeTvPip
  } = usePlayer();

  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Position state for movable Picture-in-Picture
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  // Track if user scrolled past the TV player when on `/tv`
  const [hasScrolledPastTv, setHasScrolledPastTv] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === '/tv') {
        const threshold = 400;
        setHasScrolledPastTv(window.scrollY > threshold);
      } else {
        setHasScrolledPastTv(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Determine whether to display PiP:
  // 1) Navigated away from `/tv` while TV has started, OR
  // 2) On `/tv` and scrolled down past the main player
  const shouldShowPip =
    !isTvPipDismissed &&
    activeTvStation !== null &&
    hasTvStarted &&
    (location.pathname !== '/tv' || hasScrolledPastTv);

  // Initialize initial bottom-right position once mounted
  useEffect(() => {
    if (shouldShowPip && pos === null && typeof window !== 'undefined') {
      const defaultWidth = window.innerWidth < 640 ? 260 : 320;
      const defaultHeight = window.innerWidth < 640 ? 180 : 220;
      const bottomOffset = currentStation ? 110 : 80;
      setPos({
        x: Math.max(16, window.innerWidth - defaultWidth - 24),
        y: Math.max(16, window.innerHeight - defaultHeight - bottomOffset)
      });
    }
  }, [shouldShowPip, currentStation, pos]);

  // HLS stream attach
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

    const streamUrl = activeTvStation.stream_url || activeTvStation.streamUrl || '';
    if (!streamUrl) return;

    if (Hls.isSupported()) {
      const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
      const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
      const slow = conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g' || conn?.effectiveType === '3g' || (conn?.downlink && conn.downlink < 1.8);

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: slow ? 0 : 20,
        maxBufferLength: slow ? 10 : 25,
        maxMaxBufferLength: slow ? 20 : 50,
        fragLoadingMaxRetry: 8,
        manifestLoadingMaxRetry: 6,
        capLevelToPlayerSize: true,
        startLevel: slow ? 0 : -1,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = isTvMuted;
        if (isTvPlaying) {
          video.play().catch(() => {});
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.muted = isTvMuted;
      if (isTvPlaying) {
        video.play().catch(() => {});
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [shouldShowPip, activeTvStation?.stream_url, activeTvStation?.streamUrl]);

  // Sync mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isTvMuted;
    }
  }, [isTvMuted]);

  // Sync play/pause
  useEffect(() => {
    if (!videoRef.current) return;
    if (isTvPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else if (!isTvPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isTvPlaying]);

  // Drag Handlers (Mouse & Touch)
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!pos) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: pos.x,
      startY: pos.y
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = clientX - dragStartRef.current.mouseX;
    const deltaY = clientY - dragStartRef.current.mouseY;
    const pipWidth = window.innerWidth < 640 ? 260 : 320;
    const pipHeight = window.innerWidth < 640 ? 180 : 220;

    const newX = Math.max(10, Math.min(window.innerWidth - pipWidth - 10, dragStartRef.current.startX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - pipHeight - 10, dragStartRef.current.startY + deltaY));

    setPos({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleDragEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  if (!shouldShowPip || !activeTvStation || !pos) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 55,
        touchAction: 'none'
      }}
      className="w-64 sm:w-80 bg-[#0B0E14] rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-500/50 text-white select-none transition-shadow group"
    >
      {/* Draggable Header Bar */}
      <div
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        className="p-2.5 bg-slate-900/95 flex items-center justify-between border-b border-white/10 cursor-move"
        title="Drag to reposition Picture-in-Picture window"
      >
        <div className="flex items-center gap-2 min-w-0 pointer-events-none">
          <Move className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isTvPlaying ? 'bg-red-500 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span className="font-bold text-xs text-white truncate flex items-center gap-1">
            <Tv className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            {activeTvStation.name}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={toggleTvMute}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title={isTvMuted ? 'Unmute' : 'Mute'}
          >
            {isTvMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              navigate('/tv');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-blue-400 transition-colors"
            title="Maximize TV"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={closeTvPip}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Close TV"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          autoPlay
          muted={isTvMuted}
        />

        {/* Hover Center Play/Pause Overlay */}
        <div
          onClick={toggleTvPlay}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
        >
          <div className="p-2.5 rounded-full bg-blue-600/90 text-white shadow-lg hover:scale-110 transition-transform">
            {isTvPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </div>
        </div>
      </div>
    </div>
  );
};
