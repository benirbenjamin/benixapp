'use client';

import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  slotId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical';
  className?: string;
  position?: 'top' | 'post-result' | 'mid-content' | 'sidebar' | 'footer';
}

export default function AdBanner({
  slotId = 'default-slot',
  format = 'auto',
  className = '',
  position = 'top',
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && !isLoaded.current) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      }
    } catch (err) {
      // AdSense script may be blocked by adblocker or loading
    }
  }, []);

  return (
    <div
      className={`my-6 flex flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 text-center transition-colors dark:border-slate-800/80 dark:bg-slate-900/30 ${className}`}
      data-ad-position={position}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase dark:text-slate-500">
        <span>Advertisement</span>
      </div>

      <div className="w-full overflow-hidden">
        {/* Google AdSense Unit */}
        <ins
          ref={adRef}
          className="adsbygoogle block"
          style={{ display: 'block', minHeight: format === 'horizontal' ? '90px' : '100px' }}
          data-ad-client="ca-pub-4078466828008985"
          data-ad-slot={slotId !== 'default-slot' ? slotId : undefined}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
