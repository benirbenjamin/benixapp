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
  format?: 'auto' | 'fluid' | 'rectangle' | 'autorelaxed';
  responsive?: boolean;
  layoutKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  slot = ADSENSE_CONFIG.DEFAULT_SLOT_ID,
  clientId = ADSENSE_CONFIG.CLIENT_ID,
  format = 'auto',
  responsive = true,
  layoutKey,
  className = '',
  style = {},
}) => {
  const insRef = useRef<HTMLModElement | null>(null);
  const [isUnfilled, setIsUnfilled] = useState(false);

  useEffect(() => {
    const insNode = insRef.current;
    if (!insNode) return;

    // MutationObserver to hide container ONLY if AdSense explicitly returns unfilled status
    const observer = new MutationObserver(() => {
      const status = insNode.getAttribute('data-ad-status');
      if (status === 'unfilled') {
        setIsUnfilled(true);
      } else if (status === 'filled') {
        setIsUnfilled(false);
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
      // Catch duplicate push or adblocker restrictions gracefully
    }

    return () => {
      observer.disconnect();
    };
  }, [slot, clientId]);

  if (isUnfilled) {
    return null;
  }

  return (
    <div
      className={`adsense-container my-6 w-full text-center transition-all duration-300 ${className}`}
      style={{
        display: 'block',
        minHeight: '90px',
        overflow: 'hidden',
        ...style
      }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          textAlign: 'center',
          minWidth: '250px',
          minHeight: '90px',
        }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      />
    </div>
  );
};
