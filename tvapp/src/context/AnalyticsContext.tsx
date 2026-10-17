import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeVisitorTracking } from '../utils/visitor';
import { trackEvent } from '../services/api';

interface AnalyticsContextType {
  visitorId: string;
  sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const trackingRef = useRef<{ visitorId: string; sessionId: string }>({
    visitorId: '',
    sessionId: '',
  });

  useEffect(() => {
    const { visitorId, sessionId } = initializeVisitorTracking();
    trackingRef.current = { visitorId, sessionId };
  }, []);

  // Track page views on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      trackEvent({
        event_type: 'PAGE_VIEW',
        page_url: window.location.href,
        referrer: document.referrer,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <AnalyticsContext.Provider value={trackingRef.current}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
