
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
  Calendar // Added Calendar icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#1e293b';
      document.head.appendChild(meta);
    }

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

    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = "/manifest.json";
    document.head.appendChild(manifestLink);

    return () => {
      document.head.removeChild(jqueryScript);
      document.head.removeChild(firebaseScript);
      document.head.removeChild(web2appScript);
      document.head.removeChild(manifestLink);
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
  const isAdmin = currentUser?.role === 'admin';

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      setIsAuthenticated(false);
      // Redirect to Dashboard after logout
      window.location.href = createPageUrl("Dashboard");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if there's an error
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
    { name: "AI Performance", icon: Trophy, page: "AIPerformance" },
    { name: "Alerts", icon: Bell, page: "Alerts" },
    { name: "Parlay Builder", icon: Shield, page: "ParlayBuilder" },
    { name: "Betting Calculator", icon: Calculator, page: "BettingCalculator" },
    { name: "ROI Tracker", icon: DollarSign, page: "ROITracker" },
    { name: "Bankroll Manager", icon: Wallet, page: "BankrollManager" },
    { name: "Learning Center", icon: BookOpen, page: "LearningCenter" },
    { name: "Community", icon: MessageSquare, page: "Community" },
    { name: "Saved Results", icon: TrendingUp, page: "SavedResults" },
  ];

  if (isAdmin) {
    menuItems.push({ name: "Admin Panel", icon: Settings, page: "AdminPanel" });
    menuItems.push({ name: "Match Results", icon: Calendar, page: "MatchResults" }); // Added Match Results for admins
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                alt="SWH Logo"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Sports Wager Helper
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && currentUser ? (
              <>
                {isVIP && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full">
                    <Shield className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">VIP LIFETIME</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                      {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-semibold text-white">{currentUser?.full_name || currentUser?.email || 'User'}</div>
                    <div className="text-xs text-gray-400">{currentUser?.email}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-6 py-2 shadow-lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In / Sign Up
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex pt-20">
        <aside
          className={`fixed left-0 top-20 bottom-0 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700 overflow-y-auto transition-transform duration-300 z-40 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                      : 'text-gray-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-slate-700 mt-4">
              <Link
                to={createPageUrl("PrivacyPolicy")}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-gray-300"
              >
                Privacy Policy
              </Link>
              <Link
                to={createPageUrl("TermsOfService")}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-gray-300"
              >
                Terms of Service
              </Link>
            </div>
          </nav>
        </aside>

        <main className="flex-1 lg:ml-64 p-6">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
