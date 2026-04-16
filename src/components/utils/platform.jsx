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
  // Checks (in order of reliability):
  // 1. Custom flag set by our RN wrapper via injectedJavaScriptBeforeContentLoaded
  // 2. ReactNativeWebView object (set natively by React Native iOS/Android)
  // 3. WTN object from webtonative (legacy)
  // 4. Android WebView UA marker
  const isNativeApp = !!(
    window.__SWH_NATIVE__ === true ||
    window.ReactNativeWebView ||
    (window.WTN && window.WTN.isNativeApp === true) ||
    (isAndroidDevice && /wv/.test(ua))
  );

  const isWeb = !isNativeApp;

  const screenWidth = window.innerWidth;

  // Check for touch capability as additional mobile indicator
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Consider mobile if: native app OR small screen
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
