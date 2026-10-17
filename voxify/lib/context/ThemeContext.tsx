'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>('light');

  useEffect(() => {
    try {
      localStorage.setItem('voxify_theme', 'light');
    } catch {}

    const enforceLight = () => {
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (root.classList.contains('dark')) {
          root.classList.remove('dark');
        }
        if (!root.classList.contains('light')) {
          root.classList.add('light');
        }
        root.style.colorScheme = 'light';
        if (document.body && document.body.style.colorScheme !== 'light') {
          document.body.style.colorScheme = 'light';
        }
      }
    };

    enforceLight();

    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === 'class') {
            const root = document.documentElement;
            if (root.classList.contains('dark')) {
              root.classList.remove('dark');
              root.classList.add('light');
            }
          }
        }
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    }
  }, []);

  const setTheme = () => {
    // Light mode only - ignore attempts to switch to dark
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  };

  const toggleTheme = () => {
    // Light mode only
    setTheme();
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
