import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Radio, Tv, Sparkles, ExternalLink } from 'lucide-react';
import type { Station } from '../../services/mediaService';

interface BenixPlayerModalProps {
  station: Station | null;
  onClose: () => void;
}

export const BenixPlayerModal: React.FC<BenixPlayerModalProps> = ({ station, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [status, setStatus] = useState<'connecting' | 'playing' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isVideo = station?.station_type === 'TV' || station?.stream_type === 'HLS' || station?.stream_type === 'VIDEO';

  useEffect(() => {
    if (!station) return;
    setStatus('connecting');
    setErrorMessage('');
    setIsPlaying(true);

    const streamUrl = station.stream_url;

    if (isVideo && videoRef.current) {
      const video = videoRef.current;
      video.volume = volume;

      // Check for native HLS (Safari, iOS, Android)
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
        // Try window.Hls (load via CDN script dynamically if not on window)
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
            // Fallback direct source
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
  }, [station]);

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

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#0F141F] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800 text-white">
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
                <h3 className="font-black text-sm text-white">{station.name}</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{station.frequency || station.location || 'Official Live Stream'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Canvas Area */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              autoPlay
              controls={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
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
                <h4 className="text-lg font-black text-white">{station.name}</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto line-clamp-2 mt-1">
                  {station.description || 'Broadcasting live audio 24/7 on Benix.Space'}
                </p>
              </div>

              {/* Audio Visualizer Waves animation */}
              <div className="flex items-center gap-1.5 h-8">
                {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                    style={{
                      height: isPlaying ? `${h}%` : '15%',
                      animation: isPlaying ? `bounce 1.${(i % 5) + 2}s infinite alternate` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Buffering/Connecting Overlay */}
          {status === 'connecting' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Tuning Live Broadcast...</span>
              </div>
            </div>
          )}

          {/* Error fallback overlay */}
          {status === 'error' && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4">
              <div className="text-center space-y-3">
                <p className="text-xs text-rose-400">{errorMessage || 'Stream is currently connecting.'}</p>
                <button
                  onClick={togglePlay}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Retry Stream
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Player Controls Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-lg"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
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

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
              Real Database HLS / Audio Stream
            </span>
            {isVideo && (
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
