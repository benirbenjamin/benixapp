import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, translate, LANGUAGE_LABELS } from '../i18n';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLanguages: typeof LANGUAGE_LABELS;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('kunda_lang') as LanguageCode;
    if (saved && ['en', 'rw', 'fr'].includes(saved)) {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLangState(lang);
    localStorage.setItem('kunda_lang', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(key, language, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages: LANGUAGE_LABELS }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
