import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  Platform,
  ActivityIndicator,
  Pressable,
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import PurchaseModal from './PurchaseModal';
import { purchaseProduct, restorePurchases, checkEntitlement, loginUser } from './RevenueCatService';

const APP_URL = 'https://sportswagerhelper.com';

// Guard against duplicate Apple Sign In requests
let appleSignInInProgress = false;

export default function WebViewScreen({ navigation }) {
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Holds the in-flight Purchases.logIn() so a purchase or restore arriving
  // right behind SAVE_SESSION waits for the account link to land first.
  const loginPromiseRef = useRef(null);

  /**
   * Waits for any pending account link. Never throws and never blocks forever:
   * a RevenueCat outage must not make the buy button unresponsive, so this
   * gives up after a few seconds and lets the purchase proceed. Worst case is
   * the pre-existing behaviour -- an anonymous purchase the webhook logs but
   * cannot attribute -- rather than a purchase the user cannot make at all.
   */
  const settleLogin = useCallback(async () => {
    if (!loginPromiseRef.current) return;
    try {
      await Promise.race([
        loginPromiseRef.current,
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
    } catch {
      // loginUser already logs; a failed link must not block the purchase.
    }
  }, []);

  const bridgeMetadata = useMemo(() => {
    const config = Constants.expoConfig ?? {};
    const version = config.version ?? Constants.nativeAppVersion ?? null;
    const iosBuildNumber = config.ios?.buildNumber ?? null;
    const androidVersionCode = config.android?.versionCode?.toString?.() ?? null;
    const buildNumber = Platform.OS === 'ios'
      ? (iosBuildNumber ?? Constants.nativeBuildVersion ?? null)
      : (androidVersionCode ?? Constants.nativeBuildVersion ?? null);

    return {
      platform: Platform.OS,
      appVersion: version,
      buildNumber,
    };
  }, []);

  const injectedJs = useMemo(() => {
    const metadataJson = JSON.stringify(bridgeMetadata);

    return `
      (function() {
        if (window.__rnBridgeInjected) return true;
        window.__rnBridgeInjected = true;

        // Set up __nativeBus so postNativeMessage can register listeners
        if (!window.__nativeBus) { window.__nativeBus = function(msg) {}; }

        var metadata = ${metadataJson};
        window.__SWH_NATIVE__ = true;
        window.__SWH_NATIVE_META__ = metadata;

        var storageKey = '__swh_device_id';
        var deviceId = null;

        try {
          if (window.localStorage) {
            deviceId = window.localStorage.getItem(storageKey);
          }
        } catch (_error) { console.warn('[SWH] localStorage read failed:', _error); }

        if (!deviceId) {
          var randomPart = '';
          if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            var bytes = new Uint8Array(12);
            window.crypto.getRandomValues(bytes);
            randomPart = Array.from(bytes).map(function(byte) {
              return byte.toString(16).padStart(2, '0');
            }).join('');
          } else {
            randomPart = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
          }
          deviceId = 'swh-' + metadata.platform + '-' + randomPart;
          try {
            if (window.localStorage) {
              window.localStorage.setItem(storageKey, deviceId);
            }
          } catch (_error) { console.warn('[SWH] localStorage write failed:', _error); }
        }

        window.__SWH_DEVICE_ID__ = deviceId;
        window.__SWH_NATIVE_META__.deviceId = deviceId;

        window.NativePurchase = {
          buyCredits: function(productId) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PURCHASE',
              productId: productId
            }));
          },
          restore: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'RESTORE' }));
          },
          checkEntitlement: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CHECK_ENTITLEMENT' }));
          }
        };

        document.dispatchEvent(new CustomEvent('NativeBridgeReady', { detail: window.__SWH_NATIVE_META__ }));
        return true;
      })();
    `;
  }, [bridgeMetadata]);

  const closeFallback = useCallback(() => {
    navigation?.navigate?.('NativeTabs', { screen: 'Home' });
  }, [navigation]);

  // Android hardware back button exits the native fallback instead of trapping
  // users inside website history.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeFallback();
      return true;
    });
    return () => subscription.remove();
  }, [closeFallback]);

  /** Send a JSON payload back to the WebView via __nativeBus */
  const postMessageToWeb = useCallback((payload) => {
    if (!webViewRef.current) return;
    const js = `
      (function() {
        if (typeof window.__nativeBus === 'function') {
          try { window.__nativeBus(${JSON.stringify(payload)}); } catch (_e) { console.error('[SWH] __nativeBus dispatch failed:', _e && _e.message); }
        }
        var event = new CustomEvent('NativePurchaseResult', { detail: ${JSON.stringify(payload)} });
        document.dispatchEvent(event);
        if (typeof window.onNativePurchaseResult === 'function') {
          window.onNativePurchaseResult(${JSON.stringify(payload)});
        }
        true;
      })();
    `;
    webViewRef.current.injectJavaScript(js);
  }, []);

  /** Handle Apple Sign In natively */
  const handleNativeAppleSignIn = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      postMessageToWeb({
        type: 'APPLE_SIGN_IN_RESULT',
        success: false,
        error: 'Apple Sign-In is only available on iPhone and iPad. Use email sign-in on Android.',
      });
      return;
    }

    if (appleSignInInProgress) {
      console.log('[SWH] Apple sign-in already in progress, ignoring duplicate');
      return;
    }
    appleSignInInProgress = true;

    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        postMessageToWeb({ type: 'APPLE_SIGN_IN_RESULT', success: false, error: 'Apple Sign-In not available on this device' });
        return;
      }

      // Generate a secure nonce
      const rawNonce = Array.from(
        await Crypto.getRandomBytesAsync(32),
        (b) => b.toString(16).padStart(2, '0')
      ).join('');
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      // Build fullName string
      let fullNameStr = null;
      if (credential.fullName) {
        const parts = [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean);
        fullNameStr = parts.join(' ') || null;
      }

      postMessageToWeb({
        type: 'APPLE_SIGN_IN_RESULT',
        success: true,
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        user: credential.user,
        email: credential.email || null,
        fullName: fullNameStr,
        nonce: rawNonce,
      });
    } catch (err) {
      if (err.code === 'ERR_REQUEST_CANCELED' || err.code === 'ERR_CANCELED') {
        postMessageToWeb({ type: 'APPLE_SIGN_IN_RESULT', success: false, error: 'user_cancelled' });
      } else {
        console.error('[SWH] Apple Sign In error:', err);
        postMessageToWeb({ type: 'APPLE_SIGN_IN_RESULT', success: false, error: err.message || 'Sign in failed' });
      }
    } finally {
      appleSignInInProgress = false;
    }
  }, [postMessageToWeb]);

  /** Handle messages posted from the WebView */
  const handleMessage = useCallback(
    async (event) => {
      let data;
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        console.warn('[WebViewScreen] Received non-JSON message:', event.nativeEvent.data);
        return;
      }

      const { type, productId } = data;

      switch (type) {
        case 'APPLE_SIGN_IN': {
          await handleNativeAppleSignIn();
          break;
        }

        case 'PURCHASE': {
          // Wait for any in-flight account link before touching StoreKit, so the
          // receipt is attributed to the real user rather than an anonymous id.
          await settleLogin();
          if (productId) {
            // Known product requested by the web layer — purchase it directly.
            // No picker screen. Always resolves PURCHASE_RESULT immediately
            // (success, user-cancelled, or a real error) instead of leaving
            // the web side's postNativeMessage promise to time out after 120s.
            try {
              const result = await purchaseProduct(productId);
              if (result.cancelled) {
                postMessageToWeb({ type: 'PURCHASE_RESULT', success: false, productId, error: 'user_cancelled' });
              } else {
                postMessageToWeb({ type: 'PURCHASE_RESULT', success: true, productId, customerInfo: result.customerInfo });
              }
            } catch (err) {
              postMessageToWeb({
                type: 'PURCHASE_RESULT',
                success: false,
                productId,
                error: err?.message || 'Purchase failed. Please try again.',
              });
            }
          } else {
            // No productId supplied — fall back to the manual picker modal.
            setSelectedProductId(null);
            setPurchaseModalVisible(true);
          }
          break;
        }

        case 'RESTORE':
        case 'RESTORE_PURCHASES': {
          await settleLogin();
          try {
            const result = await restorePurchases();
            postMessageToWeb({ type: 'RESTORE_RESULT', success: true, customerInfo: result.customerInfo });
          } catch (err) {
            postMessageToWeb({ type: 'RESTORE_RESULT', success: false, error: err.message });
          }
          break;
        }

        case 'CHECK_ENTITLEMENT': {
          const isActive = await checkEntitlement();
          postMessageToWeb({ type: 'ENTITLEMENT_RESULT', isActive });
          break;
        }

        case 'SAVE_SESSION': {
          // Sent by the web layer immediately before a purchase or restore, and
          // after Apple Sign-In, to link RevenueCat's appUserId to the account.
          //
          // The promise is kept so PURCHASE/RESTORE can wait on it. onMessage
          // does not serialise handlers: the web side fires SAVE_SESSION and
          // PURCHASE back to back, so without this the purchase could reach
          // StoreKit while logIn() -- a network round-trip to RevenueCat -- was
          // still in flight, and the receipt would be attributed to the
          // anonymous id.
          const { userId } = data;
          if (userId) {
            loginPromiseRef.current = loginUser(userId)
              .then((info) => {
                console.log('[WebViewScreen] RevenueCat logged in with userId:', userId);
                return info;
              })
              .catch((err) => {
                console.warn('[WebViewScreen] SAVE_SESSION loginUser error:', err?.message);
              });
            await loginPromiseRef.current;
          }
          break;
        }

        default:
          console.log('[WebViewScreen] Unknown message type:', type);
      }
    },
    [postMessageToWeb, handleNativeAppleSignIn, settleLogin],
  );

  const handlePurchaseComplete = useCallback(
    (result) => {
      postMessageToWeb({ type: 'PURCHASE_RESULT', ...result });
    },
    [postMessageToWeb],
  );

  const handleLoadProgress = ({ nativeEvent }) => {
    setLoadProgress(nativeEvent.progress);
    if (nativeEvent.progress >= 1) setIsLoading(false);
  };

  const handleLoadEnd = () => setIsLoading(false);
  const handleError = () => { setHasError(true); setIsLoading(false); };
  const handleReload = () => { setHasError(false); setIsLoading(true); webViewRef.current?.reload(); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nativeHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close Advanced Research"
          onPress={closeFallback}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Advanced Research</Text>
          <Text style={styles.headerSubtitle}>SportsWagerHelper.com</Text>
        </View>
      </View>

      {isLoading && loadProgress > 0 && loadProgress < 1 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${loadProgress * 100}%` }]} />
        </View>
      )}

      {isLoading && loadProgress === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1e3a5f" />
          <Text style={styles.loadingText}>Loading Sports Wager Helper…</Text>
        </View>
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorMessage}>Please check your internet connection and try again.</Text>
          <Text style={styles.retryButton} onPress={handleReload}>Tap to Retry</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={injectedJs}
        onMessage={handleMessage}
        onLoadProgress={handleLoadProgress}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
        cacheEnabled
        cacheMode="LOAD_DEFAULT"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        sharedCookiesEnabled={Platform.OS === 'ios'}
        thirdPartyCookiesEnabled
        pullToRefreshEnabled
      />

      <PurchaseModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        initialProductId={selectedProductId}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e3a5f' },
  webview: { flex: 1 },
  nativeHeader: {
    alignItems: 'center',
    backgroundColor: '#07111f',
    borderBottomColor: 'rgba(148, 163, 184, 0.22)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 14,
    zIndex: 20,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#132235',
    borderColor: 'rgba(148, 163, 184, 0.35)',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  headerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#e2e8f0',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressBar: { height: '100%', backgroundColor: '#3b82f6' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: { color: '#ffffff', marginTop: 12, fontSize: 16 },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 5,
  },
  errorTitle: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  errorMessage: { color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  retryButton: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
});
