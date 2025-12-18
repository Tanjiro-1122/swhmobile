// utils/platform.js
export const detectPlatform = () => {
  const ua = navigator.userAgent || '';
  // More robust iOS check, looking at platform as a fallback for tricky webviews
      const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroidDevice = /Android/i.test(ua);
  
  const isNativeApp = typeof window !== 'undefined' && 
                      typeof window.WTN !== 'undefined' && 
                      window.WTN.isNativeApp === true;

  return {
    isIOSNative: isIOSDevice && isNativeApp,
    isAndroidNative: isAndroidDevice && isNativeApp,
    isWeb: !isNativeApp, // Simply true if not running in the native app wrapper
    isNativeApp: isNativeApp,
    // adding device type for web logic
    isIOSDevice,
    isAndroidDevice
  };
};