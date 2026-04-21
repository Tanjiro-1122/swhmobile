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
  console.log('Initiating native IAP with config:', JSON.stringify(iapConfig));
  
  // Check if native bridge exists
  if (!window.WTN) {
    console.error('window.WTN is not available');
    callback({ isSuccess: false, error: 'Native bridge not available' });
    return;
  }
  
  if (typeof window.WTN.inAppPurchase !== 'function') {
    console.error('window.WTN.inAppPurchase is not a function. Available methods:', Object.keys(window.WTN));
    callback({ isSuccess: false, error: 'IAP not available' });
    return;
  }

  try {
    console.log('Calling window.WTN.inAppPurchase...');
    
    // Track if callback has been called to prevent duplicate handling
    let callbackCalled = false;
    
    // WebToNative expects the callback to be invoked from native side
    // The callback receives: { isSuccess: boolean, receiptData?: string, purchaseToken?: string, error?: string }
    window.WTN.inAppPurchase(iapConfig, (result) => {
      if (callbackCalled) {
        console.log('IAP callback already processed, ignoring duplicate');
        return;
      }
      callbackCalled = true;
      console.log('Native IAP callback received:', JSON.stringify(result));
      
      // Normalize cancellation responses from different native implementations
      if (!result.isSuccess && !result.receiptData && !result.purchaseToken) {
        const errorStr = (result.error || '').toLowerCase();
        const isCancelled = 
          result.isCancelled === true ||
          result.status === 'cancelled' ||
          errorStr.includes('cancel') ||
          errorStr.includes('user') ||
          errorStr === '' ||
          result.error === undefined;
        
        if (isCancelled) {
          callback({ isSuccess: false, error: 'user_cancelled', isCancelled: true });
          return;
        }
      }
      
      callback(result);
    });
    
    console.log('Native IAP call initiated successfully');
  } catch (error) {
    console.error('Error calling native inAppPurchase function:', error);
    callback({ isSuccess: false, error: error.message || 'Native call failed' });
  }
};

/**
 * Persists receipt data to localStorage so it can be resubmitted after login.
 * Uses the same keys that MyAccount.jsx reads when ?activate_iap=true is present.
 * Throws if the required fields are missing so callers can surface the error
 * instead of silently storing an incomplete/unusable receipt.
 * @param {object} receiptData
 */
const savePendingReceipt = (receiptData) => {
  if (!receiptData.productId) {
    throw new Error('savePendingReceipt: productId is required');
  }

  // For Android the purchaseToken is stored under the same key as the iOS receipt
  // so that MyAccount.activatePendingIAP can use a single code path for both.
  const receiptValue = receiptData.platform === 'android'
    ? receiptData.purchaseToken
    : receiptData.receipt;

  if (!receiptValue) {
    throw new Error('savePendingReceipt: receipt or purchaseToken is required');
  }

  localStorage.setItem('pending_iap_receipt', receiptValue);
  localStorage.setItem('pending_iap_product', receiptData.productId);
  localStorage.setItem('pending_iap_platform', receiptData.platform || 'ios');
};

/**
 * Submits a purchase receipt to the backend for validation.
 * If the user is not authenticated the receipt is saved to localStorage and
 * the user is redirected to the login page.  MyAccount?activate_iap=true
 * will resubmit the receipt automatically after a successful sign-in.
 * @param {object} receiptData - The receipt data from the IAP flow.
 * @returns {Promise<void>}
 */
export const submitReceiptToServer = async (receiptData) => {
  console.log('Submitting receipt to server:', receiptData);

  // Guard: ensure the user session is still valid before hitting the backend.
  // Sessions can expire while the native IAP sheet is open.
  const isAuthenticated = await base44.auth.isAuthenticated();
  if (!isAuthenticated) {
    console.warn('submitReceiptToServer: user not authenticated — saving receipt and redirecting to login');
    savePendingReceipt(receiptData);
    // MyAccount will pick up the pending receipt via ?activate_iap=true after login.
    window.location.href = '/PostPurchaseSignIn';
    return;
  }

  try {
    let response;
    if (receiptData.platform === 'ios') {
      response = await base44.functions.invoke('handleAppleIAP', {
        receipt: receiptData.receipt,
        productId: receiptData.productId,
      });
    } else if (receiptData.platform === 'android') {
      response = await base44.functions.invoke('handleGooglePlayIAP', {
        purchaseToken: receiptData.purchaseToken,
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

    // If the request was rejected due to an expired session, save the receipt
    // and redirect to login so the user doesn't lose their purchase.
    const status = error?.status ?? error?.response?.status;
    if (status === 401) {
      console.warn('submitReceiptToServer: 401 response — saving receipt and redirecting to login');
      savePendingReceipt(receiptData);
      window.location.href = '/PostPurchaseSignIn';
      return;
    }

    base44.functions.invoke('logError', {
        error_type: 'iap',
        function_name: 'submitReceiptToServer',
        error_message: error.message,
        context: { productId: receiptData.productId, platform: receiptData.platform }
    });
    alert('There was a problem verifying your purchase. Please contact support if the issue persists.');
  }
};

const postNativeMessage = (message, responseType, timeoutMs = 60000) => {
  return new Promise((resolve, reject) => {
    if (!window.ReactNativeWebView) {
      reject(new Error('Native bridge not available'));
      return;
    }

    const previousBus = window.__nativeBus;
    let settled = false;
    let timer = null;

    const wrappedBus = (msg) => {
      if (!settled && msg?.type === responseType) {
        settled = true;
        clearTimeout(timer);
        if (window.__nativeBus === wrappedBus) {
          window.__nativeBus = previousBus;
        }
        resolve(msg);
        return;
      }

      if (typeof previousBus === 'function') {
        previousBus(msg);
      }
    };

    window.__nativeBus = wrappedBus;

    timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (window.__nativeBus === wrappedBus) {
        window.__nativeBus = previousBus;
      }
      reject(new Error('Native request timed out'));
    }, timeoutMs);

    try {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } catch (e) {
      settled = true;
      clearTimeout(timer);
      if (window.__nativeBus === wrappedBus) {
        window.__nativeBus = previousBus;
      }
      reject(e);
    }
  });
};

/**
 * Triggers native Apple Sign In via the RN bridge.
 * Resolves with { success, identityToken, authorizationCode, user, email, fullName }
 */
export const triggerAppleSignIn = () =>
  postNativeMessage({ type: 'APPLE_SIGN_IN' }, 'APPLE_SIGN_IN_RESULT', 60000);

/**
 * Triggers a RevenueCat in-app purchase via the RN bridge.
 * Resolves with { success, productId, platform, customerInfo?, error? }
 */
export const triggerRevenueCatPurchase = (productId) =>
  postNativeMessage({ type: 'PURCHASE', productId }, 'PURCHASE_RESULT', 120000);

/**
 * Restores purchases via RevenueCat through the RN bridge.
 * Resolves with { success, customerInfo?, error? }
 */
export const triggerRestorePurchases = () =>
  postNativeMessage({ type: 'RESTORE_PURCHASES' }, 'RESTORE_RESULT', 30000);

/**
 * Gets current RevenueCat customer info (active entitlements, subscription status).
 * Used to guard against double-purchasing a subscription.
 * Resolves with { success, isActive, activePlan, entitlements, expiryDate, error? }
 */
export const triggerGetCustomerInfo = () =>
  postNativeMessage({ type: 'GET_CUSTOMER_INFO' }, 'CUSTOMER_INFO_RESULT', 30000);

/**
 * Persists purchased credits to the Base44 database.
 * Call this after every successful credit pack purchase.
 * @param {string} appleUserId - The user's Apple ID
 * @param {number} creditsToAdd - Number of credits to add
 * @param {string} productId - The product ID purchased
 */
export const persistCreditsToDB = async (appleUserId, creditsToAdd, productId) => {
  if (!appleUserId) {
    console.warn('[persistCreditsToDB] No appleUserId — credits saved to localStorage only');
    return { success: false, reason: 'no_user_id' };
  }
  try {
    const resp = await fetch('/api/addCredits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appleUserId, creditsToAdd, productId }),
    });
    const data = await resp.json();
    if (data.success) {
      console.log(`[persistCreditsToDB] ✅ ${creditsToAdd} credits saved to DB. Total: ${data.totalCredits}`);
      // Keep localStorage in sync with DB
      localStorage.setItem('swh_search_credits', String(data.totalCredits));
      localStorage.setItem('swh_credits', String(data.totalCredits));
      const user = JSON.parse(localStorage.getItem('swh_user') || '{}');
      user.search_credits = data.totalCredits;
      user.credits = data.totalCredits;
      localStorage.setItem('swh_user', JSON.stringify(user));
    }
    return data;
  } catch (err) {
    console.error('[persistCreditsToDB] Failed:', err.message);
    return { success: false, error: err.message };
  }
};
