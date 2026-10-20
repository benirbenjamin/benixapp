import React, { useState, useEffect } from 'react';
import { usePwa } from '../../context/PwaContext';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const { isInstalled, installApp } = usePwa();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // If app is already installed in standalone mode or recorded in localStorage, NEVER show
    if (isInstalled || localStorage.getItem('benix_pwa_installed') === 'true' || localStorage.getItem('benix_pwa_dismissed') === 'true') {
      setIsVisible(false);
      return;
    }

    // Show after a polite delay only on first non-installed visit
    const timer = setTimeout(() => {
      if (!isInstalled && localStorage.getItem('benix_pwa_installed') !== 'true' && localStorage.getItem('benix_pwa_dismissed') !== 'true') {
        setIsVisible(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleDismiss = () => {
    localStorage.setItem('benix_pwa_dismissed', 'true');
    setIsVisible(false);
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      localStorage.setItem('benix_pwa_installed', 'true');
      setIsVisible(false);
    }
  };

  if (!isVisible || isInstalled || (typeof window !== 'undefined' && (localStorage.getItem('benix_pwa_installed') === 'true' || localStorage.getItem('benix_pwa_dismissed') === 'true'))) {
    return null;
  }

  return (
    <aside
      aria-label="Install BenixSpace App"
      className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative overflow-hidden rounded-3xl bg-[#121824]/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-4 sm:p-5 text-slate-100 flex flex-col gap-3.5">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 rounded-full bg-blue-600/15 blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1A2233] border border-slate-700/80 p-1.5 flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/logo.png"
                alt="BenixSpace Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-black text-sm text-white">Install BenixSpace</h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Native PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Fast offline access, system tray alerts & live TV/Radio playback
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt for today"
            className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-slate-800/80 relative z-10">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            Not Now
          </button>
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
