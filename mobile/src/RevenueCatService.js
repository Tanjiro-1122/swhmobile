import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const REVENUECAT_API_KEY_IOS = process.env.REVENUECAT_API_KEY_IOS || '';
const REVENUECAT_API_KEY_ANDROID = process.env.REVENUECAT_API_KEY_ANDROID || '';

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

    if (!apiKey) {
      console.warn('[RevenueCat] API key is not set. Check REVENUECAT_API_KEY_IOS / REVENUECAT_API_KEY_ANDROID environment variables.');
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
    const products = await Purchases.getProducts(PRODUCT_IDS);
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
  try {
    const products = await Purchases.getProducts([productId]);
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
    console.error('[RevenueCat] Purchase error:', error);
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
