import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ADS_CONFIG } from '../config/ads';
import { usePlayer } from './PlayerContext';
import { CustomAd, AdSettings, Station } from '../types';
import { getPublicAds, recordAdEvent } from '../services/api';

interface AdContextType {
  isPopupOpen: boolean;
  tvWatchSeconds: number;
  triggerPopupNow: () => void;
  closePopup: () => void;
  isWatchingTv: boolean;
  
  // Custom Ads & Settings State
  customAds: CustomAd[];
  adSettings: AdSettings;
  refreshAds: () => Promise<void>;
  
  // Rotation State
  getNextAdDisplayType: () => 'GOOGLE' | 'CUSTOM';
  getRandomCustomAd: () => CustomAd | null;
  trackImpression: (adId: string) => void;
  trackClick: (adId: string) => void;

  // Radio Pre-Roll Ad State
  isRadioAdOpen: boolean;
  pendingRadioStation: Station | null;
  triggerRadioAdIfNeeded: (station: Station, onProceed: () => void) => void;
  completeRadioAd: () => void;
}

const DEFAULT_SETTINGS: AdSettings = {
  whatsapp_number: ADS_CONFIG.WHATSAPP_NUMBER,
  google_ads_per_custom_ad: ADS_CONFIG.GOOGLE_ADS_PER_CUSTOM_AD,
  enable_custom_ads: true,
  enable_google_adsense: true,
  default_share_expiry_hours: 168,
  radio_ad_interval_seconds: ADS_CONFIG.RADIO_AD_INTERVAL_SECONDS,
  radio_ad_countdown_seconds: ADS_CONFIG.RADIO_AD_COUNTDOWN_SECONDS,
  tv_ad_initial_delay_seconds: ADS_CONFIG.TV_AD_INITIAL_DELAY_SECONDS,
  tv_ad_interval_seconds: ADS_CONFIG.TV_AD_INTERVAL_SECONDS,
  tv_ad_countdown_seconds: ADS_CONFIG.TV_AD_COUNTDOWN_SECONDS,
};

const AdContext = createContext<AdContextType | undefined>(undefined);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isTvPlaying, activeTvStation } = usePlayer();
  const location = useLocation();

  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [tvWatchSeconds, setTvWatchSeconds] = useState<number>(0);

  const [customAds, setCustomAds] = useState<CustomAd[]>([]);
  const [adSettings, setAdSettings] = useState<AdSettings>(DEFAULT_SETTINGS);

  // Rotation Counter: Counts served ads to enforce N Google Ads -> 1 Custom Ad
  const servedAdCountRef = useRef<number>(0);
  const hasTriggeredInitialTvAdRef = useRef<boolean>(false);

  // Radio Pre-roll state
  const [isRadioAdOpen, setIsRadioAdOpen] = useState<boolean>(false);
  const [pendingRadioStation, setPendingRadioStation] = useState<Station | null>(null);
  const onRadioProceedRef = useRef<(() => void) | null>(null);
  const lastRadioAdTimestampRef = useRef<number>(0);

  // Load active custom ads & settings from API/localStorage
  const fetchAds = useCallback(async () => {
    try {
      const data = await getPublicAds();
      setAdSettings(data.settings || DEFAULT_SETTINGS);
      setCustomAds(data.ads || []);
    } catch (err) {
      console.error('Failed to load public ads:', err);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Check whether the user is actively watching TV:
  const isWatchingTv =
    isTvPlaying ||
    (location.pathname === '/tv' && activeTvStation !== null) ||
    location.pathname.startsWith('/tv/');

  // Timer: Initial delay (e.g. 1 min) then repeat interval (e.g. 5 min)
  useEffect(() => {
    if (isPopupOpen) return;
    if (!isWatchingTv) {
      setTvWatchSeconds(0);
      hasTriggeredInitialTvAdRef.current = false;
      return;
    }

    const initialDelay = adSettings.tv_ad_initial_delay_seconds || 60;
    const repeatInterval = adSettings.tv_ad_interval_seconds || 300;

    const targetThreshold = hasTriggeredInitialTvAdRef.current ? repeatInterval : initialDelay;

    const interval = setInterval(() => {
      setTvWatchSeconds((prev) => {
        const next = prev + 1;
        if (next >= targetThreshold) {
          setIsPopupOpen(true);
          hasTriggeredInitialTvAdRef.current = true;
          return 0; // Reset counter for next cycle
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWatchingTv, isPopupOpen, adSettings]);

  const triggerPopupNow = () => setIsPopupOpen(true);
  const closePopup = () => {
    setIsPopupOpen(false);
    setTvWatchSeconds(0);
  };

  // Rotation Logic: Returns 'GOOGLE' or 'CUSTOM'
  const getNextAdDisplayType = (): 'GOOGLE' | 'CUSTOM' => {
    if (!adSettings.enable_custom_ads || customAds.length === 0) {
      return 'GOOGLE';
    }
    if (!adSettings.enable_google_adsense) {
      return 'CUSTOM';
    }

    const ratio = adSettings.google_ads_per_custom_ad || 2;
    servedAdCountRef.current += 1;

    // Every (ratio + 1)th ad is a Custom Ad!
    if (servedAdCountRef.current % (ratio + 1) === 0) {
      return 'CUSTOM';
    }

    return 'GOOGLE';
  };

  const getRandomCustomAd = (): CustomAd | null => {
    if (customAds.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * customAds.length);
    return customAds[randomIndex];
  };

  const trackImpression = (adId: string) => {
    recordAdEvent(adId, 'IMPRESSION');
  };

  const trackClick = (adId: string) => {
    recordAdEvent(adId, 'CLICK');
  };

  // Radio Pre-Roll Ad Handler with 4-Minute Throttle
  const triggerRadioAdIfNeeded = (station: Station, onProceed: () => void) => {
    const now = Date.now();
    const intervalMs = (adSettings.radio_ad_interval_seconds || 240) * 1000;
    const timeSinceLastAd = now - lastRadioAdTimestampRef.current;

    // If more than 4 minutes (240s) have passed since last radio ad, trigger ad modal!
    if (timeSinceLastAd >= intervalMs || lastRadioAdTimestampRef.current === 0) {
      setPendingRadioStation(station);
      onRadioProceedRef.current = onProceed;
      setIsRadioAdOpen(true);
      lastRadioAdTimestampRef.current = now;
    } else {
      // Less than 4 minutes have passed -> play radio immediately without ad!
      onProceed();
    }
  };

  const completeRadioAd = () => {
    setIsRadioAdOpen(false);
    if (onRadioProceedRef.current) {
      onRadioProceedRef.current();
      onRadioProceedRef.current = null;
    }
    setPendingRadioStation(null);
  };

  return (
    <AdContext.Provider
      value={{
        isPopupOpen,
        tvWatchSeconds,
        triggerPopupNow,
        closePopup,
        isWatchingTv,

        customAds,
        adSettings,
        refreshAds: fetchAds,

        getNextAdDisplayType,
        getRandomCustomAd,
        trackImpression,
        trackClick,

        isRadioAdOpen,
        pendingRadioStation,
        triggerRadioAdIfNeeded,
        completeRadioAd,
      }}
    >
      {children}
    </AdContext.Provider>
  );
};

export const useAds = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
};
