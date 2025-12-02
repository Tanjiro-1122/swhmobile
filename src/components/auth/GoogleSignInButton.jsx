import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function GoogleSignInButton({ className = "" }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Redirect to Base44's login which includes Google option
      // The Base44 platform handles Google OAuth when configured
      base44.auth.redirectToLogin(window.location.href);
    } catch (error) {
      console.error('Google Sign In error:', error);
      setIsLoading(false);
    }
  };

  // Show on Android devices or any device
  const isAndroidDevice = /Android/.test(navigator.userAgent);
  const isAppleDevice = /iPhone|iPad|iPod|Mac/.test(navigator.userAgent);
  
  // Show Google button on Android devices, or on non-Apple devices
  if (isAppleDevice && !isAndroidDevice) {
    return null;
  }

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`bg-white hover:bg-gray-100 text-gray-700 font-semibold flex items-center justify-center gap-2 min-h-[44px] border border-gray-300 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {isLoading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}