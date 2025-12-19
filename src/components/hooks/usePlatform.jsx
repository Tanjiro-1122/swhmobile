import { useState, useEffect } from 'react';
import { detectPlatform } from '../utils/platform';

export const usePlatform = () => {
  // ✅ FIX: Use lazy initialization to call the function
  const [platform, setPlatform] = useState(() => detectPlatform());

  useEffect(() => {
    const handleResize = () => {
      setPlatform(detectPlatform());
    };

    window.addEventListener('resize', handleResize);
    // No need to call handleResize() here since useState already has correct value
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return platform;
};