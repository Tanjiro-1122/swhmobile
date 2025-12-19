import { useState, useEffect } from 'react';
import { detectPlatform } from '../utils/platform';

export const usePlatform = () => {
  const [platform, setPlatform] = useState(detectPlatform);

  useEffect(() => {
    const handleResize = () => {
      setPlatform(detectPlatform());
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return platform;
};