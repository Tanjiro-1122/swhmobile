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
  const isNativeApp = !!(
    window.WTN || 
    window.ReactNativeWebView || 
    window.webkit?.messageHandlers ||
    /wv/.test(ua) || // Android WebView
    (isAndroidDevice && /Version\/[\d.]+/.test(ua) && !/Chrome\/[\d.]+/.test(ua))
  );
  
  const isWeb = !isNativeApp;

  const screenWidth = window.innerWidth;
  
  // Check for touch capability as additional mobile indicator
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Consider mobile if: native app, small screen, or mobile device with touch
  const isMobileScreen = isNativeApp || screenWidth < 768 || ((isIOSDevice || isAndroidDevice) && hasTouchScreen);

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