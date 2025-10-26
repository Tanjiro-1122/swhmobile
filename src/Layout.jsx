
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, User, Shield, Bookmark, Menu, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

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

  const getUserInitial = () => {
    if (currentUser?.full_name) return currentUser.full_name[0].toUpperCase();
    if (currentUser?.email) return currentUser.email[0].toUpperCase();
    return "J";
  };

  const menuItems = [
    { label: "Match Analysis", url: createPageUrl("Dashboard"), icon: "🏆" },
    { label: "Player Stats", url: createPageUrl("PlayerStats"), icon: "👤" },
    { label: "Team Stats", url: createPageUrl("TeamStats"), icon: "🛡️" },
    { label: "Saved Results", url: createPageUrl("SavedResults"), icon: "🔖" },
  ];

  // Add Admin Panel for admin users
  if (currentUser?.role === 'admin') {
    menuItems.push({ label: "Admin Panel", url: createPageUrl("AdminPanel"), icon: "👑" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-600">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/b28834497_IMG_2146.jpeg"
              alt="Sports Wager Saver"
              className="w-14 h-14 rounded-xl object-cover shadow-lg"
            />
            <div className="hidden sm:block">
              <div className="text-white font-bold text-base leading-tight">Sports Wager Saver</div>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl border-2 border-white shadow-lg">
              {getUserInitial()}
            </div>

            {/* Hamburger Menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[73px] right-4 z-50 w-64 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden"
          >
            <div className="py-2">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.url}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition-colors ${
                    location.pathname === item.url ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-semibold text-slate-900">{item.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
