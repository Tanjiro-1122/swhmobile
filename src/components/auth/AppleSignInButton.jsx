import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AppleSignInButton({ onSuccess, className = "" }) {
  const [isLoading, setIsLoading] = useState(false);
  const [appleConfig, setAppleConfig] = useState(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    // Load Apple JS SDK
    const loadAppleSDK = () => {
      if (window.AppleID) {
        setSdkLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.onload = () => {
        setSdkLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadAppleSDK();

    // Get Apple client config from backend
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
  }, []);

  useEffect(() => {
    // Initialize Apple Sign In when SDK and config are ready
    if (sdkLoaded && appleConfig && window.AppleID) {
      try {
        window.AppleID.auth.init({
          clientId: appleConfig.clientId,
          scope: 'name email',
          redirectURI: appleConfig.redirectUri || 'https://sportswagerhelper.com/apple-auth-callback',
          usePopup: true
        });
      } catch (error) {
        console.error('Apple Sign In init error:', error);
      }
    }
  }, [sdkLoaded, appleConfig]);

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    console.log("Starting Apple Sign In flow...");

    try {
      // Ensure SDK is loaded
      if (!window.AppleID) {
        console.log("Apple SDK not found, loading script...");
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Apple SDK script'));
            document.head.appendChild(script);
        });
        console.log("Apple SDK loaded manually");
      }

      if (!window.AppleID) {
        throw new Error('Apple SDK could not be loaded. Please disable content blockers and refresh.');
      }

      // Get config if not already loaded
      let currentConfig = appleConfig;
      if (!currentConfig) {
        console.log("Fetching Apple config...");
        const response = await base44.functions.invoke('handleAppleSignIn', {
          action: 'getClientId'
        });
        if (!response.data?.clientId) {
          throw new Error('Could not retrieve Apple configuration.');
        }
        setAppleConfig(response.data);
        currentConfig = response.data;
        console.log("Apple config retrieved");
      }
        
      // Initialize Apple Sign In
      console.log("Initializing Apple Sign In...");
      try {
        // Determine if we should use popup (desktop) or redirect (mobile)
        // Mobile browsers/webviews often block popups or have issues with them
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        window.AppleID.auth.init({
          clientId: currentConfig.clientId,
          scope: 'name email',
          redirectURI: currentConfig.redirectUri || 'https://sportswagerhelper.com/apple-auth-callback',
          usePopup: !isMobile // Use redirect on mobile to avoid popup blocker issues
        });
      } catch (initError) {
          console.warn("Init error (might be already initialized):", initError);
      }

      // Trigger Apple Sign In popup
      console.log("Calling signIn()...");
      const response = await window.AppleID.auth.signIn();
      
      console.log('Apple Sign In response:', response);

      // Exchange the authorization code for tokens
      const verifyResponse = await base44.functions.invoke('handleAppleSignIn', {
        action: 'exchangeCode',
        authorizationCode: response.authorization.code,
        user: response.user // Only available on first sign in
      });

      console.log("Apple backend response:", verifyResponse);

      if (verifyResponse.data?.success) {
        const { appleUser } = verifyResponse.data;

        // Store Apple user info temporarily
        localStorage.setItem('apple_auth_user', JSON.stringify(appleUser));

        // Now redirect to Base44 login with the Apple email pre-filled
        // This creates/links the account in Base44's system
        if (appleUser.email) {
          // Use Base44's magic link flow with the Apple email
          alert(`Apple Sign In successful! Email: ${appleUser.email}\n\nPlease complete sign in with this email.`);
          base44.auth.redirectToLogin(window.location.href);
        }

        if (onSuccess) {
          onSuccess(appleUser);
        }
      } else {
        // Extract error from backend response
        const backendError = verifyResponse.data?.error || 'Verification failed';
        throw new Error(backendError);
      }
      } catch (error) {
      console.error('Apple Sign In error:', error);
      if (error.error !== 'popup_closed_by_user') {
        // Show specific error for debugging
        let errorMessage = error.message || String(error);

        // Try to extract response error if available (for 500s etc)
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }

        alert(`Sign In Error (v6): ${errorMessage}`);
        }
        } finally {
      setIsLoading(false);
    }
  };

  // Always show the button - don't hide it
  const isReady = sdkLoaded && appleConfig;

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
      {isLoading ? 'Signing in...' : 'Continue with Apple'}
    </Button>
  );
}