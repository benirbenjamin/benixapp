import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const DomainContext = createContext(null);

// Standard hosts that represent the central platform (not a custom domain)
const PLATFORM_HOSTS = [
  'localhost',
  '127.0.0.1',
  'radio.benix.space',
  'benix.space',
  'www.benix.space'
];

export function DomainProvider({ children }) {
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [detectedDomain, setDetectedDomain] = useState(null);
  const [domainStationBundle, setDomainStationBundle] = useState(null);
  const [loadingDomain, setLoadingDomain] = useState(true);
  const [domainError, setDomainError] = useState(null);

  const resolveDomain = async () => {
    setLoadingDomain(true);
    setDomainError(null);

    try {
      // 1. Check for query parameter override (e.g. ?domain=kigaliwave.com for local testing)
      const searchParams = new URLSearchParams(window.location.search);
      const queryDomain = searchParams.get('domain');

      let targetDomain = null;
      if (queryDomain && queryDomain.trim()) {
        targetDomain = queryDomain.trim().toLowerCase().split(':')[0].replace(/^www\./, '');
      } else {
        // 2. Check hostname in browser
        const currentHostname = (window.location.hostname || '').toLowerCase().replace(/^www\./, '');
        const isPlatform = PLATFORM_HOSTS.includes(currentHostname) || currentHostname.endsWith('.vercel.app');
        if (!isPlatform && currentHostname) {
          targetDomain = currentHostname;
        }
      }

      if (!targetDomain) {
        setIsCustomDomain(false);
        setDetectedDomain(null);
        setDomainStationBundle(null);
        setLoadingDomain(false);
        return;
      }

      setDetectedDomain(targetDomain);

      // 3. Fetch station bundle by domain
      const data = await api.get(`/stations/by-domain/${encodeURIComponent(targetDomain)}`);
      if (data && data.station) {
        setIsCustomDomain(true);
        setDomainStationBundle(data);
      } else {
        setIsCustomDomain(false);
        setDomainStationBundle(null);
      }
    } catch (err) {
      console.warn('[DomainContext] Custom domain lookup:', err.message);
      setIsCustomDomain(false);
      setDomainStationBundle(null);
      setDomainError(err.message);
    } finally {
      setLoadingDomain(false);
    }
  };

  useEffect(() => {
    resolveDomain();
  }, []);

  return (
    <DomainContext.Provider
      value={{
        isCustomDomain,
        detectedDomain,
        domainStationBundle,
        customStation: domainStationBundle?.station,
        loadingDomain,
        domainError,
        refreshDomain: resolveDomain
      }}
    >
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain() {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
}

export default DomainContext;
