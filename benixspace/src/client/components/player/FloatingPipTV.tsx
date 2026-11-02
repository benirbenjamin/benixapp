import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, X, Maximize2, Tv, Move, Zap, Video as VideoIcon, ExternalLink } from 'lucide-react';
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
    setIsTvPipActive,
    activePipMedia,
    closePipMedia
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

  // Media playback state for generic video/short pip
  const [isMediaPlaying, setIsMediaPlaying] = useState(true);
  const [isMediaMuted, setIsMediaMuted] = useState(false);

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

  // Determine whether TV PiP should show
  const shouldShowTvPip =
    !isTvPipDismissed &&
    activeTvStation !== null &&
    hasTvStarted &&
    (location.pathname !== '/tv' || hasScrolledPastTv);

  // Show PiP if either TV PiP or active video/short PiP is active
  const isShortsPage = location.pathname === '/shorts';
  const isVideosPage = location.pathname.startsWith('/videos');
  
  const shouldShowMediaPip =
    activePipMedia !== null &&
    ((activePipMedia.type === 'short' && !isShortsPage) ||
     (activePipMedia.type === 'video' && !isVideosPage) ||
     location.pathname === '/');

  const isVisible = shouldShowTvPip || shouldShowMediaPip;

  // Sync active PiP state with PlayerContext so main TV player mutes/pauses
  useEffect(() => {
    setIsTvPipActive(Boolean(shouldShowTvPip));
    return () => {
      setIsTvPipActive(false);
    };
  }, [shouldShowTvPip, setIsTvPipActive]);

  const isShortType = activePipMedia?.type === 'short';

  // Initialize initial bottom-right position once mounted
  useEffect(() => {
    if (isVisible && pos === null && typeof window !== 'undefined') {
      const defaultWidth = isShortType ? (window.innerWidth < 640 ? 190 : 220) : (window.innerWidth < 640 ? 260 : 320);
      const defaultHeight = isShortType ? (window.innerWidth < 640 ? 300 : 360) : (window.innerWidth < 640 ? 180 : 220);
      const bottomOffset = currentStation ? 110 : 80;
      setPos({
        x: Math.max(16, window.innerWidth - defaultWidth - 24),
        y: Math.max(16, window.innerHeight - defaultHeight - bottomOffset)
      });
    }
  }, [isVisible, currentStation, pos, isShortType]);

  // Video stream attach
  useEffect(() => {
    if (!isVisible) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Enable native OS auto Picture-in-Picture
    try {
      (video as any).autoPictureInPicture = true;
    } catch {}

    // 1. If TV Station is playing
    if (shouldShowTvPip && activeTvStation) {
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
    } 
    // 2. If Generic Video or Short is playing
    else if (shouldShowMediaPip && activePipMedia) {
      const mediaSrc = activePipMedia.videoUrl || activePipMedia.streamUrl || '';
      if (mediaSrc) {
        video.src = mediaSrc;
        video.muted = isMediaMuted;
        if (activePipMedia.currentTime) {
          video.currentTime = activePipMedia.currentTime;
        }
        video.play().catch(() => {});
        setIsMediaPlaying(true);
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isVisible, shouldShowTvPip, shouldShowMediaPip, activeTvStation?.stream_url, activeTvStation?.streamUrl, activePipMedia?.videoUrl, activePipMedia?.streamUrl]);

  // Sync mute for TV
  useEffect(() => {
    if (videoRef.current && shouldShowTvPip) {
      videoRef.current.muted = isTvMuted;
    }
  }, [isTvMuted, shouldShowTvPip]);

  // Sync play/pause for TV
  useEffect(() => {
    if (!videoRef.current || !shouldShowTvPip) return;
    if (isTvPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else if (!isTvPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isTvPlaying, shouldShowTvPip]);

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
    const pipWidth = isShortType ? (window.innerWidth < 640 ? 190 : 220) : (window.innerWidth < 640 ? 260 : 320);
    const pipHeight = isShortType ? (window.innerWidth < 640 ? 300 : 360) : (window.innerWidth < 640 ? 180 : 220);

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

  // Request Native OS Picture-in-Picture
  const triggerNativePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('Native PiP error:', err);
    }
  };

  if (!isVisible || !pos) return null;

  const title = shouldShowTvPip
    ? activeTvStation?.name || 'Live TV'
    : activePipMedia?.title || 'Video Player';

  const isPlayingNow = shouldShowTvPip ? isTvPlaying : isMediaPlaying;
  const isMutedNow = shouldShowTvPip ? isTvMuted : isMediaMuted;

  const handleTogglePlay = () => {
    if (shouldShowTvPip) {
      toggleTvPlay();
    } else {
      const v = videoRef.current;
      if (v) {
        if (v.paused) {
          v.play().catch(() => {});
          setIsMediaPlaying(true);
        } else {
          v.pause();
          setIsMediaPlaying(false);
        }
      }
    }
  };

  const handleToggleMute = () => {
    if (shouldShowTvPip) {
      toggleTvMute();
    } else {
      const v = videoRef.current;
      if (v) {
        v.muted = !isMediaMuted;
        setIsMediaMuted(!isMediaMuted);
      }
    }
  };

  const handleClose = () => {
    if (shouldShowTvPip) {
      closeTvPip();
    } else {
      closePipMedia();
    }
  };

  const handleMaximize = () => {
    if (shouldShowTvPip) {
      navigate('/tv');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activePipMedia) {
      if (activePipMedia.type === 'short') {
        navigate('/shorts');
      } else {
        navigate(activePipMedia.id ? `/videos/${activePipMedia.id}` : '/videos');
      }
      closePipMedia();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 55,
        touchAction: 'none'
      }}
      className={`${
        isShortType ? 'w-48 sm:w-56' : 'w-64 sm:w-80'
      } bg-[#0B0E14] rounded-2xl overflow-hidden shadow-2xl border-2 border-indigo-500/50 text-white select-none transition-shadow group animate-in fade-in`}
    >
      {/* Draggable Header Bar */}
      <div
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        className="p-2 bg-slate-900/95 flex items-center justify-between border-b border-white/10 cursor-move"
        title="Drag to reposition Picture-in-Picture window"
      >
        <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
          <Move className="w-3 h-3 text-slate-400 group-hover:text-indigo-400 shrink-0" />
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isPlayingNow ? 'bg-red-500 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span className="font-bold text-[11px] text-white truncate flex items-center gap-1">
            {shouldShowTvPip ? (
              <Tv className="w-3 h-3 text-blue-400 shrink-0" />
            ) : isShortType ? (
              <Zap className="w-3 h-3 text-rose-400 shrink-0" />
            ) : (
              <VideoIcon className="w-3 h-3 text-purple-400 shrink-0" />
            )}
            <span className="truncate">{title}</span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          {/* Native OS Picture-in-Picture Trigger Button */}
          <button
            onClick={triggerNativePip}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-indigo-300 transition-colors"
            title="Pop out over desktop / other apps (Native OS PiP)"
          >
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={handleToggleMute}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title={isMutedNow ? 'Unmute' : 'Mute'}
          >
            {isMutedNow ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
          </button>

          <button
            onClick={handleMaximize}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-blue-400 transition-colors"
            title="Maximize Player"
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Close PiP"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className={`relative ${isShortType ? 'aspect-[9/16]' : 'aspect-video'} bg-black flex items-center justify-center`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          autoPlay
          muted={isMutedNow}
        />

        {/* Hover Center Play/Pause Overlay */}
        <div
          onClick={handleTogglePlay}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
        >
          <div className="p-2 rounded-full bg-indigo-600/90 text-white shadow-lg hover:scale-110 transition-transform">
            {isPlayingNow ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </div>
        </div>
      </div>
    </div>
  );
};
