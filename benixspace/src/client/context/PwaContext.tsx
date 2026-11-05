import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationSound } from '../utils/notificationSound';

interface PwaContextType {
  isInstalled: boolean;
  canInstall: boolean;
  hasUpdate: boolean;
  applyUpdate: () => void;
  installApp: () => Promise<boolean>;
  showTrayNotification: (title: string, options?: { body?: string; url?: string }) => Promise<boolean>;
  setBadgeCount: (count: number) => void;
  clearBadge: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isInstalled: false,
  canInstall: false,
  hasUpdate: false,
  applyUpdate: () => {},
  installApp: async () => false,
  showTrayNotification: async () => false,
  setBadgeCount: () => {},
  clearBadge: () => {}
});

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // 1. Detect if current browsing context is running in standalone PWA window
  useEffect(() => {
    const checkIsInstalled = () => {
      const isStandalone =
        typeof window !== 'undefined' &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: fullscreen)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches ||
          (window.navigator as any).standalone === true ||
          document.referrer.includes('android-app://') ||
          localStorage.getItem('benix_pwa_installed') === 'true');

      setIsInstalled(Boolean(isStandalone));
    };

    checkIsInstalled();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(Boolean(e.matches || (window.navigator as any).standalone === true || localStorage.getItem('benix_pwa_installed') === 'true'));
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // 2. Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // If user already installed or marked installed, don't trigger install UI
      if (typeof window !== 'undefined' && localStorage.getItem('benix_pwa_installed') === 'true') {
        return;
      }
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // 3. Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('benix_pwa_installed', 'true');
        localStorage.setItem('benix_pwa_dismissed', 'true');
      } catch {}
      console.log('🎉 BenixSpace PWA successfully installed on device!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 4. Service Worker Registration & Live Update Detection
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Check if there is already a waiting service worker
      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(registration.waiting);
        setHasUpdate(true);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setHasUpdate(true);
          }
        });
      });

      // Periodically check for updates (e.g. every 15 minutes)
      const interval = setInterval(() => {
        registration.update().catch(() => {});
      }, 15 * 60 * 1000);

      // Check on window refocus
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }).catch((err) => {
      console.warn('BenixSpace ServiceWorker registration error:', err);
    });
  }, []);

  // Apply service worker update immediately
  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  // Install app handler
  const installApp = async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setCanInstall(false);
          setDeferredPrompt(null);
          try {
            localStorage.setItem('benix_pwa_installed', 'true');
            localStorage.setItem('benix_pwa_dismissed', 'true');
          } catch {}
          return true;
        }
        return false;
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    // Guide the user if beforeinstallprompt is not directly available (e.g. iOS Safari or desktop Chrome)
    if (typeof window !== 'undefined') {
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('To install Benix.Space on iOS:\n1. Tap the Share button (⎋) at the bottom of Safari.\n2. Scroll down and tap "Add to Home Screen" (⊞).');
      } else {
        alert('To install Benix.Space on your device:\n1. Tap the menu (⋮) in your browser address bar.\n2. Tap "Install App" or "Add to Home Screen".');
      }
    }
    return false;
  };

  const showTrayNotification = async (
    title: string,
    options?: { body?: string; url?: string }
  ): Promise<boolean> => {
    notificationSound.playNotificationChime();

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

    return notificationSound.requestPushPermissionAndSend(title, options);
  };

  const setBadgeCount = (count: number) => {
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      try {
        if (count > 0) {
          (navigator as any).setAppBadge(count).catch(() => {});
        } else {
          (navigator as any).clearAppBadge().catch(() => {});
        }
      } catch {}
    }

    // Update document title with unread count
    if (typeof document !== 'undefined') {
      const cleanTitle = document.title.replace(/^\(\d+\)\s*/, '');
      if (count > 0) {
        document.title = `(${count}) ${cleanTitle}`;
      } else {
        document.title = cleanTitle;
      }
    }
  };

  const clearBadge = () => {
    if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
      try {
        (navigator as any).clearAppBadge().catch(() => {});
      } catch {}
    }
    if (typeof document !== 'undefined') {
      document.title = document.title.replace(/^\(\d+\)\s*/, '');
    }
  };

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        canInstall,
        hasUpdate,
        applyUpdate,
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
