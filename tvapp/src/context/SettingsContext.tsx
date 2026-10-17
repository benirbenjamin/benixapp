import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings } from '../types';
import { getSettings, updateSettings as apiUpdateSettings } from '../services/api';

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Benix Space TV',
  site_description: "Premier digital television network. Stream Live TV, sports, entertainment, and multimedia streaming worldwide.",
  logo_url: '/logo.png',
  contact_email: 'info@benix.space',
  contact_phone: '+250 788 123 456',
  address: 'Kigali, Rwanda',
  facebook_url: 'https://facebook.com/benixspace',
  twitter_url: 'https://twitter.com/BenixSpaceTV',
  youtube_url: 'https://youtube.com',
  instagram_url: 'https://instagram.com/benixspace',
  footer_text: '© ' + new Date().getFullYear() + ' Benix Space TV. All rights reserved.',
};

const STORAGE_KEY = 'rba_site_settings_cache';

interface SettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  updateSettings: (newSettings: SiteSettings) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    // Initial cache lookup for instantaneous render without layout shift
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_SETTINGS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      if (data && typeof data === 'object') {
        const merged = { ...DEFAULT_SETTINGS, ...data };
        setSettings(merged);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // Ignore localStorage errors
        }
      }
    } catch (err) {
      console.warn('Failed to fetch platform settings from backend, using defaults/cache:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateSettings = async (newSettings: SiteSettings) => {
    // Optimistically update UI
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {
      // Ignore
    }

    // Persist to backend database
    await apiUpdateSettings(newSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings: handleUpdateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
