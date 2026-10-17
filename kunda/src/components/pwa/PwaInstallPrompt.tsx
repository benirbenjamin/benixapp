import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePwa } from '../../contexts/PwaContext';

export const PwaInstallPrompt: React.FC = () => {
  const { isInstalled, installApp } = usePwa();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('kunda_pwa_dismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('kunda_pwa_dismissed', 'true');
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md">
          <Smartphone className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-white">Install Kunda Space App</h4>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Install to your home screen or PC for instant tray notifications & unread badge counters.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={installApp}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
