import React from 'react';
import { Smartphone, X, Sparkles, Download } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';
import { usePlayer } from '../../context/PlayerContext';

export const PWAInstallBanner: React.FC = () => {
  const { showBanner, isInstalled, installPWA, dismissPrompt } = usePWA();
  const { currentStation, isPlaying } = usePlayer();

  // If app is already installed or banner dismissed, render nothing
  if (isInstalled || !showBanner) return null;

  // Position offset if radio player is active
  const hasRadioPlayer = isPlaying && currentStation && currentStation.station_type === 'RADIO';

  return (
    <div
      className={`fixed left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 transition-all duration-300 animate-slideUp ${
        hasRadioPlayer ? 'bottom-24 sm:bottom-28' : 'bottom-16 sm:bottom-6'
      }`}
    >
      <div className="bg-slate-900/95 border border-rba-blue/40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl text-white flex items-center justify-between gap-3 relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rba-blue/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rba-navy border border-white/10 p-1 shrink-0 flex items-center justify-center shadow-md">
            <img src="/logo.png" alt="Benix TV" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Install Benix Space TV App</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h4>
            <p className="text-[11px] text-slate-300 leading-tight">
              1-tap live TV & radio streaming for your mobile phone!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => dismissPrompt(14)}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs transition"
          >
            Not now
          </button>

          <button
            onClick={installPWA}
            className="px-3.5 py-1.5 rounded-xl bg-rba-blue hover:bg-rba-blueLight text-white font-extrabold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={() => dismissPrompt(14)}
          className="absolute top-1.5 right-1.5 text-slate-400 hover:text-white p-1"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
};
