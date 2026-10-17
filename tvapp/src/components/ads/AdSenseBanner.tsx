import React, { useEffect, useRef, useState } from 'react';
import { ADS_CONFIG } from '../../config/ads';
import { useAds } from '../../context/AdContext';
import { CustomAd } from '../../types';
import { ExternalLink, Sparkles, Megaphone } from 'lucide-react';
import { AdvertiseHereCard } from './AdvertiseHereCard';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdSenseBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  refreshInterval?: number;
  label?: string;
  minHeight?: string;
  fallbackSponsored?: boolean;
  sponsorIndex?: number;
  forceDisplayMode?: 'GOOGLE' | 'CUSTOM';
  onAdLoaded?: () => void;
}

const FAKE_PLACEHOLDER_SLOTS = [
  '1234567890',
  '2345678901',
  '3456789012',
  '4567890123',
  '5678901234',
  '0000000000',
];

const isValidAdSlot = (slotId?: string): boolean => {
  if (!slotId) return false;
  const trimmed = slotId.trim();
  if (!trimmed) return false;
  if (FAKE_PLACEHOLDER_SLOTS.includes(trimmed)) return false;
  return true;
};

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slot = ADS_CONFIG.SLOTS.TV_COMPANION_BANNER,
  format = 'auto',
  responsive = true,
  className = '',
  style,
  refreshInterval = 0,
  label = 'Sponsored',
  fallbackSponsored = true,
  forceDisplayMode,
  onAdLoaded,
}) => {
  const { getNextAdDisplayType, getRandomCustomAd, trackImpression, trackClick } = useAds();

  const [adKey, setAdKey] = useState<number>(0);
  const [isAdFilled, setIsAdFilled] = useState<boolean>(false);
  const [showFallback, setShowFallback] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<'GOOGLE' | 'CUSTOM'>('GOOGLE');
  const [selectedCustomAd, setSelectedCustomAd] = useState<CustomAd | null>(null);

  const insRef = useRef<HTMLModElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const validSlot = isValidAdSlot(slot) ? slot : undefined;

  // Initialize display mode (Google AdSense vs Custom Ad) on component mount/adKey change
  useEffect(() => {
    const nextMode = forceDisplayMode || getNextAdDisplayType();
    setDisplayMode(nextMode);

    if (nextMode === 'CUSTOM') {
      const customAd = getRandomCustomAd();
      setSelectedCustomAd(customAd);
      if (customAd) {
        trackImpression(customAd.id);
      }
      if (onAdLoaded) onAdLoaded();
    }
  }, [adKey, forceDisplayMode]);

  // Push to adsbygoogle on mount when in GOOGLE mode and container is visible with width > 0
  useEffect(() => {
    if (displayMode !== 'GOOGLE') return;
    const insElement = insRef.current;
    if (!insElement) return;

    if (slot && !validSlot) {
      console.warn(
        `[Google AdSense WARN] Slot ID "${slot}" is a placeholder or invalid. Omitting data-ad-slot attribute to avoid Google DoubleClick HTTP 400 Bad Request error. ` +
        `To use a specific Ad Unit, replace this slot ID in src/config/ads.ts with a valid 10-digit Ad Unit ID from your Google AdSense Dashboard.`
      );
    }

    // Check if this ins element has already been processed by Google AdSense
    const isDone =
      insElement.getAttribute('data-adsbygoogle-status') === 'done' ||
      insElement.getAttribute('data-ad-status') === 'filled' ||
      insElement.getAttribute('data-ad-status') === 'unfilled';

    if (isDone) {
      return;
    }

    let isPushed = false;

    const attemptPush = () => {
      if (isPushed) return;
      if (!insRef.current) return;

      const currentIns = insRef.current;
      const status = currentIns.getAttribute('data-adsbygoogle-status');
      if (status === 'done') return;

      const width = currentIns.offsetWidth || currentIns.getBoundingClientRect().width;
      if (width <= 0) {
        // Container has not rendered width yet (e.g. inside modal transition or width=0)
        return;
      }

      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isPushed = true;
          console.log(
            `[Google AdSense] Successfully pushed ({}) to window.adsbygoogle queue (Width: ${Math.round(width)}px, Client: ${ADS_CONFIG.CLIENT_ID}).`
          );
        }
      } catch (err: any) {
        console.error(`[Google AdSense ERROR] Failed to push to adsbygoogle queue:`, err?.message || err);
      }
    };

    attemptPush();

    const timer1 = setTimeout(attemptPush, 200);
    const timer2 = setTimeout(attemptPush, 600);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && insElement) {
      resizeObserver = new ResizeObserver(() => {
        attemptPush();
      });
      resizeObserver.observe(insElement);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [adKey, displayMode, slot, validSlot, format]);

  // Check if Google AdSense has truly filled with visible rendered height
  useEffect(() => {
    if (displayMode !== 'GOOGLE') return;

    const insElement = insRef.current;
    if (!insElement) return;

    let timeoutTimer: any = null;

    const checkFilledStatus = () => {
      const status = insElement.getAttribute('data-ad-status');
      const iframe = insElement.querySelector('iframe');
      
      const hasRenderedHeight =
        (iframe && (iframe.offsetHeight > 30 || iframe.getBoundingClientRect().height > 30)) ||
        insElement.offsetHeight > 30;

      if (status === 'filled' && hasRenderedHeight) {
        console.log(`[Google AdSense SUCCESS] Ad filled and rendered successfully for slot "${slot || '(Auto-Ad)'}".`);
        setIsAdFilled(true);
        setShowFallback(false);
        if (onAdLoaded) onAdLoaded();
      } else if (status === 'unfilled') {
        console.warn(
          `[Google AdSense WARN] Google returned data-ad-status="unfilled" for slot "${slot || '(Auto-Ad)'}".\n` +
          `  Possible causes:\n` +
          `  1. Slot ID "${slot || '(Auto-Ad)'}" is a placeholder or not created in Google AdSense Publisher Account (${ADS_CONFIG.CLIENT_ID}).\n` +
          `  2. Domain (e.g. localhost or unapproved domain) is not authorized in AdSense Dashboard.\n` +
          `  3. Publisher account is pending review or disabled.\n` +
          `  4. No ad inventory available for this region.`
        );
        setIsAdFilled(false);
        if (fallbackSponsored) {
          setShowFallback(true);
          const customAd = getRandomCustomAd();
          setSelectedCustomAd(customAd);
          if (customAd) trackImpression(customAd.id);
          if (onAdLoaded) onAdLoaded();
        }
      } else if (iframe && hasRenderedHeight) {
        console.log(`[Google AdSense SUCCESS] Rendered ad iframe detected for slot "${slot || '(Auto-Ad)'}".`);
        setIsAdFilled(true);
        setShowFallback(false);
        if (onAdLoaded) onAdLoaded();
      }
    };

    checkFilledStatus();
    const checkTimer1 = setTimeout(checkFilledStatus, 800);
    const checkTimer2 = setTimeout(checkFilledStatus, 2000);

    if (fallbackSponsored) {
      timeoutTimer = setTimeout(() => {
        if (!isAdFilled) {
          const currentStatus = insElement.getAttribute('data-ad-status');
          console.warn(
            `[Google AdSense TIMEOUT] Slot "${slot}" did not render an ad within 2.5s (data-ad-status: "${currentStatus || 'none'}"). ` +
            `Falling back to Custom Sponsor Ad.`
          );
          setShowFallback(true);
          const customAd = getRandomCustomAd();
          setSelectedCustomAd(customAd);
          if (customAd) trackImpression(customAd.id);
          if (onAdLoaded) onAdLoaded();
        }
      }, 2500);
    }

    const observer = new MutationObserver(() => {
      checkFilledStatus();
    });

    observer.observe(insElement, {
      attributes: true,
      attributeFilter: ['data-ad-status'],
      childList: true,
      subtree: true,
    });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkFilledStatus();
      });
      resizeObserver.observe(insElement);
    }

    return () => {
      clearTimeout(checkTimer1);
      clearTimeout(checkTimer2);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [adKey, fallbackSponsored, isAdFilled, displayMode, slot]);

  // Periodic Refresh
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      setIsAdFilled(false);
      setAdKey((prev) => prev + 1);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // RENDER CUSTOM AD OR SPONSOR FALLBACK (Guarantees zero blank space if Google returns unfilled)
  if (displayMode === 'CUSTOM' || (showFallback && !isAdFilled)) {
    if (selectedCustomAd) {
      return (
        <div className={`w-full my-4 animate-fadeIn ${className}`}>
          <div className="flex items-center justify-between px-1 mb-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400 select-none">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rba-yellow" />
              {label} • {selectedCustomAd.badge_text || 'Sponsored'}
            </span>
            <span className="text-[9px] font-medium text-slate-400">Official Partner</span>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r ${selectedCustomAd.bg_gradient || 'from-blue-900 via-indigo-900 to-slate-900'} text-white shadow-md border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative`}>
            
            {/* Background image if present */}
            {selectedCustomAd.banner_url && selectedCustomAd.media_type === 'IMAGE' && (
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center" style={{ backgroundImage: `url(${selectedCustomAd.banner_url})` }} />
            )}

            <div className="flex items-center gap-3.5 min-w-0 z-10">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-md shrink-0 text-white font-black text-lg"
                style={{ backgroundColor: selectedCustomAd.accent_color || '#0284c7' }}
              >
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                    {selectedCustomAd.sponsor_name}
                  </h4>
                  <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-white/20 text-white uppercase tracking-wider">
                    {selectedCustomAd.category || 'Sponsor'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-amber-200 line-clamp-1">
                  {selectedCustomAd.title}
                </p>
                {selectedCustomAd.tagline && (
                  <p className="text-[11px] sm:text-xs text-slate-200 line-clamp-1 hidden xs:block">
                    {selectedCustomAd.tagline}
                  </p>
                )}
              </div>
            </div>

            <a
              href={selectedCustomAd.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(selectedCustomAd.id)}
              className="z-10 self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs text-slate-950 shadow-md transition-transform hover:scale-105 active:scale-95 shrink-0"
              style={{ backgroundColor: selectedCustomAd.accent_color || '#0284c7' }}
            >
              <span>{selectedCustomAd.cta_text || 'Learn More'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      );
    }

    // High-converting WhatsApp Sponsor Card (guarantees slot is never blank!)
    return <AdvertiseHereCard className={className} variant={format === 'rectangle' ? 'modal' : 'banner'} />;
  }

  // RENDER GOOGLE ADSENSE
  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden transition-all duration-300 my-4 animate-fadeIn ${className}`}
    >
      <div className="flex items-center justify-between px-1 mb-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 select-none">
        <span>{label}</span>
      </div>

      <div
        className="w-full rounded-2xl bg-white/95 border border-slate-200/80 p-2 shadow-sm flex items-center justify-center overflow-hidden min-h-[90px] relative"
        style={{ minHeight: '90px', ...style }}
      >
        <ins
          key={adKey}
          ref={insRef}
          className="adsbygoogle w-full block"
          style={{ display: 'block', width: '100%', minHeight: '90px', ...style }}
          data-ad-client={ADS_CONFIG.CLIENT_ID}
          {...(validSlot ? { 'data-ad-slot': validSlot } : {})}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </div>
  );
};
