import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
        Home,
        LogOut,
        Crown,
        Mail
      } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DomainChangeBanner from "../DomainChangeBanner";
import AgeGate from "../auth/AgeGate";

export default function MobileLayout({ children, currentPageName }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const { isIOS, isAndroid } = detectPlatform();
    base44.auth.isAuthenticated().then(setIsAuthenticated);

    // Preload critical resources
    const preloadLink = document.createElement('link');
  preloadLink.rel = 'preconnect';
  preloadLink.href = isIOS
    ? 'https://apple-cdn-link.com' 
    : isAndroid
    ? 'https://google-cdn-link.com'
    : '';
  if (preloadLink.href) {
    document.head.appendChild(preloadLink);
  }

    const criticalPreloadLink = document.createElement('link');
    preloadLink.rel = 'preconnect';
    criticalPreloadLink.href = 'https://qtrypzzcjebvfcihiynt.supabase.co';
    criticalPreloadLink.crossOrigin = 'anonymous';
    document.head.appendChild(preloadLink);

    // Enhanced viewport for iOS/iPadOS
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(meta);
    }

    // Apple-specific meta tags
    const appleCapable = document.createElement('meta');
    appleCapable.name = 'apple-mobile-web-app-capable';
    appleCapable.content = 'yes';
    document.head.appendChild(appleCapable);

    const appleStatus = document.createElement('meta');
    appleStatus.name = 'apple-mobile-web-app-status-bar-style';
    appleStatus.content = 'black-translucent';
    document.head.appendChild(appleStatus);

    // Dark mode detection and theme color
    const updateThemeColor = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) {
        themeColor.content = isDark ? '#0f172a' : '#1e293b';
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = isDark ? '#0f172a' : '#1e293b';
        document.head.appendChild(meta);
      }
      document.documentElement.classList.toggle('dark', isDark);
    };

    updateThemeColor();
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', updateThemeColor);

    const jqueryScript = document.createElement("script");
    jqueryScript.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js";
    jqueryScript.async = true;
    document.head.appendChild(jqueryScript);

    const firebaseScript = document.createElement("script");
    firebaseScript.src = "https://www.gstatic.com/firebasejs/7.11.0/firebase.js";
    firebaseScript.async = true;
    document.head.appendChild(firebaseScript);

    const web2appScript = document.createElement("script");
    web2appScript.src = "https://web2application.com/w2a/webapps/36296/web2app1.js";
    web2appScript.async = true;
    document.head.appendChild(web2appScript);

    const webToNativeScript = document.createElement("script");
    webToNativeScript.src = "https://unpkg.com/webtonative@1.0.81/webtonative.min.js";
    webToNativeScript.async = true;
    document.head.appendChild(webToNativeScript);

    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = "/manifest.json";
    document.head.appendChild(manifestLink);

    return () => {
      if (preloadLink.href) document.head.removeChild(preloadLink);
      document.head.removeChild(criticalPreloadLink);
      document.head.removeChild(jqueryScript);
      document.head.removeChild(firebaseScript);
      document.head.removeChild(web2appScript);
      document.head.removeChild(webToNativeScript);
      document.head.removeChild(manifestLink);
      document.head.removeChild(appleCapable);
      document.head.removeChild(appleStatus);
      darkModeQuery.removeEventListener('change', updateThemeColor);
    };
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });



  const isLegacy = currentUser?.subscription_type === 'legacy';
  const isVIP = currentUser?.subscription_type === 'vip_annual';
  const isPremium = currentUser?.subscription_type === 'premium_monthly';

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await base44.auth.logout();
      setIsAuthenticated(false);
      window.location.href = createPageUrl("Dashboard");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
      window.location.href = createPageUrl("Dashboard");
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  // Stadium background component for consistent styling
  const StadiumBackground = () => (
    <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Subtle gradient orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
    </div>
  );

  // The Dashboard page now handles its own mobile layout, so we can just render it.
  if (currentPageName === "Dashboard") {
    return children;
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <StadiumBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <DomainChangeBanner />
        <AgeGate />

        {/* Fixed Header - 56px height, respects iOS safe area */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                  alt="SWH Logo"
                  className="w-10 h-10 rounded-lg object-cover"
                  loading="eager"
                  decoding="async"
                />
                <span className="hidden sm:inline text-lg font-bold text-white">
                  Sports Wager Helper
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {currentUser && isLegacy && (
                    <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1.5 rounded-full">
                      <Crown className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold text-white">LEGACY</span>
                    </div>
                  )}
                  {currentUser && isVIP && (
                    <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1.5 rounded-full">
                      <Crown className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold text-white">VIP</span>
                    </div>
                  )}
                  {currentUser && isPremium && (
                    <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 rounded-full">
                      <Crown className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold text-white">PREMIUM</span>
                    </div>
                  )}
                  {currentUser && (
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                        {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 min-w-[44px] min-h-[44px]"
                    title="Log out"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <Button
                                        onClick={handleLogin}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-6 min-h-[44px] rounded-full"
                                      >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Sign In
                                      </Button>
              )}
                    </div>
                  </div>
                  </header>

        {/* Main Content - offset for fixed header (56px + safe area) */}
          <main className="flex-1 pt-14" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))' }}>
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full box-border overflow-x-hidden page-transition scroll-smooth-native">
              {children}
            </div>
          </main>

      </div>

      </div>
      );
}