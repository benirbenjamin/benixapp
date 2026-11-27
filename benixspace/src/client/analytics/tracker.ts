import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordClientAnalyticsEvent } from '../services/api';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

function getSessionId(): string {
  let sessionId = localStorage.getItem('benix_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('benix_session_id', sessionId);
  }
  return sessionId;
}

function getVisitorId(): string {
  let visitorId = localStorage.getItem('benix_visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('benix_visitor_id', visitorId);
  }
  return visitorId;
}

function detectDevice(): { device: string; browser: string; os: string } {
  const ua = navigator.userAgent;
  let device = 'desktop';
  if (/mobile/i.test(ua)) device = 'mobile';
  else if (/tablet|ipad/i.test(ua)) device = 'tablet';

  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'Windows';
  if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { device, browser, os };
}

export function trackPageView(pageUrl: string, pageType: string, projectId?: number, articleId?: number) {
  try {
    const { device, browser, os } = detectDevice();
    recordClientAnalyticsEvent({
      event_type: 'page_view',
      page_url: pageUrl,
      page_path: `${window.location.pathname}${window.location.search}`,
      page_type: pageType,
      project_id: projectId || null,
      article_id: articleId || null,
      referrer: document.referrer || 'Direct',
      user_agent: navigator.userAgent,
      device_type: device,
      browser,
      os,
      session_id: getSessionId(),
      visitor_id: getVisitorId()
    });
  } catch (err) {
    // Silent catch for analytics
  }
}

export function trackProjectClick(projectId: number, _projectUrl: string) {
  try {
    const { device, browser, os } = detectDevice();
    recordClientAnalyticsEvent({
      event_type: 'project_external_click',
      page_url: window.location.href,
      page_type: 'project_click',
      project_id: projectId,
      referrer: document.referrer || 'Direct',
      user_agent: navigator.userAgent,
      device_type: device,
      browser,
      os,
      session_id: getSessionId()
    });
  } catch (err) {
    // Silent catch
  }
}

export const RouteAnalyticsTracker: React.FC = () => {
  const location = useLocation();

  // Heartbeat keeps session duration accurate for "time on site" metrics
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        try {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
              event_type: 'heartbeat',
              page_path: `${window.location.pathname}${window.location.search}`,
              session_id: getSessionId(),
              visitor_id: getVisitorId(),
              duration_ms: 30000
            })
          }).catch(() => {});
        } catch {}
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Skip tracking admin panel pages so admin browsing doesn't pollute visitor stats
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    let pageType = 'general';
    const path = location.pathname;
    if (path === '/') pageType = 'home';
    else if (path.startsWith('/projects')) pageType = path.split('/').filter(Boolean).length > 1 ? 'project_detail' : 'projects';
    else if (path.startsWith('/blog')) pageType = path.split('/').filter(Boolean).length > 1 ? 'blog_detail' : 'blog';
    else if (path === '/services') pageType = 'services';
    else if (path === '/about') pageType = 'about';
    else if (path === '/contact') pageType = 'contact';

    trackPageView(window.location.href, pageType);

    // Google Analytics 4 SPA page view (config uses send_page_view: false)
    try {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
          page_path: `${location.pathname}${location.search}`,
          page_location: window.location.href,
          page_title: document.title
        });
      }
    } catch {
      // Silent catch for analytics
    }
  }, [location.pathname, location.search]);

  return null;
};
