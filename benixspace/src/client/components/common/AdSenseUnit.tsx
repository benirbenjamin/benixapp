import React, { useEffect, useRef, useState } from 'react';
import { ADSENSE_CONFIG } from '../../config/adsense';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdSenseUnitProps {
  slot?: string;
  clientId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'autorelaxed' | 'horizontal';
  responsive?: boolean;
  layoutKey?: string;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: number | string;
  maxHeight?: number | string;
  isCompact?: boolean;
  fallback?: React.ReactNode;
  creatorName?: string;
  timeoutMs?: number;
  onStatusChange?: (status: 'filled' | 'unfilled') => void;
}

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  slot = ADSENSE_CONFIG.DEFAULT_SLOT_ID,
  clientId = ADSENSE_CONFIG.CLIENT_ID,
  format = 'auto',
  responsive = true,
  layoutKey,
  className = '',
  style = {},
  minHeight,
  maxHeight,
  isCompact = false,
  fallback,
  creatorName,
  timeoutMs = 1800,
  onStatusChange,
}) => {
  const insRef = useRef<HTMLModElement | null>(null);
  const [isUnfilled, setIsUnfilled] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const insNode = insRef.current;
    if (!insNode) return;

    // Reset status on mount / slot change
    setIsUnfilled(false);
    setHasLoaded(false);

    // Timeout guard: If Google AdSense has not rendered filled content within timeoutMs, trigger fallback
    const timer = setTimeout(() => {
      const ins = insRef.current;
      if (!ins) return;

      const status = ins.getAttribute('data-ad-status');
      if (status === 'filled') {
        setIsUnfilled(false);
        setHasLoaded(true);
        onStatusChange?.('filled');
        return;
      }

      const iframe = ins.querySelector('iframe');
      const hasRealContent = Boolean(
        iframe &&
          (iframe.offsetHeight > 10 ||
            (iframe.contentDocument &&
              iframe.contentDocument.body &&
              iframe.contentDocument.body.children.length > 0))
      );

      if (status === 'unfilled' || !hasRealContent) {
        setIsUnfilled(true);
        onStatusChange?.('unfilled');
      } else {
        setIsUnfilled(false);
        setHasLoaded(true);
        onStatusChange?.('filled');
      }
    }, timeoutMs);

    // MutationObserver to track Google AdSense status changes
    const observer = new MutationObserver(() => {
      const status = insNode.getAttribute('data-ad-status');
      if (status === 'unfilled') {
        clearTimeout(timer);
        setIsUnfilled(true);
        onStatusChange?.('unfilled');
      } else if (status === 'filled') {
        clearTimeout(timer);
        setIsUnfilled(false);
        setHasLoaded(true);
        onStatusChange?.('filled');
      }
    });

    observer.observe(insNode, {
      attributes: true,
      attributeFilter: ['data-ad-status', 'class'],
      childList: true,
      subtree: true,
    });

    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      // AdBlock or duplicate push: immediately trigger fallback
      clearTimeout(timer);
      setIsUnfilled(true);
      onStatusChange?.('unfilled');
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [slot, clientId, timeoutMs]);

  const defaultCompactFallback = (
    <div className="w-full h-[50px] max-h-[50px] flex items-center justify-between px-3 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-slate-700/60 rounded-xl text-white select-none">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
          ★
        </div>
        <div className="text-left min-w-0">
          <p className="text-[11px] font-bold text-white truncate leading-tight">BenixSpace Sponsor Spotlight</p>
          <p className="text-[9px] text-slate-400 truncate">Supporting @{creatorName || 'Creator'} earnings</p>
        </div>
      </div>
      <a
        href="https://benix.space/dashboard#wallet"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-white shadow shrink-0 transition"
      >
        Learn More
      </a>
    </div>
  );

  if (isUnfilled) {
    if (fallback) return <>{fallback}</>;
    if (isCompact) return defaultCompactFallback;
    return null;
  }

  const effectiveMinHeight = minHeight || style?.minHeight || (isCompact ? 50 : '90px');
  const effectiveMaxHeight = maxHeight || (isCompact ? 55 : undefined);
  const effectiveFormat = isCompact ? 'horizontal' : format;
  const effectiveResponsive = isCompact ? false : responsive;

  return (
    <div
      className={`adsense-container w-full text-center transition-all duration-300 ${
        isCompact
          ? `adsense-compact ${className || 'my-0 py-0'}`
          : className.includes('my-')
          ? className
          : `my-6 ${className}`
      }`}
      style={{
        display: isCompact ? 'flex' : 'block',
        alignItems: isCompact ? 'center' : undefined,
        justifyContent: isCompact ? 'center' : undefined,
        height: isCompact ? (typeof effectiveMinHeight === 'number' ? `${effectiveMinHeight}px` : effectiveMinHeight) : undefined,
        minHeight: typeof effectiveMinHeight === 'number' ? `${effectiveMinHeight}px` : effectiveMinHeight,
        maxHeight: effectiveMaxHeight ? (typeof effectiveMaxHeight === 'number' ? `${effectiveMaxHeight}px` : effectiveMaxHeight) : undefined,
        overflow: 'hidden',
        ...style
      }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{
          display: isCompact ? 'inline-block' : 'block',
          textAlign: 'center',
          width: '100%',
          maxWidth: isCompact ? '468px' : undefined,
          minWidth: isCompact ? undefined : '250px',
          height: isCompact ? '50px' : undefined,
          minHeight: isCompact ? '50px' : (typeof effectiveMinHeight === 'number' ? `${effectiveMinHeight}px` : effectiveMinHeight) || '90px',
          maxHeight: isCompact ? '55px' : undefined,
          overflow: 'hidden',
        }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={effectiveFormat}
        data-full-width-responsive={effectiveResponsive ? 'true' : 'false'}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      />
    </div>
  );
};
