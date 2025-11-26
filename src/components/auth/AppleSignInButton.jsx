import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Apple logo SVG component
const AppleLogo = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

export default function AppleSignInButton({ onSuccess, className = "" }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Get client ID from backend
      const configResponse = await base44.functions.invoke('appleSignIn', {
        action: 'getClientId'
      });
      
      const { clientId } = configResponse.data;
      
      // Check if AppleID JS is loaded
      if (!window.AppleID) {
        // Load Apple JS SDK
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Initialize Apple Sign In
      // Use the exact redirect URI registered in Apple Developer Console
      const redirectURI = 'https://sportswagerhelper.app.base44.com';
      
      window.AppleID.auth.init({
        clientId: clientId,
        scope: 'name email',
        redirectURI: redirectURI,
        usePopup: true
      });

      // Trigger sign in
      const response = await window.AppleID.auth.signIn();
      
      // Verify the token with our backend
      const verifyResponse = await base44.functions.invoke('appleSignIn', {
        action: 'verify',
        identityToken: response.authorization.id_token,
        user: response.user // Only available on first sign in
      });

      if (verifyResponse.data.success) {
        // Apple user verified - now we need to handle the login
        // Since Base44 handles auth, we redirect to login with Apple context
        const appleUser = verifyResponse.data.appleUser;
        
        // Store Apple user info temporarily
        sessionStorage.setItem('apple_signin_user', JSON.stringify({
          email: appleUser.email,
          id: appleUser.id,
          name: verifyResponse.data.userInfo?.name 
            ? `${verifyResponse.data.userInfo.name.firstName || ''} ${verifyResponse.data.userInfo.name.lastName || ''}`.trim()
            : null
        }));

        // Redirect to Base44 login with the Apple email
        if (onSuccess) {
          onSuccess(appleUser);
        } else {
          // Default: redirect to login
          base44.auth.redirectToLogin(window.location.pathname);
        }
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

  return (
    <Button
      onClick={handleAppleSignIn}
      disabled={isLoading}
      className={`bg-black hover:bg-gray-800 text-white font-semibold ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : (
        <AppleLogo className="w-5 h-5 mr-2" />
      )}
      Sign in with Apple
    </Button>
  );
}