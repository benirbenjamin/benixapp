import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'rw' | 'fr' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const UI_DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    tv: 'TV & Videos',
    radio: 'Radio',
    music: 'Music & Choirs',
    dating: 'Kunda Dating',
    marketplace: 'Marketplace',
    games: 'Games',
    calc: 'Calculators',
    blog: 'News & Blog',
    projects: 'Projects',
    services: 'Services',
    wallet: 'Wallet',
    referrals: 'Referrals',
    login: 'Log In',
    signup: 'Join Super-App',
    logout: 'Log Out',
    admin: 'Admin Portal',
    search: 'Search platform...',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    balance: 'Balance',
    superadmin: 'Super Admin',
    featured: 'Featured Platforms',
    live_radio: 'Live Radio Stream',
    play_now: 'Play Now',
    watch_live: 'Watch Live'
  },
  rw: {
    home: 'Ahabanza',
    tv: 'Televiziyo & Videwo',
    radio: 'Radiyo',
    music: 'Umuziki & Amakorali',
    dating: 'Guhuza Imitima (Kunda)',
    marketplace: 'Isoko (Marketplace)',
    games: 'Imikino',
    calc: 'Imibare & Ibikoresho',
    blog: 'Amakuru',
    projects: 'Imishinga',
    services: 'Serivisi',
    wallet: 'Umufuka',
    referrals: 'Ubutumire',
    login: 'Injira',
    signup: 'Iyandikishe',
    logout: 'Sohoka',
    admin: 'Ibiro Bikuru',
    search: 'Shakisha muri BenixSpace...',
    deposit: 'Kubitsa',
    withdraw: 'Kubikuza',
    balance: 'Amafaranga asigaye',
    superadmin: 'Umuyobozi Mukuru',
    featured: 'Ibyatoranyijwe',
    live_radio: 'Radiyo Imbonankubone',
    play_now: 'Kina Ako Kanya',
    watch_live: 'Reba Ako Kanya'
  },
  fr: {
    home: 'Accueil',
    tv: 'TV & Vidéos',
    radio: 'Radio',
    music: 'Musique & Chorales',
    dating: 'Rencontres (Kunda)',
    marketplace: 'Boutique & Services',
    games: 'Jeux',
    calc: 'Calculatrices',
    blog: 'Actualités',
    projects: 'Projets',
    services: 'Services',
    wallet: 'Portefeuille',
    referrals: 'Parrainage',
    login: 'Connexion',
    signup: 'Inscription',
    logout: 'Déconnexion',
    admin: 'Portail Admin',
    search: 'Rechercher sur la plateforme...',
    deposit: 'Dépôt',
    withdraw: 'Retrait',
    balance: 'Solde',
    superadmin: 'Super Admin',
    featured: 'Plates-formes vedettes',
    live_radio: 'Radio en direct',
    play_now: 'Jouer',
    watch_live: 'Regarder en direct'
  },
  sw: {
    home: 'Nyumbani',
    tv: 'Runinga & Video',
    radio: 'Redio',
    music: 'Muziki & Kwaya',
    dating: 'Kuchumbiana (Kunda)',
    marketplace: 'Soko la Bidhaa',
    games: 'Michezo',
    calc: 'Vikokotoo',
    blog: 'Habari & Makala',
    projects: 'Miradi',
    services: 'Huduma',
    wallet: 'Mkoba wa Pesa',
    referrals: 'Mialiko',
    login: 'Ingia',
    signup: 'Jiunge Nasi',
    logout: 'Toka',
    admin: 'Msimamizi Mkuu',
    search: 'Tafuta popote...',
    deposit: 'Weka Pesa',
    withdraw: 'Toa Pesa',
    balance: 'Salio',
    superadmin: 'Msimamizi Mkuu',
    featured: 'Mifumo ya Kidijitali',
    live_radio: 'Redio Moja kwa Moja',
    play_now: 'Cheza Sasa',
    watch_live: 'Tazama Moja kwa Moja'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (k) => k
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('benix_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('benix_lang', lang);
  };

  const t = (key: string): string => {
    const dict = UI_DICTIONARY[language] || UI_DICTIONARY.en;
    return dict[key] || UI_DICTIONARY.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
