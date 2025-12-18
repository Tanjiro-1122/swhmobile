// utils/platform.js
export const detectPlatform = () => {
  if (typeof window === 'undefined') {
    return { isIOS: false, isAndroid: false, isWeb: true, isNativeApp: false };
  }
  
  const ua = navigator.userAgent || '';
  const isIOSDevice = /iPhone|iPad|iPod/i.test(ua);
  const isAndroidDevice = /Android/i.test(ua);
  
  // WTN.isNativeApp is the flag set by the native wrapper
  const isNativeApp = typeof window.WTN !== 'undefined' && window.WTN.isNativeApp === true;

  const isWeb = !isNativeApp;

  return {
    isIOS: isIOSDevice && isNativeApp,
    isAndroid: isAndroidDevice && isNativeApp,
    isWeb,
    isNativeApp
  };
};