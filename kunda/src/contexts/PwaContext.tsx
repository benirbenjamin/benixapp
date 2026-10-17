import React, { createContext, useContext, useState, useEffect } from 'react';

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  installApp: async () => {},
});

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone PWA mode (desktop or mobile)
    if (
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' && (window.navigator as any).standalone)
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Guide user if browser already has native install button or iOS Safari
      alert('To install Kunda Space:\n• On Chrome/Edge: Click the install icon in the address bar.\n• On iPhone Safari: Tap the Share button and select "Add to Home Screen".');
    }
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable: !isInstalled,
        isInstalled,
        installApp,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = () => useContext(PwaContext);
