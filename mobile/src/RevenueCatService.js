import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// ⚠️ Public SDK keys — safe to be in client code (not secret keys)
// iOS key from RevenueCat dashboard → Projects → Sports Wager Helper → Apps → iOS
// REPLACE 'appl_gCTrteiTHnaclzveBxPzKFKEbrC' with your actual appl_xxxxxxxxx key
const REVENUECAT_API_KEY_IOS = 'appl_gCTrteiTHnaclzveBxPzKFKEbrC';
const REVENUECAT_API_KEY_ANDROID = 'goog_FZSBeUnrDQyPWQloQGdlxAOLRYE';

// Configured bundle IDs — sourced from mobile/app.json build config. Static,
// not a native runtime read (no new dependency added for this diagnostics
// pass) — but this is exactly what should match the RevenueCat dashboard's
// "Bundle ID" field per platform, which is what we're diagnosing.
const BUNDLE_ID_IOS = 'com.SportsWagerHelper.app';
const BUNDLE_ID_ANDROID = 'com.wnapp.id1761803023263';

export const ENTITLEMENT_ID = 'entl5ad30a0ac8';

export const PRODUCT_IDS = [
  'com.sportswagerhelper.credits.25',
  'com.sportswagerhelper.credits.60',
  'com.sportswagerhelper.credits.100',
];

// ---------------------------------------------------------------------------
// Diagnostics helpers — NEVER log or return full secret/API keys.
// ---------------------------------------------------------------------------

/** Prefix+suffix only — e.g. "appl_gCT…KEbrC". Never the full key. */
function safeKeyPrefix(key) {
  if (!key || typeof key !== 'string') return null;
  if (key.length <= 12) return '[redacted]';
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

/**
 * Pulls the safe, useful fields out of a RevenueCat/StoreKit purchase error.
 * Never includes secrets — error objects from react-native-purchases don't
 * carry any, but this keeps the extraction centralized and explicit.
 */
export function extractPurchaseErrorDetails(error) {
  return {
    code: error?.code ?? error?.userInfo?.readableErrorCode ?? null,
    message: error?.message ?? String(error) ?? null,
    underlyingStoreKitError:
      error?.underlyingErrorMessage ?? error?.userInfo?.underlyingErrorMessage ?? null,
    userCancelled: !!error?.userCancelled,
  };
}

/**
 * Initialize RevenueCat with the correct platform API key.
 * Call this once at app startup.
 */
export const initializePurchases = async () => {
  try {
    const apiKey =
      Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

    if (!apiKey || apiKey.startsWith('PASTE_')) {
      console.error('[RevenueCat] ⚠️ API key not set! Open RevenueCatService.js and replace PASTE_IOS_KEY_HERE with your appl_xxx key from RevenueCat dashboard.');
      return; // Don't crash — just skip init
    }

    await Purchases.configure({ apiKey });
    console.log('[RevenueCat] Initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    throw error;
  }
};

/**
 * Fetch available products (credit packs) from RevenueCat.
 * Returns an array of StoreProduct objects, or an empty array on failure.
 * Logs safe diagnostics along the way so a "no products" or "purchase failed"
 * report can be traced back to exactly which step came back empty.
 */
export const getProducts = async () => {
  const platform = Platform.OS;
  try {
    const offerings = await Purchases.getOfferings();
    const offeringIdentifier = offerings?.current?.identifier ?? null;
    const availablePackages = offerings?.current?.availablePackages ?? [];
    console.log('[RevenueCat][diagnostics] getProducts:', {
      platform,
      offeringIdentifier,
      availablePackageCount: availablePackages.length,
      availablePackageProductIds: availablePackages.map((pkg) => pkg.product?.productIdentifier ?? null),
    });

    if (offerings.current !== null && availablePackages.length > 0) {
      return availablePackages;
    }

    // Fallback: fetch products directly by ID
    const products = await Purchases.getProducts(PRODUCT_IDS);
    console.log('[RevenueCat][diagnostics] getProducts fallback Purchases.getProducts():', {
      productIdsExpected: PRODUCT_IDS,
      productIdsReturned: (products || []).map((p) => p.productIdentifier),
    });
    return products.map((product) => ({
      product,
      identifier: product.productIdentifier,
    }));
  } catch (error) {
    const details = extractPurchaseErrorDetails(error);
    console.error('[RevenueCat] getProducts error:', details);
    return [];
  }
};

/**
 * On-demand diagnostic snapshot — safe to call any time (e.g. right before
 * showing the purchase modal, or when a load/purchase fails). Never returns
 * secrets: the API key is truncated to a prefix/suffix, never shown in full.
 *
 * Returns:
 *   platform, productIdsExpected, offeringsLoaded, offeringIdentifier,
 *   availablePackages, storeProducts, appUserID, originalAppUserId
 */
export const getRevenueCatDiagnostics = async () => {
  const platform = Platform.OS;
  const bundleId = platform === 'ios' ? BUNDLE_ID_IOS : BUNDLE_ID_ANDROID;
  const apiKey = platform === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  const revenueCatKeyPrefix = safeKeyPrefix(apiKey);

  let configured = 'unknown';
  try {
    configured = await Purchases.isConfigured();
  } catch (_e) {
    configured = 'unknown';
  }

  let offeringsLoaded = false;
  let offeringIdentifier = null;
  let availablePackages = [];
  try {
    const offerings = await Purchases.getOfferings();
    offeringsLoaded = true;
    offeringIdentifier = offerings?.current?.identifier ?? null;
    availablePackages = (offerings?.current?.availablePackages ?? []).map((pkg) => ({
      packageIdentifier: pkg.identifier,
      productId: pkg.product?.productIdentifier ?? null,
    }));
  } catch (error) {
    console.error('[RevenueCat][diagnostics] getOfferings failed:', extractPurchaseErrorDetails(error));
  }

  let storeProducts = [];
  try {
    const products = await Purchases.getProducts(PRODUCT_IDS);
    storeProducts = (products || []).map((p) => p.productIdentifier);
  } catch (error) {
    console.error('[RevenueCat][diagnostics] getProducts failed:', extractPurchaseErrorDetails(error));
  }

  let appUserID = null;
  let originalAppUserId = null;
  try {
    appUserID = await Purchases.getAppUserID();
  } catch (_e) {
    appUserID = null;
  }
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    originalAppUserId = customerInfo?.originalAppUserId ?? null;
  } catch (_e) {
    originalAppUserId = null;
  }

  const diagnostics = {
    platform,
    bundleId,
    revenueCatKeyPrefix,
    configured,
    productIdsExpected: PRODUCT_IDS,
    offeringsLoaded,
    offeringIdentifier,
    availablePackages,
    storeProducts,
    appUserID,
    originalAppUserId,
  };

  console.log('[RevenueCat][diagnostics] snapshot:', diagnostics);
  return diagnostics;
};

/**
 * Trigger a native purchase flow for the given product ID.
 * @param {string} productId - The product identifier (e.g. 'com.sportswagerhelper.credits.25')
 * @returns {object} purchaserInfo on success
 */
export const purchaseProduct = async (productId) => {
  try {
    const products = await Purchases.getProducts([productId]);
    console.log('[RevenueCat][diagnostics] purchaseProduct getProducts:', {
      productId,
      productIdsReturned: (products || []).map((p) => p.productIdentifier),
    });
    if (!products || products.length === 0) {
      throw new Error(`Product not found: ${productId}`);
    }

    const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
    console.log('[RevenueCat] Purchase successful:', productId, customerInfo);
    return { success: true, customerInfo };
  } catch (error) {
    const details = extractPurchaseErrorDetails(error);
    if (details.userCancelled) {
      console.log('[RevenueCat] Purchase cancelled by user:', productId);
      return { success: false, cancelled: true };
    }
    console.error('[RevenueCat] Purchase error:', { productId, ...details });
    // Attach the extracted safe details to the thrown error so callers
    // (PurchaseModal) can show the exact code/message without needing to
    // know react-native-purchases' internal error shape themselves.
    error.rcCode = details.code;
    error.rcMessage = details.message;
    error.rcUnderlyingStoreKitError = details.underlyingStoreKitError;
    throw error;
  }
};

/**
 * Restore previous purchases for the current user.
 * @returns {object} customerInfo with restored entitlements
 */
export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('[RevenueCat] Restore successful:', customerInfo);
    return { success: true, customerInfo };
  } catch (error) {
    console.error('[RevenueCat] Restore error:', extractPurchaseErrorDetails(error));
    throw error;
  }
};

/**
 * Check if the user currently has the premium entitlement.
 * @returns {boolean} true if entitlement is active
 */
export const checkEntitlement = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    const isActive = entitlement !== undefined;
    console.log('[RevenueCat] Entitlement active:', isActive);
    return isActive;
  } catch (error) {
    console.error('[RevenueCat] checkEntitlement error:', error);
    return false;
  }
};


/**
 * Log in a user to RevenueCat with their Base44 entity ID.
 * This links purchases to their account across devices.
 * @param {string} userId - The Base44 user ID
 */
export const loginUser = async (userId) => {
  if (!userId) return;
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('[RevenueCat] Logged in user:', userId, customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] logIn error:', error);
  }
};
