import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles, Zap, MessageSquare, User, Crown, 
  TrendingUp, Target, ChevronRight, Settings, Mail, Shield, FileText, LogOut
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";



// Sport-themed icons as SVG components
const FootballIcon = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <ellipse cx="50" cy="50" rx="45" ry="28" fill="none" stroke="white" strokeWidth="3"/>
    <path d="M20 50 Q50 30 80 50 Q50 70 20 50" fill="none" stroke="white" strokeWidth="2"/>
    <line x1="50" y1="22" x2="50" y2="78" stroke="white" strokeWidth="2"/>
  </svg>
);

const BasketballIcon = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3"/>
    <path d="M5 50 Q50 20 95 50" fill="none" stroke="white" strokeWidth="2"/>
    <path d="M5 50 Q50 80 95 50" fill="none" stroke="white" strokeWidth="2"/>
    <line x1="50" y1="5" x2="50" y2="95" stroke="white" strokeWidth="2"/>
  </svg>
);

const BaseballIcon = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3"/>
    <path d="M25 15 Q35 50 25 85" fill="none" stroke="white" strokeWidth="2"/>
    <path d="M75 15 Q65 50 75 85" fill="none" stroke="white" strokeWidth="2"/>
  </svg>
);

const SoccerIcon = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3"/>
    <polygon points="50,20 65,35 60,55 40,55 35,35" fill="none" stroke="white" strokeWidth="2"/>
    <line x1="50" y1="20" x2="50" y2="5" stroke="white" strokeWidth="2"/>
    <line x1="65" y1="35" x2="80" y2="25" stroke="white" strokeWidth="2"/>
    <line x1="35" y1="35" x2="20" y2="25" stroke="white" strokeWidth="2"/>
  </svg>
);

const HockeyIcon = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3"/>
    <ellipse cx="50" cy="50" rx="20" ry="20" fill="none" stroke="white" strokeWidth="2"/>
    <line x1="50" y1="5" x2="50" y2="30" stroke="white" strokeWidth="2"/>
    <line x1="50" y1="70" x2="50" y2="95" stroke="white" strokeWidth="2"/>
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <path d="M30 20 L70 20 L65 55 Q50 70 35 55 Z" fill="none" stroke="white" strokeWidth="3"/>
    <rect x="40" y="55" width="20" height="15" fill="none" stroke="white" strokeWidth="2"/>
    <rect x="35" y="70" width="30" height="10" fill="none" stroke="white" strokeWidth="2"/>
    <path d="M30 20 Q10 25 15 45 Q20 50 30 45" fill="none" stroke="white" strokeWidth="2"/>
    <path d="M70 20 Q90 25 85 45 Q80 50 70 45" fill="none" stroke="white" strokeWidth="2"/>
  </svg>
);

const menuItems = [
        {
          id: "analysis",
          title: "ANALYSIS HUB",
          subtitle: "AI-Powered Insights",
          description: "Match analysis, player stats, team insights",
          SportIcon: FootballIcon,
          page: "AnalysisHub",
          gradient: "from-purple-600 to-indigo-700",
          borderColor: "border-purple-400",
          tag: "MOST POPULAR",
          tagColor: "bg-yellow-500"
        },
        {
          id: "tracking",
          title: "TRACKING TOOLS",
          subtitle: "Track & Analyze",
          description: "Performance tracker, calculators, odds comparison",
          SportIcon: BasketballIcon,
          page: "BettingHub",
          gradient: "from-emerald-600 to-teal-700",
          borderColor: "border-emerald-400",
          tag: "NEW",
          tagColor: "bg-red-500"
        },
        {
          id: "community",
          title: "COMMUNITY",
          subtitle: "Learn & Connect",
          description: "Daily briefs, learning center, discussions",
          SportIcon: BaseballIcon,
          page: "CommunityHub",
          gradient: "from-orange-600 to-red-700",
          borderColor: "border-orange-400",
          tag: null
        },
        {
          id: "account",
          title: "MY ACCOUNT",
          subtitle: "Profile & Settings",
          description: "Saved results, preferences, subscription",
          SportIcon: SoccerIcon,
          page: "MyAccount",
          gradient: "from-blue-600 to-cyan-700",
          borderColor: "border-blue-400",
          tag: null
        },
        {
          id: "pricing",
          title: "PRICING",
          subtitle: "Unlock Full Power",
          description: "View plans and upgrade your account",
          SportIcon: TrophyIcon,
          page: "Pricing",
          gradient: "from-yellow-600 to-amber-700",
          borderColor: "border-yellow-400",
          tag: "BEST VALUE"
        },
      ];

export default function Dashboard() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated()
      .then(setIsAuthenticated)
      .catch((err) => {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
      });
  }, []);

  const { data: currentUser, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (!authenticated) return null;
        return await base44.auth.me();
      } catch (err) {
        console.error('Error fetching user:', err);
        return null;
      }
    },
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const isVIP = currentUser?.subscription_type === 'vip_annual' || currentUser?.subscription_type === 'legacy';
  const isAdmin = currentUser?.role === 'admin';

  const getSubscriptionBadge = () => {
    if (currentUser?.subscription_type === 'legacy') return { label: 'LEGACY', color: 'from-yellow-400 to-orange-500' };
    if (currentUser?.subscription_type === 'vip_annual') return { label: 'VIP', color: 'from-purple-400 to-pink-500' };
    if (currentUser?.subscription_type === 'premium_monthly') return { label: 'PREMIUM', color: 'from-blue-400 to-cyan-500' };
    return { label: 'FREE', color: 'from-gray-400 to-gray-500' };
  };

  const subscription = getSubscriptionBadge();

  return (
    <div className="min-h-screen max-h-screen relative overflow-x-hidden overflow-y-auto">
      {/* Modern Dark Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 box-border overflow-x-hidden">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {/* Logo & Title */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
              alt="SWH Logo"
              className="w-20 h-20 rounded-2xl shadow-2xl border-4 border-white/30"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-2">
            SPORTS WAGER HELPER
          </h1>
          <p className="text-white/70 text-lg">AI-Powered Sports Analytics & Insights</p>

          {/* User Welcome & Status */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 mt-6"
          >
            {currentUser && (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold">
                    Welcome, {currentUser.full_name?.split(' ')[0] || 'Player'}!
                  </div>
                  <div className={`text-xs font-bold bg-gradient-to-r ${subscription.color} bg-clip-text text-transparent`}>
                    {subscription.label} MEMBER
                  </div>
                </div>
                {isVIP && <Crown className="w-6 h-6 text-yellow-400" />}
              </>
            )}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                localStorage.clear();
                await base44.auth.logout();
                window.location.href = createPageUrl("Dashboard");
              }}
              className="text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-full min-w-[44px] min-h-[44px]"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </motion.div>


        </motion.div>

        {/* Main Menu Grid - iPad optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-10 w-full max-w-4xl mx-auto">
          {menuItems.map((item, index) => {
            const isHovered = hoveredItem === item.id;
            const SportIcon = item.SportIcon;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link to={createPageUrl(item.page)}>
                  <Card 
                    className={`relative overflow-hidden border-2 ${item.borderColor} cursor-pointer transition-all duration-300 bg-black/60 backdrop-blur-sm ${
                      isHovered ? 'scale-[1.03] shadow-2xl shadow-white/10' : 'shadow-xl'
                    }`}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-80`} />
                    
                    {/* Shine Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ${
                      isHovered ? 'translate-x-full' : '-translate-x-full'
                    }`} />

                    <CardContent className="relative p-4 sm:p-6">
                        {/* Tag */}
                        {item.tag && (
                          <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 ${item.tagColor} text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-full shadow-lg`}>
                            {item.tag}
                          </div>
                        )}

                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Sport Icon */}
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 border border-white/20 flex-shrink-0 ${
                            isHovered ? 'scale-110 rotate-6' : ''
                          }`}>
                            <div className="w-8 h-8 sm:w-12 sm:h-12">
                              <SportIcon />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h3 className="text-base sm:text-xl font-black text-white mb-0.5 tracking-wide truncate">
                              {item.title}
                            </h3>
                            <div className="text-white/80 font-semibold text-xs sm:text-sm truncate">
                              {item.subtitle}
                            </div>
                            <p className="text-white/50 text-[10px] sm:text-xs mt-1 truncate">
                              {item.description}
                            </p>
                          </div>

                          {/* Arrow */}
                          <ChevronRight className={`w-5 h-5 sm:w-6 sm:h-6 text-white/40 transition-transform duration-300 flex-shrink-0 ${
                            isHovered ? 'translate-x-1 text-white/70' : ''
                          }`} />
                        </div>
                      </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}



          {/* Admin Panel - Only for admins */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link to={createPageUrl("AdminPanel")}>
                <Card 
                  className={`relative overflow-hidden border-2 border-red-400 cursor-pointer transition-all duration-300 bg-black/60 backdrop-blur-sm ${
                    hoveredItem === 'admin' ? 'scale-[1.03] shadow-2xl shadow-white/10' : 'shadow-xl'
                  }`}
                  onMouseEnter={() => setHoveredItem('admin')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-rose-700 opacity-80" />
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ${
                    hoveredItem === 'admin' ? 'translate-x-full' : '-translate-x-full'
                  }`} />

                  <CardContent className="relative p-6">
                    <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
                      ADMIN
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 transition-transform duration-300 ${
                        hoveredItem === 'admin' ? 'scale-110 rotate-6' : ''
                      }`}>
                        <Settings className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-white tracking-wide">ADMIN PANEL</h3>
                        <div className="text-white/80 font-semibold text-sm">Manage App</div>
                        <p className="text-white/50 text-xs mt-1">Administrative tools</p>
                      </div>
                      <ChevronRight className={`w-6 h-6 text-white/40 transition-transform duration-300 ${
                        hoveredItem === 'admin' ? 'translate-x-1 text-white/70' : ''
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
        >
          <div className="grid grid-cols-2 gap-6 sm:gap-8 text-center">
            <div>
              <h4 className="text-white/50 text-xs font-bold mb-3 uppercase">Support</h4>
              <div className="space-y-2">
                <Link to={createPageUrl("ContactUs")} className="block text-white/70 hover:text-white text-sm transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-white/50 text-xs font-bold mb-3 uppercase">Legal</h4>
              <div className="space-y-2">
                <Link to={createPageUrl("PrivacyPolicy")} className="block text-white/70 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
                <Link to={createPageUrl("TermsOfService")} className="block text-white/70 hover:text-white text-sm transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-white/50 text-xs font-bold mb-3 uppercase">Community</h4>
              <div className="space-y-2">
                <a href="https://www.reddit.com/r/sportswagerhelper/" target="_blank" rel="noopener noreferrer" className="block text-white/70 hover:text-orange-400 text-sm transition-colors">
                  Reddit
                </a>
                {isVIP && (
                  <a href="https://discord.gg/v6ZVC8MR" target="_blank" rel="noopener noreferrer" className="block text-white/70 hover:text-purple-400 text-sm transition-colors">
                    VIP Discord
                  </a>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-white/50 text-xs font-bold mb-3 uppercase">Resources</h4>
              <div className="space-y-2">
                <Link to={createPageUrl("LearningCenter")} className="block text-white/70 hover:text-white text-sm transition-colors">
                  Learning Center
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-white/40 text-xs">
              © {new Date().getFullYear()} Sports Wager Helper • For entertainment & informational purposes only
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}