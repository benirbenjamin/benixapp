import React, { useState, useEffect } from 'react';
import { Sparkles, Volume2, X, ShieldCheck, Play, Smartphone, Building2, Plane } from 'lucide-react';

interface TVAdOverlayProps {
  countdownDuration?: number;
  onClose: () => void;
  stationName?: string;
}

export const TVAdOverlay: React.FC<TVAdOverlayProps> = ({
  countdownDuration = 6,
  onClose,
  stationName = 'Benix Space TV'
}) => {
  const [countdown, setCountdown] = useState<number>(countdownDuration);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between bg-black/85 backdrop-blur-sm text-white p-3 sm:p-5 animate-fadeIn select-none overflow-hidden">
      
      {/* Top Bar: Sponsored badge + Countdown */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Sponsor Ad</span>
          </span>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-white text-xs font-semibold backdrop-blur-sm">
            <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="truncate max-w-[150px] sm:max-w-none">Live Audio Active • {stationName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-white/20 text-xs font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Ad: <strong className="text-amber-400 font-black">{countdown}s</strong></span>
          </div>

          {countdown <= 3 && (
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Skip Ad"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Center Showcase Brand Card */}
      <div className="my-auto max-w-lg mx-auto w-full">
        <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black border border-indigo-500/40 shadow-2xl space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Official Rwanda Broadcaster Partner</span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black text-white">
            Instant Wallet Deposits & Withdrawals
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Support Rwandan content creators, watch premium HD channels, and withdraw via MTN MoMo and Airtel Money starting from 100 RWF.
          </p>

          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Smartphone className="w-4 h-4" /> MTN MoMo
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Building2 className="w-4 h-4" /> Bank of Kigali
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Skip or Auto-starting notification */}
      <div className="flex items-center justify-between shrink-0 text-xs text-slate-400">
        <span>Broadcast resumes automatically</span>
        {countdown <= 3 && (
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Skip to Broadcast</span>
          </button>
        )}
      </div>

    </div>
  );
};
