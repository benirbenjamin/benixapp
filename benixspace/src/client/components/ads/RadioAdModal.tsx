import React, { useEffect, useState, useRef } from 'react';
import { Radio, Sparkles, Volume2, Clock, X, ShieldCheck, Play } from 'lucide-react';
import type { Station } from '../../services/mediaService';

interface RadioAdModalProps {
  isOpen: boolean;
  station: Station | null;
  onComplete: () => void;
  onCancel: () => void;
}

export const RadioAdModal: React.FC<RadioAdModalProps> = ({
  isOpen,
  station,
  onComplete,
  onCancel
}) => {
  const [countdown, setCountdown] = useState<number>(6);
  const [isAdLoaded, setIsAdLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(6);
      setIsAdLoaded(false);
      return;
    }

    setCountdown(6);
    // Ad load simulation fallback (instantly loaded after 1 second)
    const adTimer = setTimeout(() => {
      setIsAdLoaded(true);
    }, 1000);

    return () => clearTimeout(adTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isAdLoaded) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isAdLoaded, onComplete]);

  if (!isOpen || !station) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md bg-[#0E1524] text-white rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 via-indigo-800 to-[#0E1524] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Sponsor Audio Advertisement
            </span>
          </div>

          <button
            onClick={onCancel}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 text-center space-y-4">
          
          {/* Target Station Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
            <img
              src={station.logo_url || station.logoUrl || '/radio-icon.svg'}
              alt={station.name}
              className="w-12 h-12 rounded-xl object-contain bg-slate-900 p-1 border border-slate-700"
            />
            <div className="text-left overflow-hidden flex-1">
              <h3 className="font-extrabold text-sm text-white truncate">{station.name}</h3>
              <p className="text-[11px] text-amber-400 font-bold truncate">
                {station.frequency || station.genre || 'Live Radio Stream'}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* Ad Container (Google AdSense / Rwandan Sponsors) */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1 text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Benix Partner
              </span>
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                Ad
              </span>
            </div>

            <div className="py-3 space-y-1">
              <p className="font-black text-sm text-white">MTN Rwanda & Bank of Kigali</p>
              <p className="text-xs text-slate-300">
                Deposit, cash out, and bet securely across all Benix apps starting from 100 RWF with zero fees.
              </p>
            </div>

            {/* Google AdSense slot container */}
            <div className="min-h-[60px] bg-black/40 rounded-xl border border-dashed border-slate-700 flex items-center justify-center p-2 text-center text-xs text-slate-500">
              <span>Google AdSense / Radio Display Ad</span>
            </div>
          </div>

          {/* Countdown & Skip action */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Playing radio in <strong className="text-amber-400 font-black text-sm">{countdown}s</strong></span>
            </div>

            {countdown <= 3 ? (
              <button
                onClick={onComplete}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Now</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                Skip in {countdown - 3}s
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
