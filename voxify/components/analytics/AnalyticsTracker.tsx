'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem('voxify_analytics_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('voxify_analytics_session_id', sessionId);
  }
  return sessionId;
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const durationRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sessionId = getOrCreateSessionId();
    const referrer = document.referrer || 'direct';
    const deviceType = getDeviceType();
    const userAgent = navigator.userAgent;
    startTimeRef.current = Date.now();
    durationRef.current = 0;

    const sendTrackPing = (accumulatedSeconds: number) => {
      const payload = {
        sessionId,
        userId: user?.id || null,
        pagePath: pathname,
        referrer,
        deviceType,
        userAgent,
        durationSeconds: accumulatedSeconds,
      };

      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/track', blob);
      } else {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    };

    // Initial pageview tracking
    sendTrackPing(5);

    // Heartbeat duration timer every 15s
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      durationRef.current = elapsedSeconds;
      sendTrackPing(elapsedSeconds);
    }, 15000);

    // Pagehide / visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        sendTrackPing(elapsedSeconds);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      sendTrackPing(elapsedSeconds);
    };
  }, [pathname, user?.id]);

  return null;
}
