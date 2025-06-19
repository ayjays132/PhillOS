
import { useState, useEffect } from 'react';

const DESKTOP_THRESHOLD = 1024; // Tailwind 'lg' breakpoint

export function useResponsive(): { isMobileLayout: boolean } {
  const [width, setWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobileLayout: width < DESKTOP_THRESHOLD };
}
