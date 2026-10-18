import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Volume2, ShieldCheck, Clock, X, ExternalLink } from 'lucide-react';
import { ADS_CONFIG } from '../../config/ads';
import { AdSenseUnit } from '../common/AdSenseUnit';

interface TVAdOverlayProps {
  isOpen: boolean;
  stationName?: string;
  onClose: () => void;
}

export const TVAdOverlay: React.FC<TVAdOverlayProps> = ({
  isOpen,
  stationName = 'Benix Space TV',
  onClose,
}) => {
  const totalCountdown = ADS_CONFIG.TV_AD_COUNTDOWN_SECONDS || 10;
  const [countdown, setCountdown] = useState<number>(totalCountdown);
  const [isAdLoaded, setIsAdLoaded] = useState<boolean>(false);
  const timerStartedRef = useRef<boolean>(false);

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

    // Safety fallback
    const fallbackTimer = setTimeout(() => {
      setIsAdLoaded(true);
    }, 2000);

    return () => clearTimeout(fallbackTimer);
  }, [isOpen, totalCountdown]);

  // Start countdown and auto-close when 0s
  useEffect(() => {
    if (!isOpen || !isAdLoaded || timerStartedRef.current) return;
    timerStartedRef.current = true;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose(); // Auto-close modal returning immediately to TV stream!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isAdLoaded, onClose]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.max(0, ((totalCountdown - countdown) / totalCountdown) * 100));

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#111724] text-white rounded-3xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-900 via-indigo-950 to-[#111724] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sponsor Broadcast
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-amber-400/30 text-xs font-black text-amber-300">
            {!isAdLoaded ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin text-slate-300" /> Preparing ad...
              </span>
            ) : (
              <span>Resumes in <strong className="text-white text-sm ml-1 font-black">{countdown}s</strong></span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3">
          
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-300 font-semibold bg-[#1A2234] py-1.5 px-3 rounded-xl border border-slate-700/60">
            <Volume2 className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
            <span className="truncate">Audio active • {stationName} streaming in background</span>
          </div>

          {/* Google AdSense Display Slot */}
          <div className="bg-[#090D14] rounded-2xl p-2 border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden">
            <AdSenseUnit
              slot={ADS_CONFIG.SLOTS.POPUP_INTERSTITIAL}
              format="rectangle"
              responsive={true}
              className="my-0"
            />
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Google AdSense Partner
              </span>
              <span className="text-amber-400 font-black">
                {!isAdLoaded ? 'Loading ad...' : `${countdown}s left`}
              </span>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-4 py-2.5 bg-black/60 border-t border-slate-800 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Closes automatically in {countdown}s
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="Skip Ad"
          >
            <X className="w-3.5 h-3.5" />
            <span>Skip ({countdown}s)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
