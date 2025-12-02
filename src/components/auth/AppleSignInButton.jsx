import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Copy, ArrowRight, ShieldCheck, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AppleSignInButton({ onSuccess, className = "" }) {
  const [isLoading, setIsLoading] = useState(false);
  const [appleConfig, setAppleConfig] = useState(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [copied, setCopied] = useState(false);

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
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Apple SDK script'));
            document.head.appendChild(script);
        });
      }

      if (!window.AppleID) {
        throw new Error('Apple SDK could not be loaded.');
      }

      // Get config if not already loaded
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
        
      // Construct redirect URI dynamically to match current domain
      // Apple requires this to match exactly what is registered in the developer portal
      // Using window.location.origin is safer than hardcoding for dev/preview environments
      const redirectURI = currentConfig.redirectUri || `${window.location.origin}/`;

      // Initialize Apple Sign In
      try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        window.AppleID.auth.init({
          clientId: currentConfig.clientId,
          scope: 'name email',
          redirectURI: redirectURI,
          usePopup: !isMobile 
        });
      } catch (initError) {
          console.warn("Init error:", initError);
      }

      // Trigger Apple Sign In popup
      const response = await window.AppleID.auth.signIn();
      
      // Exchange the authorization code for tokens
      const verifyResponse = await base44.functions.invoke('handleAppleSignIn', {
        action: 'exchangeCode',
        authorizationCode: response.authorization.code,
        user: response.user,
        redirectUri: redirectURI // Send the same URI used for init
      });

      if (verifyResponse.data?.success) {
        const { appleUser } = verifyResponse.data;

        // Store Apple user info temporarily
        localStorage.setItem('apple_auth_user', JSON.stringify(appleUser));

        // Show success modal instead of alerting
        if (appleUser.email) {
           setVerifiedEmail(appleUser.email);
           setShowSuccessModal(true);
           
           // Auto-copy to clipboard for convenience
           try {
              navigator.clipboard.writeText(appleUser.email);
              setCopied(true);
           } catch (e) {
              // Ignore clipboard errors
           }
        } else {
           // If no email, just redirect
           base44.auth.redirectToLogin(window.location.href);
        }

        if (onSuccess) {
          onSuccess(appleUser);
        }
      } else {
        const backendError = verifyResponse.data?.error || 'Verification failed';
        throw new Error(backendError);
      }
    } catch (error) {
      console.error('Apple Sign In error:', error);
      if (error.error !== 'popup_closed_by_user') {
        let errorMessage = error.message || String(error);
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
        // Keep alert only for actual errors
        alert(`Sign In Error: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
      base44.auth.redirectToLogin(window.location.href);
  };

  const copyEmail = () => {
      navigator.clipboard.writeText(verifiedEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // Always show the button
  return (
    <>
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

      {showSuccessModal && createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                >
                    <div className="bg-green-50 p-6 text-center border-b border-green-100">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ShieldCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-green-800">Apple Verified!</h3>
                        <p className="text-green-600 text-sm mt-1">Your identity has been confirmed.</p>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600 font-medium">
                                <strong>Action Required:</strong> We've copied your Apple email. Please <strong>paste it</strong> on the next screen to log in.
                            </p>
                            <div 
                                onClick={copyEmail}
                                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors group"
                            >
                                <code className="text-sm font-mono text-gray-800 break-all select-all">{verifiedEmail}</code>
                                <div className="pl-3 text-gray-400 group-hover:text-blue-500">
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 text-center">
                                {copied ? "✓ Email copied to clipboard" : "Tap box to copy email again"}
                            </p>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg flex gap-2 items-start">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700">
                                <strong>Note:</strong> Apple does not share your password. If this is your first time, create a new password on the next screen. If you're returning, enter your existing password.
                            </p>
                        </div>

                        <Button 
                            onClick={handleContinue}
                            className="w-full bg-black hover:bg-gray-800 text-white h-12 text-lg font-semibold"
                        >
                            Continue to Login Screen <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}