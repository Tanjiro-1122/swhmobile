import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import PurchaseModal from './PurchaseModal';
import { restorePurchases, checkEntitlement, loginUser } from './RevenueCatService';

const APP_URL = 'https://sports-wager-helper.vercel.app';

// Guard against duplicate Apple Sign In requests
let appleSignInInProgress = false;

export default function WebViewScreen() {
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

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
        } catch (_error) {}

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
          } catch (_error) {}
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

  // Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  /** Send a JSON payload back to the WebView via __nativeBus */
  const postMessageToWeb = useCallback((payload) => {
    if (!webViewRef.current) return;
    const js = `
      (function() {
        if (typeof window.__nativeBus === 'function') {
          try { window.__nativeBus(${JSON.stringify(payload)}); } catch (_e) {}
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
          setSelectedProductId(productId ?? null);
          setPurchaseModalVisible(true);
          break;
        }

        case 'RESTORE':
        case 'RESTORE_PURCHASES': {
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
          // Called after Apple Sign-In succeeds — log in to RevenueCat with Base44 user ID
          try {
            const { userId } = data;
            if (userId) {
              await loginUser(userId);
              console.log('[WebViewScreen] RevenueCat logged in with userId:', userId);
            }
          } catch (err) {
            console.warn('[WebViewScreen] SAVE_SESSION loginUser error:', err.message);
          }
          break;
        }

        default:
          console.log('[WebViewScreen] Unknown message type:', type);
      }
    },
    [postMessageToWeb, handleNativeAppleSignIn],
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
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
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
