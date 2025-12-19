export const detectPlatform = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
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
  const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroidDevice = /Android/i.test(ua);
  
  const isNativeApp = !!(window.WTN || window.ReactNativeWebView);
  const isWeb = !isNativeApp;

  const screenWidth = window.innerWidth;
  // Also check for touch capability as additional mobile indicator
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileScreen = isNativeApp || screenWidth < 768;

  return {
    isIOSNative: isIOSDevice && isNativeApp,
    isAndroidNative: isAndroidDevice && isNativeApp,
    isWeb,
    isNativeApp,
    isMobileScreen,
    isDesktopScreen: !isMobileScreen,
    isIOSDevice,
    isAndroidDevice,
    hasTouchScreen, // Added for debugging
  };
};