"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  FastForward,
  SkipForward,
  Lock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import GoogleAd from "@/components/ads/GoogleAd";
import { useApp } from "@/components/providers/AppProviders";
import { formatCurrency } from "@/lib/utils";

interface CustomVideoPlayerProps {
  videoId: string;
  videoUrl: string;
  title: string;
  thumbnailUrl?: string | null;
  duration?: number;
  isPaidVideo?: boolean;
  isPurchased?: boolean;
  price?: number;
  onPlayStart?: () => void;
}

export default function CustomVideoPlayer({
  videoId,
  videoUrl,
  title,
  thumbnailUrl,
  duration = 0,
  isPaidVideo = false,
  isPurchased = false,
  price = 0,
  onPlayStart,
}: CustomVideoPlayerProps) {
  const { settings } = useApp();

  // Settings configuration with defaults
  const adsEnabled = settings?.ads_enabled !== "false";
  const initialAdDelay = Number(settings?.ad_initial_delay_seconds) || 15; // 15 seconds
  const adInterval = Number(settings?.ad_interval_seconds) || 300; // 5 minutes (300 seconds)
  const adDuration = Number(settings?.ad_duration_seconds) || 12; // 12 seconds total
  const adSkipDelay = Number(settings?.ad_skip_delay_seconds) || 8; // 8 seconds non-skippable

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // In-Stream Ad State
  const [isAdActive, setIsAdActive] = useState(false);
  const [adSecondsRemaining, setAdSecondsRemaining] = useState(adDuration);
  const [canSkipAd, setCanSkipAd] = useState(false);
  const [adViewTracked, setAdViewTracked] = useState(false);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextAdTriggerRef = useRef<number>(initialAdDelay);
  const lastTriggeredAdRef = useRef<number>(-1);
  const playTriggeredRef = useRef<boolean>(false);

  // Check if YouTube
  const isYouTube = videoUrl?.includes("youtube.com") || videoUrl?.includes("youtu.be");

  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const ytid = match && match[2].length === 11 ? match[2] : "";
    return `https://www.youtube.com/embed/${ytid}?enablejsapi=1&autoplay=1&rel=0`;
  };

  // Track ad events (View / Click)
  const trackAdEvent = useCallback(
    (type: "VIEW" | "CLICK") => {
      fetch("/api/ads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, type }),
      }).catch((err) => console.warn("Failed to track ad:", err));
    },
    [videoId]
  );

  // Trigger an Ad Break
  const triggerAdBreak = useCallback(() => {
    if (!adsEnabled || isAdActive) return;

    setIsAdActive(true);
    setAdSecondsRemaining(adDuration);
    setCanSkipAd(false);
    setAdViewTracked(false);

    // Pause video
    if (isYouTube && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
        "*"
      );
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [adsEnabled, isAdActive, adDuration, isYouTube]);

  // Finish Ad Break and Resume Video
  const closeAdBreak = useCallback(() => {
    setIsAdActive(false);

    // Resume video
    if (isYouTube && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: "" }),
        "*"
      );
    } else if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }

    // Schedule next ad: 5 minutes from now
    nextAdTriggerRef.current = currentTime + adInterval;
  }, [isYouTube, currentTime, adInterval]);

  // Ad Break Timer Countdown
  useEffect(() => {
    let adIntervalTimer: NodeJS.Timeout | null = null;

    if (isAdActive) {
      adIntervalTimer = setInterval(() => {
        setAdSecondsRemaining((prev) => {
          const nextSec = prev - 1;
          const elapsed = adDuration - nextSec;

          // After skip delay (8s), enable Skip button and record successful View
          if (elapsed >= adSkipDelay && !canSkipAd) {
            setCanSkipAd(true);
          }

          if (elapsed >= adSkipDelay && !adViewTracked) {
            setAdViewTracked(true);
            trackAdEvent("VIEW");
          }

          // At 0s, end ad automatically
          if (nextSec <= 0) {
            clearInterval(adIntervalTimer!);
            closeAdBreak();
            return 0;
          }
          return nextSec;
        });
      }, 1000);
    }

    return () => {
      if (adIntervalTimer) clearInterval(adIntervalTimer);
    };
  }, [isAdActive, adDuration, adSkipDelay, canSkipAd, adViewTracked, trackAdEvent, closeAdBreak]);

  // Monitor Video Playback Time for Ad Breaks (15s, then every 5min)
  const handleTimeUpdate = () => {
    if (!videoRef.current || isAdActive) return;

    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Initial play trigger
    if (!playTriggeredRef.current && time > 0.5) {
      playTriggeredRef.current = true;
      onPlayStart?.();
    }

    // Check if time hit the ad schedule
    if (adsEnabled && time >= nextAdTriggerRef.current) {
      const scheduledTime = Math.floor(nextAdTriggerRef.current);
      if (lastTriggeredAdRef.current !== scheduledTime) {
        lastTriggeredAdRef.current = scheduledTime;
        triggerAdBreak();
      }
    }
  };

  // YouTube Periodic Timer Check for Ads
  useEffect(() => {
    if (!isYouTube || !adsEnabled) return;

    const ytTimer = setInterval(() => {
      if (isAdActive) return;

      setCurrentTime((prev) => {
        const nextTime = prev + 1;

        if (!playTriggeredRef.current && nextTime >= 1) {
          playTriggeredRef.current = true;
          onPlayStart?.();
        }

        if (nextTime >= nextAdTriggerRef.current) {
          const scheduledTime = Math.floor(nextAdTriggerRef.current);
          if (lastTriggeredAdRef.current !== scheduledTime) {
            lastTriggeredAdRef.current = scheduledTime;
            triggerAdBreak();
          }
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(ytTimer);
  }, [isYouTube, adsEnabled, isAdActive, triggerAdBreak, onPlayStart]);

  // Controls auto-hide timer
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isAdActive) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onContextMenu={(e) => {
        // Prevent direct right-click download for unpurchased for-sale videos
        if (isPaidVideo && !isPurchased) {
          e.preventDefault();
        }
      }}
      className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none group"
    >
      {/* 1. Video Element (YouTube iframe or HTML5 Video) */}
      {isYouTube ? (
        <iframe
          ref={iframeRef}
          src={getYouTubeEmbedUrl(videoUrl)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0 pointer-events-auto"
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl || undefined}
          autoPlay
          controlsList={isPaidVideo && !isPurchased ? "nodownload" : undefined}
          onPlay={() => {
            setIsPlaying(true);
            if (!playTriggeredRef.current) {
              playTriggeredRef.current = true;
              onPlayStart?.();
            }
          }}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setVideoDuration(videoRef.current.duration);
            }
          }}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />
      )}

      {/* 2. Paid / For-Sale Badge Indicator */}
      {isPaidVideo && (
        <div className="absolute top-3 left-3 flex items-center gap-2 z-20 pointer-events-none">
          <span className="px-3 py-1 bg-black/80 backdrop-blur text-white text-xs font-black rounded-lg shadow-md flex items-center gap-1.5 border border-white/10">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            {isPurchased ? "UNLOCKED & PURCHASED" : `FOR SALE: ${formatCurrency(price)}`}
          </span>
        </div>
      )}

      {/* 3. In-Stream Google Ad Break Overlay */}
      {isAdActive && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-300">
          {/* Top Bar: Ad Indicator & Ad Info */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-xs rounded uppercase shadow-xs">
                Ad &bull; 1 of 1
              </span>
              <span className="text-white text-xs font-bold drop-shadow">
                Advertisement by Google
              </span>
            </div>

            <span className="text-xs text-slate-300">
              Video resumes in {adSecondsRemaining}s
            </span>
          </div>

          {/* Central Google Ad Unit */}
          <div className="w-full max-w-2xl mx-auto my-auto">
            <GoogleAd
              placement="video-overlay"
              onAdClick={() => trackAdEvent("CLICK")}
            />
          </div>

          {/* Bottom Bar: Skip Ad Button & Countdown */}
          <div className="flex items-center justify-between z-10 pt-2">
            <div className="text-xs text-slate-300 font-medium">
              {!canSkipAd ? (
                <span>
                  You can skip this ad in{" "}
                  <strong className="text-amber-400 font-bold">
                    {Math.max(1, adSkipDelay - (adDuration - adSecondsRemaining))}s
                  </strong>
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Skip unlocked
                </span>
              )}
            </div>

            <button
              onClick={closeAdBreak}
              disabled={!canSkipAd}
              className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-lg ${
                canSkipAd
                  ? "bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer scale-100 animate-pulse"
                  : "bg-slate-800/80 text-slate-500 cursor-not-allowed border border-white/10"
              }`}
            >
              <span>{canSkipAd ? "Skip Ad" : `Skip in ${Math.max(1, adSkipDelay - (adDuration - adSecondsRemaining))}s`}</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Custom Video Controls (for HTML5 video) */}
      {!isYouTube && !isAdActive && (
        <div
          className={`absolute inset-x-0 bottom-0 z-30 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
            showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Progress Bar Scrubber with Ad Cue Markers */}
          <div className="relative w-full flex items-center mb-3">
            <input
              type="range"
              min={0}
              max={videoDuration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand transition-all hover:h-2.5"
            />
            {/* Visual marker at 15s for the initial ad */}
            {videoDuration > initialAdDelay && (
              <div
                style={{ left: `${(initialAdDelay / videoDuration) * 100}%` }}
                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-amber-400 rounded-full pointer-events-none"
                title="Ad break at 15s"
              />
            )}
          </div>

          {/* Controls Bottom Row */}
          <div className="flex items-center justify-between text-white text-xs sm:text-sm">
            {/* Left Controls: Play/Pause, Volume, Time */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-1 hover:text-brand transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <div className="flex items-center gap-1.5 group/vol">
                <button onClick={toggleMute} className="hover:text-brand">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none accent-brand cursor-pointer"
                />
              </div>

              <div className="text-[11px] sm:text-xs text-slate-300 font-mono">
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </div>
            </div>

            {/* Right Controls: Speed, Fullscreen */}
            <div className="flex items-center gap-3">
              {/* Speed Menu */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-0.5 text-[11px]">
                {[1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`px-1 py-0.5 rounded ${
                      playbackRate === rate ? "bg-brand text-white font-bold" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-1 hover:text-brand transition-colors"
                aria-label="Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
