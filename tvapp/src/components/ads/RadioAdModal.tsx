import React, { useEffect, useState, useRef } from 'react';
import { Radio, Sparkles, Volume2, ShieldCheck, Clock, X } from 'lucide-react';
import { ADS_CONFIG } from '../../config/ads';
import { useAds } from '../../context/AdContext';
import { AdSenseBanner } from './AdSenseBanner';
import { Station } from '../../types';

interface RadioAdModalProps {
  isOpen: boolean;
  station: Station | null;
  onComplete: () => void;
}

export const RadioAdModal: React.FC<RadioAdModalProps> = ({ isOpen, station, onComplete }) => {
  const { adSettings } = useAds();

  const totalCountdownSeconds = adSettings.radio_ad_countdown_seconds || ADS_CONFIG.RADIO_AD_COUNTDOWN_SECONDS || 10;

  const [countdown, setCountdown] = useState<number>(totalCountdownSeconds);
  const [isAdLoaded, setIsAdLoaded] = useState<boolean>(false);
  const timerStartedRef = useRef<boolean>(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCountdown(totalCountdownSeconds);
      setIsAdLoaded(false);
      timerStartedRef.current = false;
      return;
    }

    setCountdown(totalCountdownSeconds);
    setIsAdLoaded(false);
    timerStartedRef.current = false;

    // Safety fallback: if Google AdSense or ad blocker takes more than 2.5s, start timer anyway
    const fallbackTimer = setTimeout(() => {
      setIsAdLoaded(true);
    }, 2500);

    return () => clearTimeout(fallbackTimer);
  }, [isOpen, totalCountdownSeconds]);

  // Start countdown ticking ONLY after ad is loaded
  useEffect(() => {
    if (!isOpen || !isAdLoaded || timerStartedRef.current) return;

    timerStartedRef.current = true;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isAdLoaded, onComplete]);

  if (!isOpen || !station) return null;

  const canSkip = countdown === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md max-h-[90vh] bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-rba-blue via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rba-yellow animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rba-yellow" />
              Google Radio Sponsor Ad
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-rba-yellow/30 text-xs font-extrabold text-rba-yellow">
            {!isAdLoaded ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin" /> Waiting for ad...
              </span>
            ) : (
              <span>Radio starts in <strong className="text-white text-sm ml-1 font-black">{countdown}s</strong></span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 text-center space-y-4 flex-1 overflow-y-auto">
          
          {/* Station Card Preview */}
          <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
            <img
              src={station.logo_url || '/logo.png'}
              alt={station.name}
              className="w-10 h-10 object-contain rounded-lg shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="text-left min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-white truncate">{station.name}</h4>
              <p className="text-xs font-medium text-slate-400">
                {station.frequency || 'Live Radio'} • Stream ready...
              </p>
            </div>
            <div className="p-2 rounded-xl bg-rba-blue/20 text-rba-yellow">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* Forced Google AdSense Banner */}
          <div className="bg-slate-950 rounded-2xl p-2 border border-slate-800 shadow-inner min-h-[220px] flex flex-col justify-center items-center relative">
            {!isAdLoaded && (
              <div className="absolute inset-0 z-10 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 p-4 text-center">
                <div className="w-7 h-7 border-3 border-rba-yellow border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-300">Loading Google AdSense ad...</p>
              </div>
            )}

            <AdSenseBanner
              slot={ADS_CONFIG.SLOTS.RADIO_PREROLL}
              format="rectangle"
              responsive={true}
              minHeight="200px"
              label="Google AdSense Radio Partner"
              forceDisplayMode="GOOGLE"
              onAdLoaded={() => setIsAdLoaded(true)}
            />
          </div>

          {/* Progress Bar & Status */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                Connecting to {station.name}...
              </span>
              <span className="text-rba-yellow font-black">
                {!isAdLoaded ? 'Loading ad...' : `${countdown}s remaining`}
              </span>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rba-yellow via-amber-500 to-rba-blue transition-all duration-1000 ease-linear rounded-full"
                style={{
                  width: !isAdLoaded
                    ? '10%'
                    : `${((totalCountdownSeconds - countdown) / totalCountdownSeconds) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Radio audio un-mutes automatically when clip completes</span>
          </div>

        </div>

        {/* Footer Bar with Manual Start/Skip when finished */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold">
            {canSkip ? 'Ad Finished' : 'Streaming Sponsor Clip'}
          </span>
          <button
            onClick={onComplete}
            disabled={!canSkip && isAdLoaded}
            className={`px-5 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
              canSkip
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {canSkip ? (
              <>
                <Radio className="w-4 h-4" />
                <span>Start Listening Now</span>
              </>
            ) : (
              <span>Please wait...</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
