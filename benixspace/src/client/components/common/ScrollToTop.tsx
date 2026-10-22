import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Immediately scroll window to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (document.body) {
      document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }

    // Also reset scroll position for any scrollable main view or container
    const scrollables = document.querySelectorAll('main, .overflow-y-auto');
    scrollables.forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname, search]);

  return null;
};
