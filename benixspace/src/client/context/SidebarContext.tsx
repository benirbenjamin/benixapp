import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isMoreExpanded: boolean;
  toggleExpanded: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMore: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start expanded by default on larger desktop screens (>= 1280px)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('benix_sidebar_expanded');
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 1280;
    }
    return true;
  });

  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isMoreExpanded, setIsMoreExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem('benix_sidebar_expanded', String(next));
      return next;
    });
  };

  const openMobile = () => setIsMobileOpen(true);
  const closeMobile = () => setIsMobileOpen(false);
  const toggleMore = () => setIsMoreExpanded((prev) => !prev);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobileOpen,
        isMoreExpanded,
        toggleExpanded,
        openMobile,
        closeMobile,
        toggleMore,
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
