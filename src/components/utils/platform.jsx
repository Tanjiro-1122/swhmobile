// utils/platform.js
export const detectPlatform = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    // Default for SSR or non-browser environments
    return {
      isIOSNative: false,
      isAndroidNative: false,
      isWeb: true,
      isNativeApp: false,
      isMobileScreen: false,
      isDesktopScreen: true,
      isIOSDevice: false,
      isAndroidDevice: false,
    };
  }

  const ua = navigator.userAgent || '';
  const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroidDevice = /Android/i.test(ua);
  
  const isNativeApp = !!(window.WTN && window.WTN.isNativeApp);
  const isWeb = !isNativeApp;

  const screenWidth = window.innerWidth;
  const isMobileScreen = isNativeApp || screenWidth < 768; // Use < 768 to be definitive

  return {
    isIOSNative: isIOSDevice && isNativeApp,
    isAndroidNative: isAndroidDevice && isNativeApp,
    isWeb,
    isNativeApp,
    isMobileScreen,
    isDesktopScreen: !isMobileScreen,
    isIOSDevice,
    isAndroidDevice,
  };
};