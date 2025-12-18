import { useState, useEffect } from 'react';

export function usePlatform() {
  const [platform, setPlatform] = useState({
    isNative: false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updatePlatform = () => {
      const isNative =
        window.WTN?.isNativeApp === true;
      
      const isDesktop = window.innerWidth >= 768; // Tailwind's md breakpoint

      setPlatform({
        isNative,
        isDesktop,
      });
    };

    updatePlatform();
    window.addEventListener('resize', updatePlatform);
    return () => window.removeEventListener('resize', updatePlatform);
  }, []);

  return platform;
}