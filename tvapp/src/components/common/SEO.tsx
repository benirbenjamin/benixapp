import React, { useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
}) => {
  const { settings } = useSettings();

  const siteName = settings.site_name || 'Benix Space TV';
  const defaultDesc =
    settings.site_description ||
    'Watch Live TV, sports, entertainment, and listen to radio broadcasts online on Benix Space TV.';
  const effectiveDescription = description || defaultDesc;
  const effectiveOgImage = ogImage || settings.logo_url || '/logo.png';
  const effectiveCanonical = canonical || `https://tv.benix.space${window.location.pathname}`;

  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | Live Streaming`;

  useEffect(() => {
    // 1. Page Title
    document.title = fullTitle;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', effectiveDescription);

    // 3. OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', fullTitle);

    // 4. OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', effectiveDescription);

    // 5. OpenGraph Image
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute('content', effectiveOgImage);

    // 6. OpenGraph URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', effectiveCanonical);

    // 7. Canonical Tag
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', effectiveCanonical);

    // 8. Dynamic Favicon (if custom logo provided)
    if (settings.logo_url) {
      let iconLink = document.querySelector('link[rel="icon"]');
      if (iconLink) {
        iconLink.setAttribute('href', settings.logo_url);
      }
    }
  }, [fullTitle, effectiveDescription, effectiveOgImage, effectiveCanonical, settings.logo_url]);

  return null;
};
