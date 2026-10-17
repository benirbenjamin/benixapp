import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'midnight' | 'cyber';
export type AccentColor = 'sky' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'purple';

interface ThemeContextType {
  mode: ThemeMode;
  accent: AccentColor;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  accent: 'sky',
  setMode: () => {},
  setAccent: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('benix_theme_mode') as ThemeMode) || 'light';
  });

  const [accent, setAccentState] = useState<AccentColor>(() => {
    return (localStorage.getItem('benix_theme_accent') as AccentColor) || 'sky';
  });

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem('benix_theme_mode', m);
  };

  const setAccent = (a: AccentColor) => {
    setAccentState(a);
    localStorage.setItem('benix_theme_accent', a);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-midnight', 'theme-cyber');
    root.classList.add(`theme-${mode}`);

    if (mode === 'dark' || mode === 'midnight' || mode === 'cyber') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.setAttribute('data-accent', accent);
  }, [mode, accent]);

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
