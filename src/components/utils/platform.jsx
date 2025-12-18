// utils/platform.js
export const detectPlatform = () => {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isWeb = !isIOS && !isAndroid;
  
  const isNativeApp = typeof window !== 'undefined' && 
                      typeof window.WTN !== 'undefined' && 
                      window.WTN.isNativeApp === true;

  return {
    isIOS: isIOS && isNativeApp,
    isAndroid: isAndroid && isNativeApp,
    isWeb: isWeb || !isNativeApp,
    isNativeApp: isNativeApp
  };
};