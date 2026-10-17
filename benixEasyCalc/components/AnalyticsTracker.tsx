'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '../lib/supabase/analytics';

/**
 * Global client-side analytics tracker.
 * Listens to pathname changes and logs 'page_visit' events to Supabase analytics_events.
 * Skips /admin routes to ensure public metrics stay clean.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Do not track admin portal views in public organic traffic metrics
    if (pathname.startsWith('/admin')) return;

    // Avoid duplicate triggers for the same pathname in fast re-renders
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    let calcId: string | undefined;
    if (pathname.startsWith('/calculators/')) {
      const parts = pathname.split('/');
      if (parts[2]) {
        calcId = parts[2];
      }
    }

    trackEvent({
      eventType: 'page_visit',
      pagePath: pathname,
      calculatorId: calcId,
    });
  }, [pathname]);

  return null;
}
