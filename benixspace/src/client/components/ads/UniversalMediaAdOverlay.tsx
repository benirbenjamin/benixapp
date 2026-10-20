import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Volume2, ShieldCheck, X, ExternalLink } from 'lucide-react';
import { ADS_CONFIG } from '../../config/ads';
import { AdSenseUnit } from '../common/AdSenseUnit';

interface SubmittedAd {
  id: string;
  title: string;
  description: string;
  targetUrl: string;
  mediaUrl?: string;
  mediaType?: string;
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
}

// Module-level rotation counter to strictly enforce 2 Google Ads : 1 Submitted Ad cycle
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
}) => {
  const [countdown, setCountdown] = useState<number>(countdownDuration);
  const [activeCustomAd, setActiveCustomAd] = useState<SubmittedAd | null>(null);
  const [isCustomTurn, setIsCustomTurn] = useState<boolean>(false);

  const hasRecordedViewRef = useRef<boolean>(false);
  const hasRecordedClickRef = useRef<boolean>(false);

  // Initialize ad slot and rotation on open
  useEffect(() => {
    if (!isOpen) {
      setCountdown(countdownDuration);
      setActiveCustomAd(null);
      setIsCustomTurn(false);
      hasRecordedViewRef.current = false;
      hasRecordedClickRef.current = false;
      return;
    }

    setCountdown(countdownDuration);
    hasRecordedViewRef.current = false;
    hasRecordedClickRef.current = false;

    // Strict 2:1 Rotation: (count % 3 === 2) -> Custom Submitted Ad; otherwise -> Google AdSense
    const currentCount = globalAdImpressionCounter++;
    const shouldShowCustom = currentCount % 3 === 2;

    if (shouldShowCustom) {
      fetch('/api/ads/active')
        .then((res) => res.json())
        .then((data) => {
          if (data?.ads && Array.isArray(data.ads) && data.ads.length > 0) {
            const randomAd = data.ads[Math.floor(Math.random() * data.ads.length)];
            setActiveCustomAd(randomAd);
            setIsCustomTurn(true);
            // Track custom ad impression
            fetch('/api/ads/track-impression', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ adId: randomAd.id }),
            }).catch(() => {});
          } else {
            setIsCustomTurn(false);
          }
        })
        .catch(() => {
          setIsCustomTurn(false);
        });
    } else {
      setIsCustomTurn(false);
    }
  }, [isOpen, countdownDuration]);

  // Record quiet reward to creator wallet (silent: no transaction log chime/popup)
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
        adType: isCustomTurn ? 'custom' : 'google',
        creatorId: creatorId || undefined,
        videoId: videoId || undefined,
      }),
    }).catch(() => {});
  };

  // Immediate Countdown Timer (Reliably counts down every second from mount)
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(countdownDuration);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sendAdReward('view');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdownDuration, onClose]);

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
    // If skipping after at least 5s watched or finished, record view reward
    if (countdownDuration - countdown >= 5 || countdown <= 1) {
      sendAdReward('view');
    }
    onClose();
  };

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.max(0, ((countdownDuration - countdown) / countdownDuration) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0F1523] text-white rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden animate-scaleUp">
        
        {/* Top Header Bar */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-900 via-indigo-950 to-[#0F1523] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {isCustomTurn ? 'Partner Advertisement' : 'Google AdSense Sponsor'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/70 border border-amber-400/40 text-xs font-black text-amber-300">
            <span>Ad: <strong className="text-white text-sm ml-0.5 font-black">{countdown}s</strong></span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto">
          
          {/* Active Audio / Media indicator */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-300 font-semibold bg-[#182032] py-1.5 px-3 rounded-xl border border-slate-700/60 shrink-0">
            <Volume2 className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
            <span className="truncate">Media active • {title}</span>
          </div>

          {/* Ad Container: Custom Submitted Ad OR Real Google AdSense */}
          {isCustomTurn && activeCustomAd ? (
            <div className="rounded-2xl bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-500/40 p-3 space-y-2 text-left">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold border-b border-slate-800 pb-1">
                <span className="flex items-center gap-1 text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Benix Partner
                </span>
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Sponsored
                </span>
              </div>

              {activeCustomAd.mediaUrl && (
                <img
                  src={activeCustomAd.mediaUrl}
                  alt={activeCustomAd.title}
                  className="w-full h-28 sm:h-32 object-cover rounded-xl border border-slate-800"
                />
              )}

              <div>
                <p className="font-black text-sm text-white line-clamp-1">{activeCustomAd.title}</p>
                <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{activeCustomAd.description}</p>
              </div>

              <button
                type="button"
                onClick={handleCustomAdClick}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-600/30"
              >
                <span>Visit Sponsor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={handleGoogleAdClick}
              className="bg-[#090D14] rounded-2xl p-2 border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[120px] max-h-[220px] relative overflow-hidden"
            >
              <AdSenseUnit
                slot={slot || '7034214536'}
                clientId={ADS_CONFIG.CLIENT_ID}
                format="rectangle"
                responsive={true}
                className="my-0"
              />
            </div>
          )}

          {/* Animated Progress Bar */}
          <div className="space-y-1 shrink-0 pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {isCustomTurn ? 'Verified Partner Campaign' : 'Official Google AdSense'}
              </span>
              <span className="text-amber-400 font-black">
                {countdown}s remaining
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Bar: Auto-resumes or Skip after 5s */}
        <div className="px-4 py-2 bg-black/60 border-t border-slate-800 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Resumes in {countdown}s
          </span>

          {countdown <= 5 ? (
            <button
              type="button"
              onClick={handleSkipOrComplete}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Skip Ad"
            >
              <X className="w-3.5 h-3.5" />
              <span>Skip ({countdown}s)</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60">
              Skip in {countdown - 5}s
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
