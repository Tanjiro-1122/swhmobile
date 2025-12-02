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
        const response = await base44.functions.invoke('appleSignIn', {
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
          redirectURI: window.location.origin + '/apple-auth-callback',
          usePopup: true
        });
      } catch (error) {
        console.error('Apple Sign In init error:', error);
      }
    }
  }, [sdkLoaded, appleConfig]);

  const handleAppleSignIn = async () => {
    if (!sdkLoaded || !appleConfig) {
      alert('Apple Sign In is not ready yet. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Trigger Apple Sign In popup
      const response = await window.AppleID.auth.signIn();
      
      console.log('Apple Sign In response:', response);

      // Exchange the authorization code for tokens
      const verifyResponse = await base44.functions.invoke('appleSignIn', {
        action: 'exchangeCode',
        authorizationCode: response.authorization.code,
        user: response.user // Only available on first sign in
      });

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
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Apple Sign In error:', error);
      if (error.error !== 'popup_closed_by_user') {
        alert('Apple Sign In failed. Please try again or use email sign in.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Only show on iOS devices or when SDK is available
  const isAppleDevice = /iPhone|iPad|iPod|Mac/.test(navigator.userAgent);
  
  if (!isAppleDevice && !sdkLoaded) {
    return null;
  }

  return (
    <Button
      onClick={handleAppleSignIn}
      disabled={isLoading || !sdkLoaded || !appleConfig}
      className={`bg-black hover:bg-gray-900 text-white font-semibold flex items-center justify-center gap-2 min-h-[44px] ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      )}
      {isLoading ? 'Signing in...' : 'Sign in with Apple'}
    </Button>
  );
}