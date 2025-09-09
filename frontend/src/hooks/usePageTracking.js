import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view when location changes
    if (window.gtag) {
      window.gtag('config', 'G-E1PHKW7MLQ', {
        page_path: location.pathname + location.search,
        page_title: document.title
      });
    }
  }, [location]);
}; 