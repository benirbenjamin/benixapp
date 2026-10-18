import React, { useEffect, useRef, useState } from 'react';
import {
  X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Radio, Tv, Sparkles,
  Download, CheckCircle2, RotateCw, MonitorPlay, Film, Share2
} from 'lucide-react';
import type { Station } from '../../services/mediaService';
import { RadioAdModal } from '../ads/RadioAdModal';
import { TVAdOverlay } from '../ads/TVAdOverlay';
import { CompanionAdBanner } from '../ads/CompanionAdBanner';
import { ADS_CONFIG } from '../../config/ads';

interface BenixPlayerModalProps {
  station: Station | null;
  onClose: () => void;
}

// Track last radio pre-roll timestamp globally (module-level throttle of 4 minutes)
let lastRadioAdTimestamp = 0;

export const BenixPlayerModal: React.FC<BenixPlayerModalProps> = ({ station, onClose }) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [status, setStatus] = useState<'connecting' | 'playing' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Ad states
  const [isRadioAdActive, setIsRadioAdActive] = useState<boolean>(false);
  const [isTvAdOverlayActive, setIsTvAdOverlayActive] = useState<boolean>(false);
  const [hasTriggeredInitialTvAd, setHasTriggeredInitialTvAd] = useState<boolean>(false);

  const isVideo = station?.station_type === 'TV' || station?.stream_type === 'HLS' || station?.stream_type === 'VIDEO';

  // 1. Force Load Video / Radio Pre-Roll Ad immediately on play
  useEffect(() => {
    if (!station) return;

    if (!isVideo) {
      // Force load radio pre-roll ad
      setIsRadioAdActive(true);
      lastRadioAdTimestamp = Date.now();
    } else {
      // Force load video / TV pre-roll ad immediately
      setIsRadioAdActive(false);
      setIsTvAdOverlayActive(true);
      setHasTriggeredInitialTvAd(true);
    }
  }, [station, isVideo]);

  // 2. TV Interstitial Timer (60s initial delay, then 300s repeat)
  useEffect(() => {
    if (!station || !isVideo || isTvAdOverlayActive) return;

    const initialDelay = ADS_CONFIG.TV_AD_INITIAL_DELAY_SECONDS; // 60s
    const repeatInterval = ADS_CONFIG.TV_AD_INTERVAL_SECONDS; // 300s
    const targetDelay = hasTriggeredInitialTvAd ? repeatInterval : initialDelay;

    const timer = setTimeout(() => {
      setIsTvAdOverlayActive(true);
      setHasTriggeredInitialTvAd(true);
    }, targetDelay * 1000);

    return () => clearTimeout(timer);
  }, [station, isVideo, isTvAdOverlayActive, hasTriggeredInitialTvAd]);

  // 3. Fullscreen & Auto-Landscape Rotation Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull) {
        if (screen.orientation && (screen.orientation as any).unlock) {
          try {
            (screen.orientation as any).unlock();
          } catch (e) {}
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 4. Media Stream Loader
  useEffect(() => {
    if (!station) return;
    if (isRadioAdActive) return;

    setStatus('connecting');
    setErrorMessage('');
    setIsPlaying(true);

    const streamUrl = station.stream_url;

    if (isVideo && videoRef.current) {
      const video = videoRef.current;
      video.volume = volume;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video
          .play()
          .then(() => setStatus('playing'))
          .catch((err) => {
            console.warn('Native video play error:', err);
            setStatus('error');
            setErrorMessage('Click play to start broadcast.');
          });
      } else {
        const initHls = () => {
          if ((window as any).Hls && (window as any).Hls.isSupported()) {
            const hls = new (window as any).Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
              video.play().then(() => setStatus('playing')).catch(() => setStatus('error'));
            });
            hls.on((window as any).Hls.Events.ERROR, (_: any, data: any) => {
              if (data.fatal) {
                setStatus('error');
                setErrorMessage('Stream connection error. Try another channel.');
              }
            });
          } else {
            video.src = streamUrl;
            video.play().catch(() => setStatus('error'));
          }
        };

        if ((window as any).Hls) {
          initHls();
        } else {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
          script.onload = () => initHls();
          script.onerror = () => {
            video.src = streamUrl;
            video.play().catch(() => setStatus('error'));
          };
          document.head.appendChild(script);
        }
      }
    } else if (!isVideo && audioRef.current) {
      const audio = audioRef.current;
      audio.src = streamUrl;
      audio.volume = volume;
      audio
        .play()
        .then(() => setStatus('playing'))
        .catch(() => {
          setStatus('error');
          setErrorMessage('Click play to listen live.');
        });
    }
  }, [station, isVideo, isRadioAdActive]);

  if (!station) return null;

  const togglePlay = () => {
    if (isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    if (videoRef.current) videoRef.current.muted = newMute;
    if (audioRef.current) audioRef.current.muted = newMute;
  };

  // Fullscreen with Auto-Landscape Orientation Lock for TV and Video Plays
  const toggleFullscreen = async () => {
    const elem = playerContainerRef.current || videoRef.current;
    if (!elem) return;

    if (!isFullscreen) {
      try {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        }

        // Auto-rotate to landscape on mobile devices
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (oriErr) {
            console.log('Orientation lock requires full user gesture or unsupported:', oriErr);
          }
        }
        setIsFullscreen(true);
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }

        if (screen.orientation && (screen.orientation as any).unlock) {
          try {
            (screen.orientation as any).unlock();
          } catch (e) {}
        }
        setIsFullscreen(false);
      } catch (err) {
        console.warn('Exit fullscreen failed:', err);
      }
    }
  };

  // Picture in Picture toggle
  const togglePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (e) {
        console.warn('PiP error:', e);
      }
    }
  };

  // Download Video with BenixSpace Logo Footer / Watermark
  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = station.stream_url;
      link.download = `benix.space-${station.slug || 'stream'}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && isFullscreen) {
        setShowControls(false);
      }
    }, 3500);
  };

  return (
    <>
      {/* 1. Radio Pre-Roll Ad Modal */}
      {isRadioAdActive && (
        <RadioAdModal
          isOpen={isRadioAdActive}
          station={station}
          onComplete={() => {
            setIsRadioAdActive(false);
          }}
        />
      )}

      {/* 2. Main Stream Player Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-xl overflow-y-auto font-sans">
        <div
          ref={playerContainerRef}
          onMouseMove={handleMouseMove}
          className={`relative w-full max-w-4xl bg-[#0B0E14] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none max-w-none max-h-none h-screen' : 'max-h-[94vh]'
          }`}
        >
          
          {/* Top Header Bar */}
          <div className="flex items-center justify-between p-4 bg-[#111724]/90 border-b border-slate-800 text-white shrink-0 z-20">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md overflow-hidden bg-slate-800 p-1"
                style={{ backgroundColor: station.accent_color || '#0284c7' }}
              >
                {station.logo_url && station.logo_url !== '/logo.png' ? (
                  <img src={station.logo_url} alt={station.name} className="w-full h-full object-contain rounded-xl" />
                ) : (
                  station.station_type === 'TV' ? <Tv className="w-5 h-5" /> : <Radio className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-white tracking-tight">{station.name}</h3>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{station.frequency || station.location || 'Official Live Broadcast Feed'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Branded Download Video Button */}
              {isVideo && (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
                  title="Download Video with benix.space watermark footer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Close Player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Player Canvas Area */}
          <div className="relative bg-black flex-1 flex items-center justify-center overflow-hidden aspect-video">
            {isVideo ? (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                autoPlay
                controls={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                <audio ref={audioRef} autoPlay />
                <div
                  className="w-24 h-24 rounded-3xl p-3 shadow-2xl flex items-center justify-center border-2 border-white/10 animate-pulse"
                  style={{ backgroundColor: station.accent_color || '#0284c7' }}
                >
                  {station.logo_url && station.logo_url !== '/logo.png' ? (
                    <img src={station.logo_url} alt={station.name} className="w-full h-full object-contain rounded-2xl" />
                  ) : (
                    <Radio className="w-12 h-12 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-black text-white">{station.name}</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto line-clamp-2 mt-1">
                    {station.description || 'Broadcasting live audio 24/7 crystal clear on BenixSpace'}
                  </p>
                </div>

                {/* Animated Audio Equalizer */}
                <div className="flex items-center gap-1.5 h-8">
                  {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
                      style={{
                        height: isPlaying ? `${h}%` : '15%',
                        animation: isPlaying ? `bounce 1.${(i % 5) + 2}s infinite alternate` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* MANDATORY BRANDED WATERMARK FOOTER (benix.space logo) */}
            <div className="absolute bottom-4 right-4 z-20 pointer-events-none flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl">
              <img src="/logo.png" alt="BenixSpace Logo" className="w-4 h-4 object-contain" />
              <span className="text-[11px] font-black tracking-tight text-white drop-shadow">
                benix<span className="text-blue-400">.space</span>
              </span>
            </div>

            {/* Download Notification Banner */}
            {downloadSuccess && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Downloaded video with benix.space watermark footer!</span>
              </div>
            )}

            {/* Connecting State */}
            {status === 'connecting' && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2.5 text-white">
                  <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold tracking-wide">Connecting Live Stream...</span>
                </div>
              </div>
            )}

            {/* Error fallback overlay */}
            {status === 'error' && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-10">
                <div className="text-center space-y-3">
                  <p className="text-xs text-rose-400 font-semibold">{errorMessage || 'Stream is currently connecting.'}</p>
                  <button
                    onClick={togglePlay}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-2xl shadow-xl transition-all"
                  >
                    Retry Broadcast
                  </button>
                </div>
              </div>
            )}

            {/* TV Interstitial Ad Overlay (Inside Player) */}
            {isVideo && isTvAdOverlayActive && (
              <TVAdOverlay
                isOpen={isTvAdOverlayActive}
                stationName={station.name}
                onClose={() => setIsTvAdOverlayActive(false)}
              />
            )}
          </div>

          {/* Customized Player Controls Bar */}
          <div
            className={`p-3.5 bg-[#111724] border-t border-slate-800 flex items-center justify-between text-slate-300 shrink-0 z-20 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-lg active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  setIsMuted(val === 0);
                  if (videoRef.current) videoRef.current.volume = val;
                  if (audioRef.current) audioRef.current.volume = val;
                }}
                className="w-20 sm:w-28 accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {isVideo && (
                <>
                  <button
                    onClick={togglePiP}
                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors hidden sm:inline-flex"
                    title="Picture-in-Picture"
                  >
                    <MonitorPlay className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="p-2.5 rounded-2xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all flex items-center gap-1.5"
                    title="Full Screen (Auto-Rotates to Landscape on Mobile)"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    <span className="text-[11px] font-bold hidden md:inline">
                      {isFullscreen ? 'Exit Fullscreen' : 'Landscape Fullscreen'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 3. Stream Companion Banner (Auto-refreshes every 2.5 minutes without stream interruption) */}
          {!isFullscreen && (
            <div className="px-4 pb-2 bg-[#0B0E14] shrink-0">
              <CompanionAdBanner
                slot={ADS_CONFIG.SLOTS.TV_COMPANION_BANNER}
                label="Sponsored Stream Partner"
                refreshIntervalSeconds={ADS_CONFIG.TV_BANNER_REFRESH_SECONDS}
              />
            </div>
          )}

        </div>
      </div>
    </>
  );
};
