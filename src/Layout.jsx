import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load web2application.com scripts for mobile app conversion
  useEffect(() => {
    // Only load if not already loaded
    if (document.querySelector('script[src*="web2application"]')) {
      return;
    }

    // Add jQuery (required by web2app)
    const jqueryScript = document.createElement('script');
    jqueryScript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js';
    jqueryScript.async = true;
    document.head.appendChild(jqueryScript);

    // Add Firebase (for push notifications)
    const firebaseScript = document.createElement('script');
    firebaseScript.src = 'https://www.gstatic.com/firebasejs/7.11.0/firebase.js';
    firebaseScript.async = true;
    document.head.appendChild(firebaseScript);

    // Add web2app bridge script (your webapp ID: 36296)
    const web2appScript = document.createElement('script');
    web2appScript.src = 'https://web2application.com/w2a/webapps/36296/web2app1.js';
    web2appScript.async = true;
    web2appScript.onload = () => {
      console.log('✅ Mobile app bridge loaded!');
    };
    document.head.appendChild(web2appScript);

    // Add mobile-optimized meta tags
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    // Cleanup on unmount
    return () => {
      if (jqueryScript.parentNode) document.head.removeChild(jqueryScript);
      if (firebaseScript.parentNode) document.head.removeChild(firebaseScript);
      if (web2appScript.parentNode) document.head.removeChild(web2appScript);
    };
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isVIP = currentUser?.is_vip === true;
  const isAdmin = currentUser?.role === 'admin';

  const handleLogout = () => {
    base44.auth.logout();
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
              <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hidden md:block">
                Sports Wager Helper
              </span>
              <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent md:hidden">
                SWH
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isVIP && (
              <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">VIP</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-right">
                <div className="text-sm font-semibold text-white">{currentUser?.full_name || 'User'}</div>
                <div className="text-xs text-gray-400">{currentUser?.email}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </Button>
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