import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Volume2, VolumeX, ShieldCheck, X, ExternalLink, Play } from 'lucide-react';
import { ADS_CONFIG } from '../../config/ads';
import { AdSenseUnit } from '../common/AdSenseUnit';
import { getEffectiveVideoAd, SponsorAdItem } from '../../config/sponsorAds';

interface SubmittedAd {
  id: string;
  title: string;
  description: string;
  targetUrl: string;
  mediaUrl?: string;
  videoUrl?: string;
  mediaType?: string;
  ctaText?: string;
}

interface UniversalMediaAdOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType?: 'tv' | 'video' | 'radio';
  title?: string;
  creatorId?: string;
  videoId?: string;
  slot?: string;
  countdownDuration?: number;
  forceVideoAd?: boolean;
}

// Module-level rotation counter
let globalAdImpressionCounter = 0;

export const UniversalMediaAdOverlay: React.FC<UniversalMediaAdOverlayProps> = ({
  isOpen,
  onClose,
  mediaType = 'video',
  title = 'Benix Stream',
  creatorId,
  videoId,
  slot = ADS_CONFIG.SLOTS.VIDEO_WATCH_BANNER,
  countdownDuration = 10,
  forceVideoAd = true,
}) => {
  const [countdown, setCountdown] = useState<number>(countdownDuration);
  const [activeCustomAd, setActiveCustomAd] = useState<SponsorAdItem | SubmittedAd | null>(null);
  const [isCustomTurn, setIsCustomTurn] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [googleAdUnfilled, setGoogleAdUnfilled] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasRecordedViewRef = useRef<boolean>(false);
  const hasRecordedClickRef = useRef<boolean>(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Initialize ad slot and rotation on open
  useEffect(() => {
    if (!isOpen) {
      setCountdown(countdownDuration);
      setActiveCustomAd(null);
      setIsCustomTurn(true);
      setGoogleAdUnfilled(false);
      hasRecordedViewRef.current = false;
      hasRecordedClickRef.current = false;
      return;
    }

    setCountdown(countdownDuration);
    hasRecordedViewRef.current = false;
    hasRecordedClickRef.current = false;
    setGoogleAdUnfilled(false);

    const isVideoOrTv = mediaType === 'video' || mediaType === 'tv' || forceVideoAd;

    // For video playing, TV and single ad load: force video ads
    const currentCount = globalAdImpressionCounter++;
    // In video/TV mode, if forceVideoAd is true, we always guarantee a video ad is loaded
    const shouldShowCustom = isVideoOrTv ? true : (currentCount % 3 === 2);

    fetch('/api/ads/active')
      .then((res) => res.json())
      .then((data) => {
        const adsList = data?.ads && Array.isArray(data.ads) ? data.ads : [];
        if (isVideoOrTv) {
          const videoAd = getEffectiveVideoAd(adsList, currentCount);
          setActiveCustomAd(videoAd);
          setIsCustomTurn(true);
        } else if (shouldShowCustom && adsList.length > 0) {
          const randomAd = adsList[Math.floor(Math.random() * adsList.length)];
          setActiveCustomAd(randomAd);
          setIsCustomTurn(true);
        } else {
          setIsCustomTurn(false);
          const fallbackAd = getEffectiveVideoAd(adsList, currentCount);
          setActiveCustomAd(fallbackAd);
        }
      })
      .catch(() => {
        const fallbackAd = getEffectiveVideoAd([], currentCount);
        setActiveCustomAd(fallbackAd);
        setIsCustomTurn(true);
      });
  }, [isOpen, countdownDuration, mediaType, forceVideoAd]);

  // Attempt video autoplay with sound once ready
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Browser autoplay policy might require muted start
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [isOpen, activeCustomAd]);

  // Record quiet reward to creator wallet
  const sendAdReward = (type: 'view' | 'click') => {
    if (type === 'view' && hasRecordedViewRef.current) return;
    if (type === 'click' && hasRecordedClickRef.current) return;

    if (type === 'view') hasRecordedViewRef.current = true;
    if (type === 'click') hasRecordedClickRef.current = true;

    fetch('/api/ads/record-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        adType: isCustomTurn || googleAdUnfilled ? 'custom' : 'google',
        creatorId: creatorId || undefined,
        videoId: videoId || undefined,
        mediaType: mediaType || 'video',
      }),
    }).catch(() => {});
  };

  const sendAdRewardRef = useRef(sendAdReward);
  sendAdRewardRef.current = sendAdReward;

  // Immediate Countdown Timer (Reliably counts down every second from mount)
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(countdownDuration);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sendAdRewardRef.current('view');
          onCloseRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdownDuration]);

  const handleCustomAdClick = () => {
    sendAdReward('click');
    if (activeCustomAd) {
      fetch('/api/ads/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: activeCustomAd.id }),
      }).catch(() => {});
      if (activeCustomAd.targetUrl) {
        window.open(activeCustomAd.targetUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleGoogleAdClick = () => {
    sendAdReward('click');
  };

  const handleSkipOrComplete = () => {
    if (countdownDuration - countdown >= 5 || countdown <= 1) {
      sendAdReward('view');
    }
    onClose();
  };

  if (!isOpen) return null;

  const isVideoMode = mediaType === 'video' || mediaType === 'tv' || forceVideoAd || (activeCustomAd && (activeCustomAd as any).videoUrl);
  const progressPercent = Math.min(100, Math.max(0, ((countdownDuration - countdown) / countdownDuration) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md select-none animate-fadeIn overflow-hidden">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0F1523] text-white rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col h-auto max-h-[95dvh] sm:max-h-[90vh] overflow-hidden animate-scaleUp">
        
        {/* Top Header Bar */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-900 via-indigo-950 to-[#0F1523] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {isVideoMode ? 'Featured Video Advertisement' : (isCustomTurn ? 'Partner Advertisement' : 'Google AdSense Sponsor')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/70 border border-amber-400/40 text-xs font-black text-amber-300 shrink-0">
            <span>Ad: <strong className="text-white text-sm ml-0.5 font-black">{countdown}s</strong></span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-4 space-y-2 flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Active Audio / Media indicator */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-300 font-semibold bg-[#182032] py-1 px-3 rounded-xl border border-slate-700/60 shrink-0">
            <Volume2 className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
            <span className="truncate">Media active • {title}</span>
          </div>

          {/* Forced Video Ad Player for Video Playing, TV and Single Ad Load */}
          {isVideoMode && activeCustomAd ? (
            <div className="rounded-2xl bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-500/40 p-2.5 sm:p-3 space-y-2 text-left shrink overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-semibold border-b border-slate-800/80 pb-1 shrink-0">
                <span className="flex items-center gap-1 text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Verified Benix Video Partner
                </span>
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Sponsored Video
                </span>
              </div>

              {/* Video Player Container */}
              <div
                onClick={handleCustomAdClick}
                className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 shrink flex items-center justify-center bg-black cursor-pointer group"
              >
                {(activeCustomAd as any).videoUrl ? (
                  <video
                    ref={videoRef}
                    src={(activeCustomAd as any).videoUrl}
                    poster={activeCustomAd.mediaUrl}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={activeCustomAd.mediaUrl}
                    alt={activeCustomAd.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Sound Toggle Button */}
                {(activeCustomAd as any).videoUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                      }
                    }}
                    className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1.5 border border-white/20 backdrop-blur-md shadow-md transition z-20"
                    title={isMuted ? 'Tap to unmute ad audio' : 'Mute ad audio'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>
                )}

                {/* Playing Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-black uppercase text-amber-300 border border-amber-400/30 flex items-center gap-1 backdrop-blur-md pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  HD Video Ad
                </div>
              </div>

              <div className="shrink-0">
                <p className="font-black text-xs sm:text-sm text-white line-clamp-1">{activeCustomAd.title}</p>
                <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 mt-0.5 leading-snug">{activeCustomAd.description}</p>
              </div>

              <button
                type="button"
                onClick={handleCustomAdClick}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-600/30 shrink-0 cursor-pointer active:scale-95"
              >
                <span>{activeCustomAd.ctaText || 'Visit Sponsor'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={handleGoogleAdClick}
              className="bg-[#090D14] rounded-2xl p-2 border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[100px] max-h-[180px] relative overflow-hidden shrink"
            >
              <AdSenseUnit
                slot={slot || '7034214536'}
                clientId={ADS_CONFIG.CLIENT_ID}
                format="rectangle"
                responsive={true}
                className="my-0 max-h-[170px]"
                onStatusChange={(status) => {
                  if (status === 'unfilled') {
                    setGoogleAdUnfilled(true);
                  }
                }}
              />
            </div>
          )}

          {/* Animated Progress Bar */}
          <div className="space-y-1 shrink-0 pt-0.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Video Ad • Creator earns revenue
              </span>
              <span className="text-amber-400 font-black">
                {countdown}s remaining
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-1 shrink-0 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[200px]">
              Reward supports <strong className="text-white">@{creatorId || 'Streamer'}</strong>
            </span>

            <button
              type="button"
              onClick={handleSkipOrComplete}
              disabled={countdownDuration - countdown < 5 && countdown > 1}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                countdownDuration - countdown >= 5 || countdown <= 1
                  ? 'bg-slate-800 hover:bg-slate-700 text-white cursor-pointer active:scale-95 border border-slate-700'
                  : 'bg-slate-900/50 text-slate-500 cursor-not-allowed border border-slate-800'
              }`}
            >
              <span>{countdownDuration - countdown >= 5 || countdown <= 1 ? 'Continue Stream' : `Skip in ${Math.max(1, 5 - (countdownDuration - countdown))}s`}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
