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
      hasTouchScreen: false,
    };
  }

  const ua = navigator.userAgent || '';
  
  // Detect iOS devices (iPhone, iPad, iPod)
  const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Detect Android devices
  const isAndroidDevice = /Android/i.test(ua);
  
  // Detect if running in a native app wrapper (WebView)
  // CRITICAL: Only consider it a native app if WTN exists AND has isNativeApp flag
  // This prevents Safari/Chrome on web from being detected as native apps
  const isNativeApp = !!(
    (window.WTN && window.WTN.isNativeApp === true) || 
    window.ReactNativeWebView ||
    (isAndroidDevice && /wv/.test(ua)) // Android WebView marker
  );
  
  const isWeb = !isNativeApp;

  const screenWidth = window.innerWidth;
  
  // Check for touch capability as additional mobile indicator
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Consider mobile only if: native app or small screen (ignore device type for web)
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
    hasTouchScreen,
  };
};