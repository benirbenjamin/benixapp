import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationSound } from '../utils/notificationSound';

interface PwaContextType {
  isInstalled: boolean;
  canInstall: boolean;
  installApp: () => Promise<boolean>;
  showTrayNotification: (title: string, options?: { body?: string; url?: string }) => Promise<boolean>;
  setBadgeCount: (count: number) => void;
  clearBadge: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isInstalled: false,
  canInstall: false,
  installApp: async () => false,
  showTrayNotification: async () => false,
  setBadgeCount: () => {},
  clearBadge: () => {}
});

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [canInstall, setCanInstall] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detect if app is already running in standalone mode (installed PWA)
    const checkIsInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('benix_pwa_installed') === 'true';
      setIsInstalled(isStandalone);
    };

    checkIsInstalled();

    // 2. Listen to media query changes (e.g. if opened in standalone)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches || localStorage.getItem('benix_pwa_installed') === 'true');
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // 3. Listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // If already installed or dismissed, do not offer install
      if (localStorage.getItem('benix_pwa_installed') === 'true' || localStorage.getItem('benix_pwa_dismissed') === 'true') {
        return;
      }
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // 4. Listen to appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem('benix_pwa_installed', 'true');
      setCanInstall(false);
      setDeferredPrompt(null);
      console.log('🎉 BenixSpace PWA successfully installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      // If iOS Safari or browser without beforeinstallprompt support
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        alert('To install Benix.Space on iOS: tap the Share button in Safari, then tap "Add to Home Screen" 📲');
      } else {
        alert('To install Benix.Space on your device: open your browser menu (⋮) and tap "Install app" or "Add to Home Screen".');
      }
      return false;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('benix_pwa_installed', 'true');
        setCanInstall(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Install prompt error:', err);
      return false;
    }
  };

  const showTrayNotification = async (
    title: string,
    options?: { body?: string; url?: string }
  ): Promise<boolean> => {
    notificationSound.playNotificationChime();

    // 1. If Service Worker is available, use registration to deliver notification to OS system tray
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        let perm = Notification.permission;
        if (perm !== 'granted' && perm !== 'denied') {
          perm = await Notification.requestPermission();
        }
        if (perm === 'granted') {
          const reg = await navigator.serviceWorker.ready;
          if (reg && 'showNotification' in reg) {
            await reg.showNotification(title, {
              body: options?.body || 'Update from Benix.Space',
              icon: '/logo.png',
              badge: '/logo.png',
              vibrate: [200, 100, 200],
              tag: 'benix-' + Date.now(),
              renotify: true,
              data: { url: options?.url || '/' }
            });
            return true;
          }
        }
      } catch (e) {
        console.warn('ServiceWorker showNotification failed, trying fallback:', e);
      }
    }

    // 2. Fallback to standard Notification API
    return notificationSound.requestPushPermissionAndSend(title, options);
  };

  const setBadgeCount = (count: number) => {
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      try {
        if (count > 0) {
          (navigator as any).setAppBadge(count);
        } else {
          (navigator as any).clearAppBadge();
        }
      } catch {}
    }
  };

  const clearBadge = () => {
    if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
      try {
        (navigator as any).clearAppBadge();
      } catch {}
    }
  };

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        canInstall,
        installApp,
        showTrayNotification,
        setBadgeCount,
        clearBadge
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = () => useContext(PwaContext);
