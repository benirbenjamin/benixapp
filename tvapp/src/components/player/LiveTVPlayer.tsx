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
  AlertCircle,
  Loader2,
  Tv,
  Maximize2,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { Station } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useAds } from '../../context/AdContext';
import { AdPopupModal } from '../ads/AdPopupModal';
import { trackEvent } from '../../services/api';

interface LiveTVPlayerProps {
  station: Station;
  className?: string;
  autoPlay?: boolean;
}

export const LiveTVPlayer: React.FC<LiveTVPlayerProps> = ({
  station,
  className = '',
  autoPlay = false,
}) => {
  const {
    playTv,
    pauseTv,
    isTvPlaying,
    isTvMuted,
    toggleTvMute,
    setTvMuted,
    currentStation,
  } = usePlayer();

  const { isPopupOpen, closePopup } = useAds();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const bufferingTimerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Sticky on scroll state
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isSticky, setIsSticky] = useState<boolean>(false);
  const [isStickyDismissed, setIsStickyDismissed] = useState<boolean>(false);
  const [stickyPosition, setStickyPosition] = useState<'bottom-right' | 'top-right'>('bottom-right');
  const [playerHeight, setPlayerHeight] = useState<number>(0);

  // Monitor scroll to stick player when user scrolls past and TV is playing
  useEffect(() => {
    const handleScroll = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      if (isFullscreen) {
        if (isSticky) setIsSticky(false);
        return;
      }

      const rect = wrapper.getBoundingClientRect();
      // Scrolled past if bottom of original container is scrolled off the top viewport (header is ~68px)
      const isScrolledPast = rect.bottom < 80;

      if (isScrolledPast) {
        if (isTvPlaying && !isStickyDismissed) {
          if (!isSticky) {
            setPlayerHeight(wrapper.offsetHeight || 380);
            setIsSticky(true);
          }
        }
      } else {
        // Player is back in viewport
        if (isSticky) {
          setIsSticky(false);
        }
        if (isStickyDismissed) {
          setIsStickyDismissed(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTvPlaying, isSticky, isStickyDismissed, isFullscreen]);

  // When TV is paused, un-stick to respect user action
  useEffect(() => {
    if (!isTvPlaying && isSticky) {
      setIsSticky(false);
    }
  }, [isTvPlaying, isSticky]);

  const scrollToMainPlayer = () => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };



  const loadStream = () => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setIsBuffering(false);
    setError(null);

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = station.stream_url;

    if (Hls.isSupported()) {
      // High-efficiency HLS configuration matched to RTV Wowza chunk sizes (~10-12s per chunk)
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Chunk sizes are 10-12s; 30s buffer allows 2-3 segments smoothly without memory bloat
        maxBufferLength: 30,
        maxMaxBufferLength: 50,
        maxBufferSize: 25 * 1024 * 1024,
        backBufferLength: 0, // Discard past segments immediately to save data
        // Start 2 segments from live edge so playback starts instantly
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 5,
        startFragPrefetch: true,
        // Generous timeouts for smooth playback on mobile & slow Wi-Fi
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 6,
        fragLoadingTimeOut: 30000,
        fragLoadingMaxRetry: 8,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 6,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setIsBuffering(false);
        setError(null);
        if (autoPlay) {
          attemptPlay(false);
        }
      });

      // Self-healing recovery for network and media glitches
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.warn('HLS stream event:', data.type, data.details);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Recovering from network drop...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Recovering media buffer...');
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setError('Live TV stream connection reset. Click retry.');
              setIsLoading(false);
              pauseTv();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        setIsBuffering(false);
        if (autoPlay) {
          attemptPlay(false);
        }
      });
      video.addEventListener('error', () => {
        setIsLoading(false);
        setError('Live TV broadcast stream is currently offline.');
      });
    } else {
      setError('HLS playback is not supported by your browser.');
      setIsLoading(false);
    }
  };

  const attemptPlay = (startMutedIfBlocked = false) => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isTvMuted;
    video.volume = volume;
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          playTv(station);
          trackEvent({
            event_type: 'TV_PLAY',
            station_id: station.id,
          });
        })
        .catch((err) => {
          console.warn('Autoplay unmuted blocked by browser policy:', err);
          if (startMutedIfBlocked) {
            // Fallback to muted only if blocked by browser policy so video starts
            video.muted = true;
            setTvMuted(true);
            video.play().then(() => playTv(station)).catch(() => {});
          }
        });
    }
  };

  useEffect(() => {
    loadStream();

    return () => {
      if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [station.stream_url]);

  // Sync external play/pause from PlayerContext (e.g. when radio starts, pause TV!)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isTvPlaying && !video.paused) {
      video.pause();
    }
  }, [isTvPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      if (error) {
        loadStream();
      } else {
        // User gesture enables full unmuted audio!
        video.muted = isTvMuted;
        video.volume = volume;
        video.play().then(() => {
          playTv(station);
        }).catch(() => {
          attemptPlay(true);
        });
      }
    } else {
      video.pause();
      pauseTv();
    }
  };

  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    video.volume = clamped;
    setVolumeState(clamped);
    if (clamped > 0 && isTvMuted) {
      video.muted = false;
      setTvMuted(false);
    }
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMute = !isTvMuted;
    video.muted = nextMute;
    toggleTvMute();
  };

  // Fullscreen change listener and screen orientation lock/unlock handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFs);

      if (!isCurrentlyFs) {
        // Unlock orientation back to normal when exiting fullscreen
        try {
          if (screen.orientation && typeof (screen.orientation as any).unlock === 'function') {
            (screen.orientation as any).unlock();
          } else if ((screen as any).unlockOrientation) {
            (screen as any).unlockOrientation();
          }
        } catch (e) {
          // Ignore
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      try {
        if (screen.orientation && typeof (screen.orientation as any).unlock === 'function') {
          (screen.orientation as any).unlock();
        }
      } catch (e) {}
    };
  }, []);

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const isCurrentlyFs = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isCurrentlyFs) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen();
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
        } else if (video && (video as any).webkitEnterFullscreen) {
          // iOS Safari native video fullscreen
          (video as any).webkitEnterFullscreen();
          return;
        }

        setIsFullscreen(true);

        // Lock to landscape mode on mobile devices
        try {
          if (screen.orientation && typeof (screen.orientation as any).lock === 'function') {
            await (screen.orientation as any).lock('landscape');
          } else if ((screen as any).lockOrientation) {
            (screen as any).lockOrientation('landscape');
          } else if ((screen as any).mozLockOrientation) {
            (screen as any).mozLockOrientation('landscape');
          } else if ((screen as any).msLockOrientation) {
            (screen as any).msLockOrientation('landscape');
          }
        } catch (err) {
          // Expected on desktop or unsupported devices - safe fallback
          console.log('Orientation lock to landscape skipped/unsupported:', err);
        }
      } catch (err) {
        console.warn('Error entering fullscreen:', err);
      }
    } else {
      try {
        // Unlock orientation
        try {
          if (screen.orientation && typeof (screen.orientation as any).unlock === 'function') {
            (screen.orientation as any).unlock();
          } else if ((screen as any).unlockOrientation) {
            (screen as any).unlockOrientation();
          }
        } catch (e) {}

        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      } catch (err) {
        console.warn('Error exiting fullscreen:', err);
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isTvPlaying) setShowControls(false);
    }, 3500);
  };

  // Debounced buffering state (prevents flashing "Buffering" on normal micro-delays)
  const handleWaiting = () => {
    if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
    bufferingTimerRef.current = setTimeout(() => {
      setIsBuffering(true);
    }, 1200);
  };

  const handlePlaying = () => {
    if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
    setIsBuffering(false);
    setIsLoading(false);
    setError(null);
    playTv(station);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Zero Layout Shift Placeholder when Sticky */}
      {isSticky && (
        <div
          style={{ height: playerHeight > 0 ? `${playerHeight}px` : 'auto' }}
          onClick={scrollToMainPlayer}
          className="w-full aspect-video bg-slate-900/60 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-900/80 transition group"
        >
          <div className="w-12 h-12 rounded-2xl bg-rba-blue/20 text-rba-blue flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Tv className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-white text-sm font-bold">
              {station.name} is playing in Sticky Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 group-hover:text-amber-400 transition-colors flex items-center gap-1.5 mt-1">
            <Maximize2 className="w-3.5 h-3.5" />
            Click to scroll back to full broadcast
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isTvPlaying && setShowControls(false)}
        className={
          isFullscreen
            ? 'w-full h-full bg-black flex items-center justify-center select-none relative overflow-hidden'
            : isSticky
            ? `fixed z-50 transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border-2 border-rba-blue/80 bg-black ${
                stickyPosition === 'bottom-right'
                  ? `${currentStation ? 'bottom-20 sm:bottom-24' : 'bottom-6'} right-4 sm:right-6`
                  : 'top-20 right-4 sm:right-6'
              } w-[calc(100%-2rem)] max-w-[320px] sm:max-w-[380px] aspect-video group select-none animate-scaleUp`
            : `relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group select-none ${className}`
        }
      >
        <video
          ref={videoRef}
          playsInline
          muted={isTvMuted}
          onPlay={handlePlaying}
          onPause={() => pauseTv()}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onCanPlay={() => {
            if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
            setIsBuffering(false);
            setIsLoading(false);
          }}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />

        {/* Top Banner (Station Name + Live Badge or Sticky Header) */}
        {isSticky ? (
          <div className="absolute top-0 left-0 right-0 p-2 bg-slate-950/90 backdrop-blur-md flex items-center justify-between z-30 border-b border-white/10 text-white">
            <div
              className="flex items-center gap-1.5 min-w-0 cursor-pointer"
              onClick={scrollToMainPlayer}
              title="Click to scroll to full broadcast"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="font-bold text-xs truncate flex items-center gap-1">
                <Tv className="w-3 h-3 text-rba-blue shrink-0" />
                {station.name}
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-red-600 text-white font-bold uppercase">
                LIVE
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setStickyPosition((prev) =>
                    prev === 'bottom-right' ? 'top-right' : 'bottom-right'
                  )
                }
                className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition"
                title={`Dock to ${stickyPosition === 'bottom-right' ? 'top' : 'bottom'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={scrollToMainPlayer}
                className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition"
                title="Scroll to full broadcast"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsStickyDismissed(true);
                  setIsSticky(false);
                }}
                className="p-1 rounded-lg hover:bg-red-600/80 text-slate-300 hover:text-white transition"
                title="Dismiss sticky player"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/85 via-black/35 to-transparent flex items-center justify-between transition-opacity duration-300 pointer-events-none z-10 ${
              showControls || !isTvPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white text-[11px] font-black tracking-wider uppercase shadow-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Live
              </span>
              <h3 className="text-white font-bold text-sm sm:text-base drop-shadow-md flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-rba-blue" />
                {station.name}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {station.frequency && (
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                  {station.frequency}
                </span>
              )}
            </div>
          </div>
        )}

      {/* Loading Overlay (Initial Load) */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] pointer-events-none z-20">
          <Loader2 className="w-10 h-10 text-rba-blue animate-spin mb-2" />
          <p className="text-white text-xs sm:text-sm font-semibold tracking-wide">
            Connecting to live broadcast...
          </p>
        </div>
      )}

      {/* Buffering Indicator (Only appears if stalled for > 1.2s, non-intrusive) */}
      {isBuffering && !isLoading && !error && (
        <div className="absolute top-14 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-sm text-white text-xs font-semibold border border-white/10 animate-fadeIn">
          <Loader2 className="w-3.5 h-3.5 text-rba-yellow animate-spin" />
          <span>Buffering stream...</span>
        </div>
      )}

      {/* Error & Reconnect Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-30">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h4 className="text-white font-bold text-base mb-1">Live Broadcast Interrupted</h4>
          <p className="text-slate-300 text-xs max-w-sm mb-5">{error}</p>
          <button
            onClick={loadStream}
            className="px-5 py-2.5 rounded-xl bg-rba-yellow hover:bg-amber-400 text-rba-dark font-bold text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" /> Reconnect Live TV
          </button>
        </div>
      )}

      {/* Center Big Play Button when paused */}
      {!isTvPlaying && !isLoading && !error && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rba-blue/95 hover:bg-rba-blue text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 z-20"
          aria-label="Play Live TV"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
        </button>
      )}

      {/* Tap to Unmute Banner if browser blocked sound on initial autoplay */}
      {isTvPlaying && isTvMuted && (
        <button
          onClick={() => {
            if (videoRef.current) videoRef.current.muted = false;
            setTvMuted(false);
          }}
          className="absolute top-14 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/95 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg animate-bounce transition-all"
        >
          <VolumeX className="w-4 h-4" />
          <span>Sound muted by browser • Tap to unmute</span>
        </button>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 ${
          showControls || !isTvPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
            aria-label={isTvPlaying ? 'Pause' : 'Play'}
          >
            {isTvPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              aria-label="Toggle mute"
            >
              {isTvMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-rba-yellow" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isTvMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 sm:w-24 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-rba-blue"
              aria-label="Volume"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Ad Modal rendered inside player element to support Fullscreen TV broadcast mode */}
      {isPopupOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <AdPopupModal isOpen={isPopupOpen} onClose={closePopup} />
        </div>
      )}
    </div>
    </div>
  );
};
