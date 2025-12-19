import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LogOut,
  Crown,
  LayoutGrid,
  LogIn,
  UserPlus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DomainChangeBanner from "../DomainChangeBanner";
import AgeGate from "../auth/AgeGate";
import { LiveMarketTicker } from "../widgets/LiveMarketTicker";

export default function MobileLayout({ children, currentPageName }) {

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        return await base44.auth.me();
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!currentUser;
  const isLegacy = currentUser?.subscription_type === 'legacy';
  const isVIP = currentUser?.subscription_type === 'vip_annual';
  const isPremium = currentUser?.subscription_type === 'premium_monthly';

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await base44.auth.logout();
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

  return (
    <div className="min-h-screen relative flex flex-col">
      <StadiumBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <DomainChangeBanner />
        <AgeGate />

        {/* Fixed Header - 56px height, respects iOS safe area */}
        <div className="fixed top-0 left-0 right-0 z-40">
          <header className="relative bg-slate-900/95 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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

              <div className="flex items-center gap-2">
                {userLoading ? (
                  <div className="w-9 h-9 rounded-full bg-slate-700 animate-pulse" />
                ) : isAuthenticated ? (
                  <>
                    {/* Subscription badges - hidden on very small screens */}
                    {isLegacy && (
                      <div className="hidden xs:flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-2 py-1 rounded-full">
                        <Crown className="w-3 h-3 text-white" />
                        <span className="text-xs font-bold text-white">LEGACY</span>
                      </div>
                    )}
                    {isVIP && (
                      <div className="hidden xs:flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-1 rounded-full">
                        <Crown className="w-3 h-3 text-white" />
                        <span className="text-xs font-bold text-white">VIP</span>
                      </div>
                    )}
                    {isPremium && (
                      <div className="hidden xs:flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 rounded-full">
                        <Crown className="w-3 h-3 text-white" />
                        <span className="text-xs font-bold text-white">PRO</span>
                      </div>
                    )}
                    
                    {/* User Avatar */}
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                        {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Logout Button */}
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
                  /* Not Authenticated - Show Login and Signup buttons */
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleLogin}
                      variant="ghost"
                      className="text-slate-200 hover:text-white hover:bg-white/10 rounded-md text-sm px-3 h-10 flex items-center gap-1"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="hidden xs:inline">Log In</span>
                    </Button>
                    <Button 
                      asChild 
                      className="bg-purple-600 text-white font-bold hover:bg-purple-700 rounded-md text-sm px-3 h-10 flex items-center gap-1"
                    >
                      <Link to={createPageUrl('Pricing')}>
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden xs:inline">Sign Up</span>
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <LiveMarketTicker />
        </div>

        {/* Main Content - offset for header (56px) + ticker (40px) = 96px */}
        <main className="flex-1 overflow-y-auto" style={{ paddingTop: 'calc(56px + 40px + env(safe-area-inset-top))', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full">
            {children}
          </div>
        </main>

        {/* Floating Dashboard Button - only show when not on Dashboard */}
        {currentPageName !== 'Dashboard' && (
          <Link
            to={createPageUrl("Dashboard")}
            className="fixed right-4 z-[100] w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 animate-fade-in"
            aria-label="Go to Dashboard"
            style={{ bottom: `calc(1rem + env(safe-area-inset-bottom))` }}
          >
            <LayoutGrid className="w-7 h-7 text-cyan-300" />
          </Link>
        )}
      </div>
    </div>
  );
}