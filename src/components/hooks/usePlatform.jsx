import { useState, useEffect } from 'react';

/**
 * A hook to determine the current platform (native mobile app vs. web browser).
 * This is crucial for showing web-only features.
 */
export function usePlatform() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // This check relies on the WebToNative bridge, which sets window.WTN.isNativeApp = true
    // ONLY in the native mobile app environment. This is the most reliable way to distinguish
    // from a standard mobile browser.
    const isNativeApp =
      typeof window !== 'undefined' &&
      typeof window.WTN !== 'undefined' &&
      window.WTN.isNativeApp === true;

    setIsNative(isNativeApp);
  }, []);

  return {
    isNative,
    isWeb: !isNative,
  };
}