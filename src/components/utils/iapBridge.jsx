import { base44 } from "@/api/base44Client";

/**
 * This file acts as a bridge between the web/React application and native mobile functionalities,
 * particularly for In-App Purchases (IAP) and other platform-specific APIs.
 */

/**
 * Placeholder for Google Play Age Signals API.
 * This function needs to be implemented in the native Android code and exposed to the WebView.
 * When called from Javascript, it should trigger the native process to get age-related signals.
 *
 * @returns {Promise<object>} A promise that resolves with an object containing age signals.
 *          Example success: { status: 'success', ageRange: '13-17', parentalConsent: 'approved' }
 *          Example failure/unsupported: { status: 'error', message: 'Not implemented on this platform.' }
 */
export const getAgeSignals = async () => {
  console.log("Attempting to call getAgeSignals...");

  // Check if the function is exposed by the native wrapper (e.g., via webtonative or a custom bridge)
  if (window.WTN && typeof window.WTN.getAgeSignals === 'function') {
    return window.WTN.getAgeSignals();
  }

  // Fallback for web environment or if native bridge isn't available
  console.warn("getAgeSignals: Native bridge not found. Returning a mock response.");
  return Promise.resolve({
    status: 'unsupported',
    message: 'This feature is only available on the native Android app.'
  });
};


/**
 * Calls the native In-App Purchase flow and handles the response with a callback.
 * @param {object} iapConfig - Configuration for the IAP item (e.g., productId).
 * @param {function} callback - The function to call with the result of the purchase attempt.
 */
export const callNativeIAPWithCallback = async (iapConfig, callback) => {
  console.log('Initiating native IAP with config:', iapConfig);
  if (window.WTN && typeof window.WTN.inAppPurchase === 'function') {
    try {
      // The native side will call the callback function passed here.
      // In WebToNative, the callback is often passed as an argument and invoked from native.
      // We are calling the native function and expecting it to handle the callback.
      window.WTN.inAppPurchase(iapConfig, callback);
    } catch (error) {
      console.error('Error calling native inAppPurchase function:', error);
      callback({ isSuccess: false, error: 'Native call failed' });
    }
  } else {
    console.error('window.WTN.inAppPurchase is not a function.');
    callback({ isSuccess: false, error: 'IAP not available' });
  }
};

/**
 * Submits a purchase receipt to the backend for validation.
 * @param {object} receiptData - The receipt data from the IAP flow.
 * @returns {Promise<void>}
 */
export const submitReceiptToServer = async (receiptData) => {
  console.log('Submitting receipt to server:', receiptData);
  try {
    let response;
    if (receiptData.platform === 'ios') {
      response = await base44.functions.invoke('handleAppleIAP', {
        receiptData: receiptData.receipt,
        productId: receiptData.productId,
      });
    } else if (receiptData.platform === 'android') {
      response = await base44.functions.invoke('handleGooglePlayIAP', {
        token: receiptData.purchaseToken,
        productId: receiptData.productId,
      });
    } else {
      throw new Error('Unsupported platform for receipt validation');
    }

    console.log('Server validation response:', response);
    
    if (response.data.success) {
      console.log('Receipt validated successfully.');
      // The page handles redirection, so we just log success here.
    } else {
      throw new Error(response.data.error || 'Receipt validation failed.');
    }

  } catch (error) {
    console.error('Failed to submit receipt to server:', error);
    // Optionally, log this error to a backend service
    base44.functions.invoke('logError', {
        error_type: 'iap',
        function_name: 'submitReceiptToServer',
        error_message: error.message,
        context: { productId: receiptData.productId, platform: receiptData.platform }
    });
    alert('There was a problem verifying your purchase. Please contact support if the issue persists.');
  }
};