import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// ⚠️ Public SDK keys — safe to be in client code (not secret keys)
// iOS key from RevenueCat dashboard → Projects → Sports Wager Helper → Apps → iOS
// REPLACE 'appl_gCTrteiTHnaclzveBxPzKFKEbrC' with your actual appl_xxxxxxxxx key
const REVENUECAT_API_KEY_IOS = 'appl_gCTrteiTHnaclzveBxPzKFKEbrC';
const REVENUECAT_API_KEY_ANDROID = 'goog_FZSBeUnrDQyPWQloQGdlxAOLRYE';

export const ENTITLEMENT_ID = 'entl5ad30a0ac8';

export const PRODUCT_IDS = [
  'com.sportswagerhelper.credits.25',
  'com.sportswagerhelper.credits.60',
  'com.sportswagerhelper.credits.100',
];

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
 */
export const getProducts = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }

    // Fallback: fetch products directly by ID
    const products = await Purchases.getProducts(
      PRODUCT_IDS,
      Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    );
    return products.map((product) => ({
      product,
      identifier: product.productIdentifier,
    }));
  } catch (error) {
    console.error('[RevenueCat] getProducts error:', error);
    return [];
  }
};

/**
 * Trigger a native purchase flow for the given product ID.
 * @param {string} productId - The product identifier (e.g. 'com.sportswagerhelper.credits.25')
 * @returns {object} purchaserInfo on success
 */
export const purchaseProduct = async (productId) => {
  // ── Diagnostics: log exactly what the web layer asked us to purchase ──
  console.log('[RevenueCat] Purchase requested — productId from web:', productId);

  // ── Diagnostics only ─ read-only, does not affect the purchase call
  // below or which productId gets sent to StoreKit/Play. If this throws
  // for any reason, we log and fall through to the real purchase attempt.
  try {
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;
    const packageIds = currentOffering?.availablePackages?.map((p) => p.identifier) ?? [];
    const productIds = currentOffering?.availablePackages?.map((p) => p.product.identifier) ?? [];
    console.log('[RevenueCat] Offerings — current offering id:', currentOffering?.identifier ?? 'none');
    console.log('[RevenueCat] Offerings — available package ids:', packageIds);
    console.log('[RevenueCat] Offerings — available product ids:', productIds);
    if (!productIds.includes(productId)) {
      console.warn("[RevenueCat] Requested productId is NOT in the current offering's products:", productId);
    }
  } catch (offeringsErr) {
    console.warn(
      '[RevenueCat] getOfferings() diagnostic call failed — code:', offeringsErr?.code,
      '| message:', offeringsErr?.message ?? offeringsErr,
    );
  }

  try {
    const products = await Purchases.getProducts(
      [productId],
      Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    );
    if (!products || products.length === 0) {
      throw new Error(`Product not found: ${productId}`);
    }

    const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
    console.log('[RevenueCat] Purchase successful:', customerInfo);
    return { success: true, customerInfo };
  } catch (error) {
    if (error.userCancelled) {
      console.log('[RevenueCat] Purchase cancelled by user');
      return { success: false, cancelled: true };
    }

    // ── Diagnostics: surface the REAL RevenueCat/StoreKit/Play error ─────
    // (error.userInfo.underlyingErrorMessage is where the actual App Store
    // Connect / Play error text usually lands — e.g. "product not found",
    // "cannot connect to store", agreement/tax issues. Falls back to
    // error.message if nothing more specific exists.)
    const errorCode = error?.code ?? error?.userInfo?.code ?? 'unknown_code';
    const underlyingMessage = error?.userInfo?.underlyingErrorMessage ?? error?.underlyingErrorMessage ?? null;
    const realErrorMessage = error?.message ?? 'Unknown purchase error';
    console.error(
      '[RevenueCat] Purchase error — code:', errorCode,
      '| message:', realErrorMessage,
      '| underlying:', underlyingMessage,
      '| productId:', productId,
    );

    const enrichedError = new Error(
      underlyingMessage ? `${realErrorMessage} (${underlyingMessage})` : realErrorMessage
    );
    enrichedError.code = errorCode;
    enrichedError.userCancelled = false;
    throw enrichedError;
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
    console.error('[RevenueCat] Restore error:', error);
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

export const logoutUser = async () => {
  try {
    const customerInfo = await Purchases.logOut();
    console.log('[RevenueCat] Logged out current user');
    return customerInfo;
  } catch (error) {
    console.warn('[RevenueCat] logOut error:', error?.message || error);
    return null;
  }
};
