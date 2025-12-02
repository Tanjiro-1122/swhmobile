import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles, Shield, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";


export default function RequireAuth({ children, pageName = "this feature" }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileApp, setIsMobileApp] = useState(false);

  useEffect(() => {
    // Check if running in a mobile app environment - multiple detection methods
    const checkMobileApp = () => {
      const hasWTN = typeof window.WTN !== 'undefined';
      const ua = navigator.userAgent || '';
      // iOS WebView: has iPhone/iPad but NOT Safari (Safari is stripped in WebViews)
      const isIOSWebView = /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);
      // Android WebView detection
      const isAndroidWebView = /Android/.test(ua) && /wv/.test(ua);
      // Standalone mode (added to home screen)
      const isStandalone = window.navigator.standalone === true;
      
      return hasWTN || isIOSWebView || isAndroidWebView || isStandalone;
    };
    
    setIsMobileApp(checkMobileApp());

    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl(pageName) || createPageUrl("Dashboard"));
  };

  const handleViewPricing = () => {
    window.location.href = createPageUrl("Pricing");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-white font-semibold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If it's a mobile app, do not require authentication at this stage.
  // The individual components or pages will handle free lookups and paywalls.
  if (isMobileApp) {
    return children;
  }

  // For web app, require authentication as usual
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-purple-300 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Lock className="w-10 h-10" />
                </div>
              </div>
              <CardTitle className="text-center text-3xl font-black">
                🔒 Sign In Required
              </CardTitle>
              <p className="text-center text-purple-100 mt-2">
                Create a free account to access {pageName}
              </p>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                  <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-gray-900">5 Free Lookups</div>
                    <div className="text-sm text-gray-600">Try before you buy</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                  <Shield className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-gray-900">Save Your Results</div>
                    <div className="text-sm text-gray-600">Access your analysis anytime</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300">
                  <Crown className="w-6 h-6 text-orange-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-gray-900">Upgrade to Premium</div>
                    <div className="text-sm text-gray-600">Free lookups exhausted</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white text-lg py-6 font-bold shadow-lg"
                >
                  Sign In with Email
                </Button>

                <Button
                  onClick={handleViewPricing}
                  variant="outline"
                  className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 text-base py-5 font-semibold"
                >
                  View Pricing Plans
                </Button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6">
                🔒 Secure authentication • No credit card required for free tier
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return children;
}