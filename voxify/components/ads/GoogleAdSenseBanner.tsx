'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface GoogleAdSenseBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ADSENSE_CLIENT_ID = 'ca-pub-4078466828008985';
const DEFAULT_SLOT_ID = '7034214536';

export function GoogleAdSenseBanner({
  slot = DEFAULT_SLOT_ID,
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
}: GoogleAdSenseBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUnfilled, setIsUnfilled] = useState(false);

  const effectiveSlot = slot || DEFAULT_SLOT_ID;

  useEffect(() => {
    const el = adRef.current;
    if (!el) return;

    const checkStatus = () => {
      if (!el) return;
      const status = el.getAttribute('data-ad-status');
      if (status === 'filled') {
        setIsLoaded(true);
        setIsUnfilled(false);
        return;
      }
      if (status === 'unfilled') {
        setIsLoaded(false);
        setIsUnfilled(true);
        return;
      }

      // Check if an iframe child with non-zero dimensions is rendered
      const iframe = el.querySelector('iframe');
      if (iframe) {
        const height = iframe.offsetHeight || iframe.clientHeight || 0;
        if (height > 10) {
          setIsLoaded(true);
          setIsUnfilled(false);
          return;
        }
      }

      // Check if the ins element itself expanded
      if (el.clientHeight > 20 && status !== 'unfilled') {
        setIsLoaded(true);
        setIsUnfilled(false);
      }
    };

    // Observe attribute and child changes on the <ins> tag
    const observer = new MutationObserver(() => {
      checkStatus();
    });

    observer.observe(el, {
      attributes: true,
      attributeFilter: ['data-ad-status', 'data-adsbygoogle-status', 'style', 'class'],
      childList: true,
      subtree: true,
    });

    // Check periodically for up to 8 seconds in case iframe loads without attribute mutation
    const interval = setInterval(checkStatus, 400);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (el.getAttribute('data-ad-status') === 'unfilled') {
        setIsUnfilled(true);
      }
    }, 8000);

    // Initial check in case it was already hydrated/filled
    checkStatus();

    // Push to adsbygoogle if not already pushed for this element
    if (!pushedRef.current && !el.getAttribute('data-adsbygoogle-status')) {
      try {
        if (typeof window !== 'undefined') {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          pushedRef.current = true;
        }
      } catch (err) {
        console.warn('Google AdSense render notice:', err);
      }
    }

    return () => {
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [effectiveSlot]);

  // If Google AdSense reported unfilled, do not render anything
  if (isUnfilled) {
    return null;
  }

  return (
    <div
      className={`w-full text-center transition-opacity duration-300 ${
        isLoaded ? `my-4 sm:my-6 opacity-100 ${className}` : 'm-0 p-0 opacity-0 pointer-events-none'
      }`}
    >
      {/* Load AdSense script once */}
      <Script
        id="google-adsense-script"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />

      <div className="max-w-7xl mx-auto px-2">
        {/* Only show label if the ad has actually rendered */}
        {isLoaded && (
          <div className="flex items-center justify-between pb-1.5 px-2 text-[10px] uppercase font-bold tracking-widest text-slate-400 select-none">
            <span>Advertisement</span>
            <span className="text-[9px] font-medium text-slate-400/80">Google Ad</span>
          </div>
        )}

        <div className="w-full flex items-center justify-center">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              ...style,
            }}
            data-ad-client={ADSENSE_CLIENT_ID}
            data-ad-slot={effectiveSlot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? 'true' : 'false'}
          />
        </div>
      </div>
    </div>
  );
}
