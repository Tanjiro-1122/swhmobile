import { useState, useEffect } from 'react';
import { detectPlatform } from '../utils/platform';

export const usePlatform = () => {
  const [platform, setPlatform] = useState(() => detectPlatform());

  useEffect(() => {
    // Re-detect immediately after mount — ReactNativeWebView / __SWH_NATIVE__ may not be ready on first render
    setPlatform(detectPlatform());

    // Re-detect after short delay as a safety net for slow native bridge init
    const t1 = setTimeout(() => setPlatform(detectPlatform()), 100);
    const t2 = setTimeout(() => setPlatform(detectPlatform()), 500);

    const handleResize = () => {
      setPlatform(detectPlatform());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return platform;
};