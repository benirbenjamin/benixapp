import React, { useEffect } from 'react';

export function ThemeProvider({ branding, children }) {
  useEffect(() => {
    if (!branding) return;

    const root = document.documentElement;

    // Apply color design tokens
    if (branding.primary_color) root.style.setProperty('--primary-color', branding.primary_color);
    if (branding.secondary_color) root.style.setProperty('--secondary-color', branding.secondary_color);
    if (branding.accent_color) root.style.setProperty('--accent-color', branding.accent_color);
    if (branding.background_color) root.style.setProperty('--background-color', branding.background_color);
    if (branding.surface_color) root.style.setProperty('--surface-color', branding.surface_color);
    if (branding.text_color) root.style.setProperty('--text-color', branding.text_color);
    if (branding.muted_color) root.style.setProperty('--muted-color', branding.muted_color);
    if (branding.header_color) root.style.setProperty('--header-color', branding.header_color);
    if (branding.footer_color) root.style.setProperty('--footer-color', branding.footer_color);

    // Apply font family
    if (branding.font_family) {
      root.style.setProperty('--station-font', `"${branding.font_family}", sans-serif`);
    }

    // Load custom font stylesheet if provided and valid
    if (branding.custom_font_url && branding.custom_font_url.startsWith('http')) {
      const existingLink = document.getElementById('custom-station-font');
      if (existingLink) {
        existingLink.href = branding.custom_font_url;
      } else {
        const link = document.createElement('link');
        link.id = 'custom-station-font';
        link.rel = 'stylesheet';
        link.href = branding.custom_font_url;
        document.head.appendChild(link);
      }
    }

    return () => {
      // Cleanup on unmount or station switch
      const existingLink = document.getElementById('custom-station-font');
      if (existingLink) existingLink.remove();
    };
  }, [branding]);

  return <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-color)] font-station transition-colors duration-200">{children}</div>;
}
