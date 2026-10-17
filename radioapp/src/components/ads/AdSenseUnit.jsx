import React, { useEffect, useRef, useState } from 'react';

/**
 * AdSenseUnit Component
 * 
 * Client ID: ca-pub-4078466828008985
 * Slot ID: 7034214536
 * 
 * Features:
 * - Zero Blank Space Guarantee: Container starts with 0 height, 0 margin, and 0 padding.
 * - IntersectionObserver: Only pushes ad request when user scrolls near the container.
 * - MutationObserver: Monitors <ins> for data-ad-status="filled" or loaded iframe.
 * - If ad fails, is unfilled, or adblocker active: Remains completely collapsed (0px).
 * - No critical/sensitive user data or tokens are ever exposed.
 */
export function AdSenseUnit({
  slot = '7034214536',
  client = 'ca-pub-4078466828008985',
  format = 'auto',
  layout = '',
  layoutKey = '',
  responsive = true,
  className = '',
  style = {},
  showLabel = true,
}) {
  const containerRef = useRef(null);
  const insRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
  const [isUnfilled, setIsUnfilled] = useState(false);
  const adRequestedRef = useRef(false);

  // 1. IntersectionObserver: Trigger ad loading only when near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '250px' } // Pre-load 250px before entering viewport
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // 2. Request ad when in view
  useEffect(() => {
    if (!isIntersecting || adRequestedRef.current) return;
    adRequestedRef.current = true;

    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn('[AdSense] Push request deferred:', e.message);
    }
  }, [isIntersecting]);

  // 3. MutationObserver & Resize check: Only expand when ad is genuinely rendered
  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;

    const checkFilledStatus = () => {
      const status = ins.getAttribute('data-ad-status');
      if (status === 'filled') {
        setIsFilled(true);
        setIsUnfilled(false);
      } else if (status === 'unfilled') {
        setIsUnfilled(true);
        setIsFilled(false);
      } else {
        // Check if iframe or child content with height exists
        const hasIframe = ins.querySelector('iframe');
        if (hasIframe && (ins.offsetHeight > 20 || hasIframe.offsetHeight > 20)) {
          setIsFilled(true);
          setIsUnfilled(false);
        }
      }
    };

    const mutationObserver = new MutationObserver(() => {
      checkFilledStatus();
    });

    mutationObserver.observe(ins, {
      attributes: true,
      attributeFilter: ['data-ad-status', 'style'],
      childList: true,
      subtree: true,
    });

    // Fallback timer check in case MutationObserver misses edge render
    const timeout = setTimeout(checkFilledStatus, 1500);

    return () => {
      mutationObserver.disconnect();
      clearTimeout(timeout);
    };
  }, [isIntersecting]);

  // If ad is confirmed unfilled, render nothing (no space taken)
  if (isUnfilled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`adsense-wrapper transition-all duration-300 ${
        isFilled ? 'is-ready my-6 py-2' : 'h-0 m-0 p-0 overflow-hidden'
      } ${className}`}
      style={{
        display: isFilled ? 'block' : 'none',
        ...style,
      }}
    >
      {isFilled && showLabel && (
        <div className="text-center mb-1">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 select-none">
            Advertisement
          </span>
        </div>
      )}

      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          textAlign: 'center',
          ...style,
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      />
    </div>
  );
}

export default AdSenseUnit;
