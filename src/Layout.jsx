
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, User, Shield, Bookmark, LogOut, Menu, Crown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useFreeLookupTracker } from "./components/auth/FreeLookupTracker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  {
    title: "Match Analysis",
    url: createPageUrl("Dashboard"),
    icon: Trophy,
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Player Stats",
    url: createPageUrl("PlayerStats"),
    icon: User,
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Team Stats",
    url: createPageUrl("TeamStats"),
    icon: Shield,
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "Saved Results",
    url: createPageUrl("SavedResults"),
    icon: Bookmark,
    color: "from-orange-500 to-red-500"
  },
  {
    title: "Contact",
    url: createPageUrl("Contact"),
    icon: Mail,
    color: "from-indigo-500 to-purple-500"
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { lookupsRemaining, isAuthenticated } = useFreeLookupTracker();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const handleSignup = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 group">
              <div className="relative">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/f7ec915ef_image.png"
                  alt="SWH Sports Wager Helper"
                  className="h-10 w-10 object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white">Sports Wager Helper</h1>
                <p className="text-xs text-emerald-400">AI Sports Analytics</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.title}</span>
                  </Link>
                );
              })}
              
              {/* Admin Link - Only visible to admins */}
              {isAdmin && (
                <Link
                  to={createPageUrl("AdminUserManager")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    location.pathname === createPageUrl("AdminUserManager")
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-3">
              {/* Free Lookups Badge */}
              {!isAuthenticated && (
                <Badge className="hidden sm:flex bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 text-sm font-bold">
                  {lookupsRemaining}/5 Free
                </Badge>
              )}

              {/* User Menu or Sign Up */}
              {isAuthenticated && currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-slate-800">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {currentUser.full_name?.[0] || currentUser.email?.[0] || 'U'}
                      </div>
                      <span className="hidden sm:inline text-white font-medium">{currentUser.full_name || 'User'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("AdminUserManager")} className="cursor-pointer">
                          <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={handleSignup}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all"
                >
                  <span className="hidden sm:inline">Sign Up Free</span>
                  <span className="sm:hidden">Sign Up</span>
                </Button>
              )}

              {/* Mobile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-slate-800">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {!isAuthenticated && (
                    <div className="px-2 py-3 border-b border-slate-200">
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 px-3 py-1 text-sm font-bold">
                        {lookupsRemaining}/5 Free Lookups
                      </Badge>
                    </div>
                  )}
                  {navigationItems.map((item) => (
                    <DropdownMenuItem key={item.title} asChild>
                      <Link to={item.url} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="w-4 h-4" />
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("AdminUserManager")} className="flex items-center gap-2 cursor-pointer">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/f7ec915ef_image.png"
                alt="SWH Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-slate-400 text-sm">© 2024 Sports Wager Helper</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("Contact")} className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">
                Contact Us
              </Link>
              <span className="text-slate-500 text-sm">
                Powered by live data from StatMuse, ESPN & official sources
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
