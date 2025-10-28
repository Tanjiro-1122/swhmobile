
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  User,
  TrendingUp,
  Calculator,
  DollarSign,
  Wallet,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  BarChart3,
  Bell,
  MessageSquare,
  Trophy,
  LogIn,
  Calendar,
  Star, // Added Star icon for legacy members
  RefreshCw // Added RefreshCw icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import InstallPrompt from "./components/mobile/InstallPrompt";
import ThemeProvider from "./components/mobile/ThemeProvider";
import ThemeToggle from "./components/mobile/ThemeToggle";
import ServiceWorkerSetup from "./components/mobile/ServiceWorkerSetup";
import OfflineIndicator from "./components/mobile/OfflineIndicator";
import OfflineCache from "./components/mobile/OfflineCache";
import FeedbackButton from "./components/feedback/FeedbackButton";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();

    // Add mobile optimization meta tags directly to document head
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(meta);
    } else {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#1e293b';
      document.head.appendChild(meta);
    }

    // Apple mobile web app capable
    let appleWebApp = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleWebApp) {
      appleWebApp = document.createElement('meta');
      appleWebApp.name = 'apple-mobile-web-app-capable';
      appleWebApp.content = 'yes';
      document.head.appendChild(appleWebApp);
    }

    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusBar) {
      appleStatusBar = document.createElement('meta');
      appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
      appleStatusBar.content = 'black-translucent';
      document.head.appendChild(appleStatusBar);
    }

    // Add apple touch icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement("link");
      appleTouchIcon.rel = "apple-touch-icon";
      appleTouchIcon.href = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png";
      document.head.appendChild(appleTouchIcon);
    }

    // Prevent pull-to-refresh on mobile
    document.body.style.overscrollBehavior = 'none';

    // Load web2application.com scripts for mobile app conversion
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
    web2appScript.onload = () => {
      console.log("✅ web2application.com integration loaded successfully!");
    };
    document.head.appendChild(web2appScript);

    return () => {
      document.head.removeChild(jqueryScript);
      document.head.removeChild(firebaseScript);
      document.head.removeChild(web2appScript);
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
  });

  const isVIP = currentUser?.subscription_type === 'vip_lifetime';
  const isLegacy = currentUser?.is_legacy_member || currentUser?.subscription_type === 'legacy_lifetime'; // Added isLegacy
  const isAdmin = currentUser?.role === 'admin';

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      setIsAuthenticated(false);
      window.location.href = createPageUrl("Dashboard");
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = createPageUrl("Dashboard");
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const menuItems = [
    { name: "Dashboard", icon: Home, page: "Dashboard" },
    { name: "Player Stats", icon: User, page: "PlayerStats" },
    { name: "Team Stats", icon: TrendingUp, page: "TeamStats" },
    { name: "Live Odds", icon: BarChart3, page: "LiveOdds" },
    { name: "Alerts", icon: Bell, page: "Alerts" },
    { name: "Parlay Builder", icon: Shield, page: "ParlayBuilder" },
    { name: "Betting Calculator", icon: Calculator, page: "BettingCalculator" },
    { name: "ROI Tracker", icon: DollarSign, page: "ROITracker" },
    { name: "Bankroll Manager", icon: Wallet, page: "BankrollManager" },
    { name: "Learning Center", icon: BookOpen, page: "LearningCenter" },
    { name: "Community", icon: MessageSquare, page: "Community" },
    { name: "Saved Results", icon: TrendingUp, page: "SavedResults" },
    { name: "Settings", icon: Settings, page: "Settings" },
  ];

  if (isAdmin) {
    menuItems.push(
      { name: "AI Performance", icon: Trophy, page: "AIPerformance" },
      { name: "Auto-Update Status", icon: RefreshCw, page: "AutoUpdateStatus" },
      { name: "Odds Verification", icon: Shield, page: "OddsVerification" },
      { name: "Admin Panel", icon: Settings, page: "AdminPanel" }
    );
  }

  return (
    <ThemeProvider>
      <ServiceWorkerSetup />
      <OfflineCache />
      <OfflineIndicator />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 transition-colors duration-300">
        {/* Mobile-optimized header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-700 dark:border-slate-800 safe-top transition-colors duration-300">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-white flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
              >
                {sidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </Button>
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                  alt="SWH Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover flex-shrink-0"
                />
                <span className="text-base sm:text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate hidden sm:inline">
                  Sports Wager Helper
                </span>
                <span className="text-base font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent sm:hidden">
                  SWH
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {isAuthenticated && currentUser ? (
                <>
                  {isLegacy && (
                    <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-3 sm:px-4 py-2 rounded-full">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">LEGACY MEMBER</span>
                    </div>
                  )}
                  {isVIP && !isLegacy && ( // Only show VIP if not a legacy member
                    <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 sm:px-4 py-2 rounded-full">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">VIP LIFETIME</span>
                    </div>
                  )}
                  <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                        {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-right">
                      <div className="text-sm font-semibold text-white truncate max-w-[120px]">{currentUser?.full_name || currentUser?.email || 'User'}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[120px]">{currentUser?.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-white h-9 w-9 sm:h-10 sm:w-10"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-3 sm:px-6 py-2 shadow-lg text-xs sm:text-base whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sign In / Sign Up</span>
                  <span className="sm:hidden">Sign In</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile-optimized sidebar */}
        <aside
          className={`fixed left-0 top-16 sm:top-20 bottom-0 w-64 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-r border-slate-700 dark:border-slate-800 overflow-y-auto transition-transform duration-300 z-40 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                      : 'text-gray-400 hover:text-white hover:bg-slate-800 active:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="font-medium truncate">{item.name}</span>
                </Link>
              );
            })}
            <div className="pt-3 sm:pt-4 border-t border-slate-700 dark:border-slate-800 mt-3 sm:mt-4">
              <Link
                to={createPageUrl("PrivacyPolicy")}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 hover:text-gray-300 active:text-gray-400"
              >
                Privacy Policy
              </Link>
              <Link
                to={createPageUrl("TermsOfService")}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 hover:text-gray-300 active:text-gray-400"
              >
                Terms of Service
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 pt-20 sm:pt-24 p-4 sm:p-6 pb-20 sm:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Feedback Button */}
      <FeedbackButton />

      {/* Install prompt */}
      <InstallPrompt />
    </ThemeProvider>
  );
}
