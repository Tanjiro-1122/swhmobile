
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
  Crown,
  Sparkles,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DomainChangeBanner from "./components/DomainChangeBanner";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();

    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

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

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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

  const isLegacy = currentUser?.subscription_type === 'legacy';
  const isVIP = currentUser?.subscription_type === 'vip_annual';
  const isPremium = currentUser?.subscription_type === 'premium_monthly';
  const isAdmin = currentUser?.role === 'admin';

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
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const handleMenuClick = (pageName) => {
    setSidebarOpen(false);
    navigate(createPageUrl(pageName));
  };

  const menuItems = [
    { name: "Dashboard", icon: Home, page: "Dashboard" },
    { name: "Player Stats", icon: User, page: "PlayerStats" },
    { name: "Team Stats", icon: TrendingUp, page: "TeamStats" },
    { name: "Live Odds", icon: BarChart3, page: "LiveOdds" },
    { name: "Betting Briefs", icon: Sparkles, page: "BettingBriefs" },
    { name: "Pricing", icon: Crown, page: "Pricing" },
    { name: "Alerts", icon: Bell, page: "Alerts" },
    { name: "Power User", icon: Zap, page: "PowerUser" },
    { name: "Learning Center", icon: BookOpen, page: "LearningCenter" },
    { name: "Community", icon: MessageSquare, page: "Community" },
    { name: "Saved Results", icon: TrendingUp, page: "SavedResults" },
    { name: "Profile", icon: User, page: "Profile" },
    { name: "Preferences", icon: Settings, page: "UserPreferences" },
  ];

  if (isAdmin) {
    menuItems.push({ name: "Admin Panel", icon: Settings, page: "AdminPanel" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <style>{`
        :root {
          --primary: 222.2 47.4% 11.2%;
          --primary-foreground: 210 40% 98%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 212.7 26.8% 83.9%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
        }
        
        .dark {
          --primary: 210 40% 98%;
          --primary-foreground: 222.2 47.4% 11.2%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 212.7 26.8% 83.9%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
        }

        /* Mobile-specific fixes */
        @media (max-width: 1024px) {
          body {
            overflow-x: hidden;
          }
        }
      `}</style>
      
      {/* Domain Change Banner */}
      <DomainChangeBanner />
      
      {/* Fixed Header - Highest z-index */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white hover:bg-slate-800 flex-shrink-0"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                alt="SWH Logo"
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl object-cover flex-shrink-0"
              />
              <span className="text-lg lg:text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hidden sm:inline">
                Sports Wager Helper
              </span>
              <span className="text-lg font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent sm:hidden">
                SWH
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && currentUser ? (
              <>
                {isLegacy && (
                  <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1.5 rounded-full">
                    <Crown className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                    <span className="text-xs lg:text-sm font-bold text-white">LEGACY</span>
                  </div>
                )}
                {isVIP && (
                  <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1.5 rounded-full">
                    <Crown className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                    <span className="text-xs lg:text-sm font-bold text-white">VIP</span>
                  </div>
                )}
                {isPremium && (
                  <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 rounded-full">
                    <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                    <span className="text-xs lg:text-sm font-bold text-white">PREMIUM</span>
                  </div>
                )}
                <Avatar className="w-8 h-8 lg:w-10 lg:h-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                    {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 hidden sm:flex"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-3 py-2 lg:px-6 text-xs lg:text-base"
              >
                <LogIn className="w-4 h-4 mr-1 lg:mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex pt-16 lg:pt-20">
        <aside
          className={`fixed left-0 top-16 lg:top-20 bottom-0 w-64 lg:w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700 overflow-y-auto transition-transform duration-300 z-40 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-3 lg:p-4 space-y-1 lg:space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleMenuClick(item.page)}
                  className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                      : 'text-gray-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span className="font-medium text-sm lg:text-base">{item.name}</span>
                </button>
              );
            })}
            
            {/* Mobile-only logout button */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-left lg:hidden mt-4"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm">Log Out</span>
              </button>
            )}

            <div className="pt-4 border-t border-slate-700 mt-4 space-y-2">
              <Link
                to={createPageUrl("PrivacyPolicy")}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-500 hover:text-gray-300"
              >
                Privacy Policy
              </Link>
              <Link
                to={createPageUrl("TermsOfService")}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-500 hover:text-gray-300"
              >
                Terms of Service
              </Link>
              
              <div className="mt-4 px-3 lg:px-4">
                <div className="text-xs text-gray-500 font-semibold mb-2">COMMUNITY</div>
                <div className="space-y-2">
                  <a
                    href="https://www.reddit.com/r/sportswagerhelper/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs lg:text-sm text-gray-400 hover:text-orange-400 transition-colors"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                    r/sportswagerhelper
                  </a>
                  {(isAuthenticated && currentUser && (currentUser.subscription_type === 'vip_annual' || currentUser.subscription_type === 'legacy')) && (
                    <a
                      href="https://discord.gg/2TswBjam"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs lg:text-sm text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      VIP Discord
                      <Crown className="w-3 h-3 text-yellow-500" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 lg:p-6 min-h-screen">
          {children}
        </main>
      </div>

      {/* Backdrop Overlay - z-30 (below sidebar and header) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          style={{ top: '4rem' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
