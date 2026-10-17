import React, { createContext, useContext, useState, useEffect } from 'react';

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  showBanner: boolean;
  installPWA: () => Promise<void>;
  dismissPrompt: (days?: number) => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

const DISMISS_KEY = 'pwa_dismissed_until';
const INSTALLED_KEY = 'pwa_installed';

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const isStandaloneMedia = window.matchMedia ? window.matchMedia('(display-mode: standalone)').matches : false;
        const isNavStandalone = (navigator as any)?.standalone === true;
        const isCachedInstalled = localStorage.getItem(INSTALLED_KEY) === 'true';
        return isStandaloneMedia || isNavStandalone || isCachedInstalled;
      }
    } catch {
      // safe fallback
    }
    return false;
  });
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    let mediaQuery: MediaQueryList | null = null;
    const handleModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
        setShowBanner(false);
      }
    };

    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        mediaQuery = window.matchMedia('(display-mode: standalone)');
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleModeChange);
        }
      }
    } catch {
      // Fallback for older browsers
    }


    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Check 14-day dismissal window
      const dismissedUntilStr = localStorage.getItem(DISMISS_KEY);
      const now = Date.now();

      if (!isInstalled) {
        if (!dismissedUntilStr || now > parseInt(dismissedUntilStr, 10)) {
          setShowBanner(true);
        } else {
          setShowBanner(false);
        }
      }
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.setItem(INSTALLED_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      try {
        mediaQuery.removeEventListener('change', handleModeChange);
      } catch {
        // ignore
      }
    };
  }, [isInstalled]);

  // Install PWA trigger
  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem(INSTALLED_KEY, 'true');
        setShowBanner(false);
      } else {
        // User rejected prompt, dismiss for 7 days
        dismissPrompt(7);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback for iOS / Safari instructions if no prompt captured
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert('To install Benix TV on iPhone/iPad: Tap the Share button in Safari, then select "Add to Home Screen" 📲.');
      } else {
        alert('To install Benix TV: Open your browser menu (⋮) and tap "Install app" or "Add to Home Screen" 📲.');
      }
    }
  };

  // Dismiss prompt banner for N days (default 14 days)
  const dismissPrompt = (days: number = 14) => {
    const dismissedUntil = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, dismissedUntil.toString());
    setShowBanner(false);
  };

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isInstallable,
        showBanner,
        installPWA,
        dismissPrompt,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
