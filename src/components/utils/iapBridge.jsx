// components/utils/iapBridge.js
// Global IAP bridge helper for safe JS -> Native calls (WebToNative / WKWebView / Android bridge)

import { base44 } from "@/api/base44Client";

if (typeof window !== "undefined") {
  window.__iapCallbacks = window.__iapCallbacks || {};
}

export function registerIAPCallback(cb) {
  const id = `iap_cb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  window.__iapCallbacks[id] = (data) => {
    try {
      cb(data);
    } finally {
      try { delete window.__iapCallbacks[id]; } catch(e) {}
    }
  };
  return id;
}

export async function callNativeIAPWithCallback(iapConfig, cb) {
  let callbackFired = false;
  
  const callbackId = registerIAPCallback((data) => {
    if (callbackFired) return; // Prevent duplicate callbacks
    callbackFired = true;
    clearTimeout(timeoutId);
    console.log('IAP callback received:', { error: data.error, isSuccess: data.isSuccess });
    cb(data);
  });
  
  const payload = { ...iapConfig, callbackId };

  // Set a 15-second timeout - if no callback fires, assume cancelled or dismissed
  const timeoutId = setTimeout(() => {
    if (window.__iapCallbacks[callbackId] && !callbackFired) {
      callbackFired = true;
      console.log('IAP timeout - treating as cancellation');
      delete window.__iapCallbacks[callbackId];
      cb({ isSuccess: false, error: 'user_cancelled', isCancelled: true });
    }
  }, 15000);

  if (window.WTN && typeof window.WTN.inAppPurchase === "function") {
    console.log('Calling WTN.inAppPurchase with productId:', payload.productId);
    window.WTN.inAppPurchase(payload);
    return;
  }

  if (window.webkit?.messageHandlers?.inAppPurchase) {
    console.log('Calling webkit.messageHandlers.inAppPurchase with productId:', payload.productId);
    window.webkit.messageHandlers.inAppPurchase.postMessage(payload);
    return;
  }

  if (window.Android?.inAppPurchase) {
    try {
      console.log('Calling Android.inAppPurchase with productId:', payload.productId);
      window.Android.inAppPurchase(JSON.stringify(payload));
    } catch (err) {
      if (typeof window.Android.inAppPurchase === "function") {
        window.Android.inAppPurchase(payload);
      } else {
        clearTimeout(timeoutId);
        throw err;
      }
    }
    return;
  }

  clearTimeout(timeoutId);
  throw new Error("IAP bridge not available on this device.");
}

/**
 * submitReceiptToServer
 * - iOS: pass `receipt` (base64 string)
 * - Android: pass `purchaseToken` and productId
 */
export async function submitReceiptToServer({ receipt, productId, platform, purchaseToken }) {
  try {
    if (platform === "ios") {
      await base44.functions.invoke("handleAppleIAP", { receipt, productId, platform: "ios" });
    } else if (platform === "android") {
      await base44.functions.invoke("handleGooglePlayIAP", { purchaseToken, productId });
    }
  } catch (err) {
    console.error("submitReceiptToServer error:", err);
  }
}