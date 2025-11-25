import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles, Zap, MessageSquare, User, Crown, Trophy,
  TrendingUp, Target, ChevronRight, Star, Flame
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const menuItems = [
  {
    id: "analysis",
    title: "ANALYSIS HUB",
    subtitle: "AI-Powered Predictions",
    description: "Match analysis, player stats, team insights",
    icon: Sparkles,
    page: "AnalysisHub",
    gradient: "from-purple-600 via-purple-700 to-indigo-800",
    accentColor: "purple",
    tag: "MOST POPULAR",
    tagColor: "bg-yellow-500"
  },
  {
    id: "betting",
    title: "BETTING TOOLS",
    subtitle: "Track & Optimize",
    description: "Bet tracker, parlays, calculators, live odds",
    icon: Zap,
    page: "BettingHub",
    gradient: "from-emerald-600 via-emerald-700 to-teal-800",
    accentColor: "emerald",
    tag: "NEW",
    tagColor: "bg-red-500"
  },
  {
    id: "community",
    title: "COMMUNITY",
    subtitle: "Learn & Connect",
    description: "Daily briefs, learning center, community picks",
    icon: MessageSquare,
    page: "CommunityHub",
    gradient: "from-orange-600 via-orange-700 to-red-800",
    accentColor: "orange",
    tag: null
  },
  {
    id: "account",
    title: "MY ACCOUNT",
    subtitle: "Profile & Settings",
    description: "Saved results, preferences, subscription",
    icon: User,
    page: "MyAccount",
    gradient: "from-blue-600 via-blue-700 to-cyan-800",
    accentColor: "blue",
    tag: null
  }
];

export default function Dashboard() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    refetchOnWindowFocus: true,
  });

  const isVIP = currentUser?.subscription_type === 'vip_annual' || currentUser?.subscription_type === 'legacy';
  const isPremium = currentUser?.subscription_type === 'premium_monthly';

  const getSubscriptionBadge = () => {
    if (currentUser?.subscription_type === 'legacy') return { label: 'LEGACY', color: 'from-yellow-500 to-orange-500' };
    if (currentUser?.subscription_type === 'vip_annual') return { label: 'VIP', color: 'from-purple-500 to-pink-500' };
    if (currentUser?.subscription_type === 'premium_monthly') return { label: 'PREMIUM', color: 'from-blue-500 to-cyan-500' };
    return { label: 'FREE', color: 'from-gray-500 to-gray-600' };
  };

  const subscription = getSubscriptionBadge();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* Logo & Title */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
              alt="SWH Logo"
              className="w-16 h-16 rounded-2xl shadow-2xl border-2 border-white/20"
            />
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                SPORTS WAGER
              </h1>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                HELPER
              </h2>
            </div>
          </div>

          {/* User Welcome & Status */}
          {currentUser && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">
                  Welcome back, {currentUser.full_name?.split(' ')[0] || 'Player'}!
                </div>
                <div className={`text-xs font-bold bg-gradient-to-r ${subscription.color} bg-clip-text text-transparent`}>
                  {subscription.label} MEMBER
                </div>
              </div>
              {(isVIP || isPremium) && (
                <Crown className="w-6 h-6 text-yellow-400" />
              )}
            </motion.div>
          )}

          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <Button
                onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold px-8 py-6 text-lg rounded-full shadow-lg shadow-emerald-500/25"
              >
                SIGN IN TO PLAY
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Main Menu Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isHovered = hoveredItem === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link to={createPageUrl(item.page)}>
                  <Card 
                    className={`relative overflow-hidden border-0 cursor-pointer transition-all duration-300 ${
                      isHovered ? 'scale-[1.02] shadow-2xl' : 'shadow-xl'
                    }`}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
                    
                    {/* Shine Effect on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 ${
                      isHovered ? 'translate-x-full' : '-translate-x-full'
                    }`} />
                    
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }} />

                    <CardContent className="relative p-8">
                      {/* Tag */}
                      {item.tag && (
                        <div className={`absolute top-4 right-4 ${item.tagColor} text-white text-xs font-black px-3 py-1 rounded-full shadow-lg`}>
                          {item.tag}
                        </div>
                      )}

                      <div className="flex items-start gap-6">
                        {/* Icon */}
                        <div className={`w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 ${
                          isHovered ? 'scale-110 rotate-3' : ''
                        }`}>
                          <Icon className="w-10 h-10 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-wide">
                            {item.title}
                          </h3>
                          <div className="text-white/80 font-semibold text-lg mb-2">
                            {item.subtitle}
                          </div>
                          <p className="text-white/60 text-sm">
                            {item.description}
                          </p>
                        </div>

                        {/* Arrow */}
                        <div className={`self-center transition-transform duration-300 ${
                          isHovered ? 'translate-x-2' : ''
                        }`}>
                          <ChevronRight className="w-8 h-8 text-white/50" />
                        </div>
                      </div>

                      {/* Bottom Accent Line */}
                      <div className={`absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300 ${
                        isHovered ? 'w-full' : 'w-0'
                      }`} />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats Bar */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-orange-400" />
                <span className="text-white/70">Quick Actions:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to={createPageUrl("AnalysisHub")}>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Target className="w-4 h-4 mr-2" />
                    Analyze Match
                  </Button>
                </Link>
                <Link to={createPageUrl("BettingHub")}>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Track Bet
                  </Button>
                </Link>
                <Link to={createPageUrl("Pricing")}>
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0">
                    <Crown className="w-4 h-4 mr-2" />
                    {isVIP ? 'VIP Active' : 'Upgrade'}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-white/40 text-sm">
            ⚠️ Always gamble responsibly. This tool is for informational purposes only.
          </p>
        </motion.div>
      </div>
    </div>
  );
}