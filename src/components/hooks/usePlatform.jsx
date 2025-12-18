import { useState, useEffect } from 'react';
import { detectPlatform } from '../utils/platform';

export const usePlatform = () => {
  const [platform, setPlatform] = useState(() => {
    if (typeof window === 'undefined') {
      // Default for SSR or environments without window
      return { 
        isNativeApp: false, 
        isWeb: true, 
        isDesktopScreen: true, 
        isMobileScreen: false, 
        isIOSNative: false, 
        isAndroidNative: false,
        isIOSDevice: false,
        isAndroidDevice: false,
      };
    }
    const detected = detectPlatform();
    const isDesktopScreen = window.innerWidth >= 768; // Tailwind's 'md' breakpoint
    const isMobileScreen = !isDesktopScreen;
    return { ...detected, isDesktopScreen, isMobileScreen };
  });

  useEffect(() => {
    const handleResize = () => {
      const detected = detectPlatform();
      const isDesktopScreen = window.innerWidth >= 768;
      const isMobileScreen = !isDesktopScreen;
      setPlatform({ ...detected, isDesktopScreen, isMobileScreen });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return platform;
};