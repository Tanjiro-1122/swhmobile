// utils/platform.js
export const detectPlatform = () => {
  if (typeof window === 'undefined') {
    return { isIOS: false, isAndroid: false, isWeb: true, isNativeApp: false };
  }
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  
  const isNativeApp = typeof window.WTN !== 'undefined' && window.WTN.isNativeApp === true;

  // If it's a native app, it's not web. Otherwise, it's web.
  const isWeb = !isNativeApp;

  return {
    isIOS: isIOS && isNativeApp,
    isAndroid: isAndroid && isNativeApp,
    isWeb: isWeb,
    isNativeApp: isNativeApp
  };
};