import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Generate cryptographically secure nonce
function generateNonce() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export default function AppleSignInButton({ onSuccess, className = "" }) {
  const [isLoading, setIsLoading] = useState(false);
  const [appleConfig, setAppleConfig] = useState(null);
  const [nonce, setNonce] = useState(null);

  useEffect(() => {
    const getConfig = async () => {
        try {
          const response = await base44.functions.invoke('handleAppleSignIn', {
            action: 'getClientId'
          });
          if (response.data?.clientId) {
            setAppleConfig(response.data);
          }
        } catch (error) {
          console.error('Failed to get Apple config:', error);
        }
      };
    getConfig();

    // Listen for callback completion from popup
    const handleStorageChange = (e) => {
      if (e.key === 'apple_provider_id' && e.newValue) {
        console.log('[AppleSignIn] Detected Apple auth completion');
        // The popup has set the data, parent window will redirect
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAppleSignIn = async () => {
    setIsLoading(true);

    // Generate nonce for replay attack prevention
    const generatedNonce = generateNonce();
    setNonce(generatedNonce);

    try {
      // Check if WebToNative's native Apple Sign In is available
      if (typeof window.WTN !== 'undefined' && typeof window.WTN.appleSignIn === 'function') {
        
        window.WTN.appleSignIn({
          callback: async (data) => {
            
            if (data.isSuccess && data.authorizationCode) {
              // Exchange code with our backend
              const verifyResponse = await base44.functions.invoke('handleAppleSignIn', {
                action: 'exchangeCode',
                authorizationCode: data.authorizationCode,
                user: data.user,
                nonce: generatedNonce
              });

              if (!verifyResponse || !verifyResponse.data) throw new Error('No response from server');
              const responseData = verifyResponse.data;

              if (responseData.debug) console.debug('handleAppleSignIn debug:', responseData.debug);

              if (responseData.success) {
                const { appleUser } = responseData;

                // Store Apple provider data for account linking
                localStorage.setItem('apple_provider_id', appleUser.id);
                localStorage.setItem('apple_provider_email', appleUser.email || '');
                localStorage.setItem('apple_is_private_email', appleUser.isPrivateEmail ? 'true' : 'false');

                if (appleUser.email) {
                  try {
                    await navigator.clipboard.writeText(appleUser.email);
                  } catch (e) {
                    console.log('Could not copy email');
                  }
                }

                // Redirect to login with email prefill
                if (appleUser.email && !appleUser.isPrivateEmail) {
                  base44.auth.redirectToLogin(`/MyAccount?activate_iap=true&email=${encodeURIComponent(appleUser.email)}`);
                } else if (onSuccess) {
                  onSuccess(appleUser);
                } else {
                  base44.auth.redirectToLogin('/MyAccount?activate_iap=true');
                }
              } else {
                const errMsg = responseData?.debug?.message || responseData?.error || 'Verification failed';
                console.error('Apple Sign In failed:', errMsg, responseData);
                throw new Error(errMsg);
              }
            } else {
              console.error('Apple Sign In failed:', data.error);
            }
            setIsLoading(false);
          }
        });
        return; // Exit - callback will handle the rest
      }

      // Fallback to web-based popup flow with query mode
      let currentConfig = appleConfig;
      if (!currentConfig) {
        const response = await base44.functions.invoke('handleAppleSignIn', {
          action: 'getClientId'
        });
        if (!response.data?.clientId) {
          throw new Error('Could not retrieve Apple configuration.');
        }
        setAppleConfig(response.data);
        currentConfig = response.data;
      }

      const clientId = currentConfig.clientId;
      const redirectUri = 'https://sportswagerhelper.com/AppleAuthCallback';

      console.log('[AppleSignIn] Using clientId:', clientId);
      console.log('[AppleSignIn] Using redirectUri:', redirectUri);
      console.log('[AppleSignIn] Generated nonce:', generatedNonce);

      // Store nonce for verification after redirect
      sessionStorage.setItem('apple_nonce', generatedNonce);

      // Build authorization URL with response_mode=query for popup flow
      const authUrl = new URL('https://appleid.apple.com/auth/authorize');
      authUrl.searchParams.set('response_type', 'code id_token');
      authUrl.searchParams.set('response_mode', 'query');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'name email');
      authUrl.searchParams.set('state', generatedNonce);
      authUrl.searchParams.set('nonce', generatedNonce);

      console.log('[AppleSignIn] Opening popup with URL:', authUrl.toString());

      // Set up message listener BEFORE opening popup
      const messageHandler = async (event) => {
        console.log('[AppleSignIn] Received postMessage:', event.data, 'from origin:', event.origin);

        // Only accept messages from our own origin
        if (event.origin !== window.location.origin) {
          console.log('[AppleSignIn] Ignoring message from different origin');
          return;
        }

        // Handle callback message with authorization data
        if (event.data?.type === 'apple_auth') {
          console.log('[AppleSignIn] Received Apple auth data from callback');
          window.removeEventListener('message', messageHandler);

          const { code, id_token, state, error } = event.data;

          if (error) {
            console.error('[AppleSignIn] Apple returned error:', error);
            setIsLoading(false);
            return;
          }

          if (!code) {
            console.error('[AppleSignIn] No authorization code received');
            setIsLoading(false);
            return;
          }

          try {
            // Exchange code with backend
            console.log('[AppleSignIn] Exchanging code with backend...');
            const verifyResponse = await base44.functions.invoke('handleAppleSignIn', {
              action: 'exchangeCode',
              authorizationCode: code,
              nonce: generatedNonce
            });

            if (!verifyResponse || !verifyResponse.data) throw new Error('No response from server');
            const responseData = verifyResponse.data;

            if (responseData.debug) console.debug('handleAppleSignIn debug:', responseData.debug);

            if (responseData.success) {
              const { appleUser } = responseData;

              // Store Apple provider data for account linking
              localStorage.setItem('apple_provider_id', appleUser.id);
              localStorage.setItem('apple_provider_email', appleUser.email || '');
              localStorage.setItem('apple_is_private_email', appleUser.isPrivateEmail ? 'true' : 'false');

              if (appleUser.email) {
                try {
                  await navigator.clipboard.writeText(appleUser.email);
                } catch (e) {
                  console.log('Could not copy email');
                }
              }

              // Redirect to login with email prefill
              if (appleUser.email && !appleUser.isPrivateEmail) {
                base44.auth.redirectToLogin(`/MyAccount?activate_iap=true&email=${encodeURIComponent(appleUser.email)}`);
              } else if (onSuccess) {
                onSuccess(appleUser);
              } else {
                base44.auth.redirectToLogin('/MyAccount?activate_iap=true');
              }
            } else {
              const errMsg = responseData?.debug?.message || responseData?.error || 'Verification failed';
              console.error('Apple Sign In failed:', errMsg, responseData);
              throw new Error(errMsg);
            }
          } catch (err) {
            console.error('Error exchanging Apple code:', err);
            setIsLoading(false);
          }
        }
      };
      window.addEventListener('message', messageHandler);

      // Open popup
      const popup = window.open(
        authUrl.toString(),
        'AppleSignIn',
        'width=600,height=700,scrollbars=yes'
      );

      if (!popup) {
        console.error('[AppleSignIn] Popup blocked');
        window.removeEventListener('message', messageHandler);
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      popup.focus();
      console.log('[AppleSignIn] Popup opened successfully');
      } catch (err) {
      console.error('Apple Sign In error:', err);
      console.error('Error details:', err.message, err.stack);
      } finally {
      setIsLoading(false);
      }
      };

  return (
    <Button
      onClick={handleAppleSignIn}
      disabled={isLoading}
      className={`bg-black hover:bg-gray-900 text-white font-semibold flex items-center justify-center gap-2 min-h-[44px] ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      )}
      {isLoading ? 'Signing in...' : 'Apple'}
    </Button>
  );
}