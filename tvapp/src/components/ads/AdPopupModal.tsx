import React, { useEffect, useState, useRef } from 'react';
import { Clock, Sparkles, Volume2, ShieldCheck, X } from 'lucide-react';
import { ADS_CONFIG } from '../../config/ads';
import { useAds } from '../../context/AdContext';
import { AdSenseBanner } from './AdSenseBanner';

interface AdPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdPopupModal: React.FC<AdPopupModalProps> = ({ isOpen, onClose }) => {
  const { adSettings } = useAds();

  const totalCountdown = adSettings.tv_ad_countdown_seconds || ADS_CONFIG.TV_AD_COUNTDOWN_SECONDS || 10;

  const [countdown, setCountdown] = useState<number>(totalCountdown);
  const [isAdLoaded, setIsAdLoaded] = useState<boolean>(false);
  const timerStartedRef = useRef<boolean>(false);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCountdown(totalCountdown);
      setIsAdLoaded(false);
      timerStartedRef.current = false;
      return;
    }

    setCountdown(totalCountdown);
    setIsAdLoaded(false);
    timerStartedRef.current = false;

    // Safety fallback: if Google AdSense or ad blocker takes more than 2s, start countdown anyway
    const fallbackTimer = setTimeout(() => {
      setIsAdLoaded(true);
    }, 2000);

    return () => clearTimeout(fallbackTimer);
  }, [isOpen, totalCountdown]);

  // Start countdown ticking ONLY after ad is loaded; auto-close when countdown reaches 0!
  useEffect(() => {
    if (!isOpen || !isAdLoaded || timerStartedRef.current) return;

    timerStartedRef.current = true;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose(); // Auto-close modal automatically when time ends!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isAdLoaded, onClose]);

  if (!isOpen) return null;

  const progressPercent = !isAdLoaded
    ? 0
    : Math.min(100, Math.max(0, ((totalCountdown - countdown) / totalCountdown) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-rba-navy via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rba-yellow" />
              Google AdSense Broadcast
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-rba-yellow/30 text-xs font-black text-rba-yellow">
            {!isAdLoaded ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin text-slate-300" /> Preparing ad...
              </span>
            ) : (
              <span>Auto-close in <strong className="text-white text-sm ml-1 font-black">{countdown}s</strong></span>
            )}
          </div>
        </div>

        {/* Modal Body - Fixed bounds without vertical overflow */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-300 font-semibold bg-slate-800/70 py-1.5 px-3 rounded-xl border border-slate-700/60">
            <Volume2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">TV broadcast is streaming in background</span>
          </div>

          {/* Forced Google AdSense Display Container */}
          <div className="bg-slate-950 rounded-2xl p-2 border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
            {!isAdLoaded && (
              <div className="absolute inset-0 z-10 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 p-4 text-center">
                <div className="w-7 h-7 border-3 border-rba-yellow border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-300">Loading advertisement...</p>
              </div>
            )}

            <AdSenseBanner
              slot={ADS_CONFIG.SLOTS.POPUP_INTERSTITIAL}
              format="rectangle"
              responsive={true}
              minHeight="200px"
              label="Google AdSense Partner"
              forceDisplayMode="GOOGLE"
              onAdLoaded={() => setIsAdLoaded(true)}
            />
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Google AdSense Stream
              </span>
              <span className="text-rba-yellow font-black">
                {!isAdLoaded ? 'Loading ad...' : `${countdown}s left`}
              </span>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rba-yellow via-amber-500 to-red-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Bar with Optional Skip */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Closes automatically when countdown ends
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors"
            title="Skip Ad"
          >
            <X className="w-3.5 h-3.5" />
            <span>Skip</span>
          </button>
        </div>

      </div>
    </div>
  );
};
