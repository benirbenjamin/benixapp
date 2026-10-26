"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, SiteSettings } from "@/types";
import { Language, getTranslation } from "@/lib/i18n";

interface AppContextType {
  settings: Partial<SiteSettings>;
  updateLocalSettings: (newSettings: Partial<SiteSettings>) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ReturnType<typeof getTranslation>;
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProviders({
  children,
  initialSettings,
  initialUser,
}: {
  children: React.ReactNode;
  initialSettings?: Partial<SiteSettings>;
  initialUser?: AuthUser | null;
}) {
  const [settings, setSettings] = useState<Partial<SiteSettings>>(initialSettings || {});
  const [language, setLanguageState] = useState<Language>("en");
  const [user, setUser] = useState<AuthUser | null>(initialUser || null);

  // Initialize language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("umuguzi_lang") as Language;
    if (savedLang && ["en", "rw", "fr"].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("umuguzi_lang", lang);
  };

  const updateLocalSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Dynamically inject custom brand colors into document root
  useEffect(() => {
    if (settings.brand_primary) {
      document.documentElement.style.setProperty("--brand-primary", settings.brand_primary);
    }
    if (settings.brand_primary_hover) {
      document.documentElement.style.setProperty("--brand-primary-hover", settings.brand_primary_hover);
    }
    if (settings.brand_accent) {
      document.documentElement.style.setProperty("--brand-accent", settings.brand_accent);
    }
  }, [settings.brand_primary, settings.brand_primary_hover, settings.brand_accent]);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/";
    } catch (e) {
      console.error(e);
    }
  };

  const t = getTranslation(language);

  return (
    <AppContext.Provider
      value={{
        settings,
        updateLocalSettings,
        language,
        setLanguage,
        t,
        user,
        setUser,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProviders");
  }
  return context;
}
