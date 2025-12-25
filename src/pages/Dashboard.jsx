import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { usePlatform } from "@/components/hooks/usePlatform";
import Footer from "@/components/layout/Footer";

import { ChevronRight, Settings, Check, PieChart, Activity, Users, FileText, User, Newspaper, BarChart2, Gem, Loader2, Bot } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import TodaysPredictions from "@/components/predictions/TodaysPredictions";
import WebExclusiveCard from "@/components/dashboard/WebExclusiveCard";
import NeonCard from "@/components/dashboard/NeonCard";
import FeaturedCard from "@/components/dashboard/FeaturedCard";
import CircuitBackground from "@/components/dashboard/CircuitBackground";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import QuickStatsBar from "@/components/dashboard/QuickStatsBar";
import AIAccuracyWidget from "@/components/dashboard/AIAccuracyWidget";
import SportsNewsWidget from "@/components/dashboard/SportsNewsWidget";


// Featured items shown prominently at the top
const featuredItems = [
    { id: "assistant", title: "S.A.L. HUB", subtitle: "Chat, Learn & Connect", description: "AI chat, lessons, briefs & community", Icon: null, customIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg", page: "AIAssistant", tag: "ALL-IN-ONE", tagColor: "bg-gradient-to-r from-purple-500 to-cyan-500 text-white" },
    { id: "analysis", title: "ANALYSIS HUB", subtitle: "AI-Powered Insights", description: "Match analysis, player stats, team insights", Icon: PieChart, page: "AnalysisHub", tag: "MOST POPULAR", tagColor: "bg-yellow-500 text-black", paidOnly: true },
];

// Secondary menu items - reduced to most essential (no duplicates of featured items)
const secondaryMenuItems = [
    { id: "tracking", title: "TRACKING TOOLS", subtitle: "Track & Analyze", description: "Performance tracker, calculators, odds", Icon: Activity, page: "BettingHub", tag: "WEB ONLY", tagColor: "bg-cyan-500 text-black", webOnly: true, paidOnly: true },
    { id: "community", title: "COMMUNITY", subtitle: "Connect & Share", description: "Join discussions, share picks", Icon: Users, page: "CommunityHub", tag: "SOCIAL", tagColor: "bg-purple-500 text-white" },
    { id: "sportsnews", title: "LIVE SCORES", subtitle: "Live Updates", description: "Live scores & news ticker", Icon: Activity, page: "SportsNewsTicker", tag: "LIVE", tagColor: "bg-red-500 text-white" },
    { id: "topten", title: "TOP TEN", subtitle: "Rankings", description: "Top players & team standings", Icon: BarChart2, page: "TopTen", tag: "NEW", tagColor: "bg-blue-500 text-white", paidOnly: true },
    { id: "account", title: "MY ACCOUNT", subtitle: "Profile & Settings", description: "Saved results, subscription", Icon: User, page: "MyAccount", tag: null },
    { id: "pricing", title: "PRICING", subtitle: "Unlock Full Power", description: "View plans and upgrade", Icon: Gem, page: "Pricing", tag: "BEST VALUE", tagColor: "bg-purple-500 text-white" },
];

// S.A.L. owl logo for AI Assistant
const SAL_OWL_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg";

// Combined for mobile view - only use featured items (no duplicates from secondary)
const allMenuItems = [...featuredItems, ...secondaryMenuItems].map(item => 
    item.id === 'assistant' ? { ...item, customIcon: SAL_OWL_LOGO } : item
);

// Assign glow colors based on card type
const getGlowColor = (id) => {
    const colorMap = {
        assistant: "purple",
        analysis: "purple",
        tracking: "cyan",
        community: "lime",
        briefs: "cyan",
        account: "purple",
        sportsnews: "orange",
        thenews: "lime",
        topten: "cyan",
        pricing: "gold",
    };
    return colorMap[id] || "purple";
};

const MenuGrid = ({ menuItems, webExclusiveItems = [], isAdmin, gridClasses }) => (
    <div className={`grid ${gridClasses} gap-5`}>
        {menuItems.map((item, index) => (
            <NeonCard 
                key={item.id} 
                item={item} 
                index={index} 
                glowColor={getGlowColor(item.id)}
            />
        ))}
        
        {/* Web Exclusive Cards for Mobile */}
        {webExclusiveItems.map((item, index) => (
            <WebExclusiveCard key={item.id} item={item} index={menuItems.length + index} />
        ))}

        {isAdmin && (
            <NeonCard 
                item={{
                    id: "admin",
                    title: "ADMIN PANEL",
                    subtitle: "Manage App",
                    description: "Administrative tools",
                    Icon: Settings,
                    page: "AdminPanel",
                    tag: "ADMIN",
                    tagColor: "bg-red-500 text-white"
                }}
                index={menuItems.length}
                glowColor="orange"
            />
        )}
    </div>
);

const WebDashboardContent = ({ featuredItems, menuItems, isAdmin, userName, isPaidUser }) => {
    // Filter featured items based on subscription
    const visibleFeatured = featuredItems.filter(item => isPaidUser || !item.paidOnly);
    
    return (
        <div className="w-full relative z-10">
            <DashboardHeader userName={userName} />
            
            {/* Quick Stats Bar */}
            <QuickStatsBar />

            {/* Featured Actions - Primary CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {visibleFeatured.map((item, index) => (
                    <FeaturedCard key={item.id} item={item} index={index} />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Today's Predictions - takes 2 columns */}
                <div className="lg:col-span-2">
                    <TodaysPredictions />
                </div>
                
                {/* Right sidebar with AI Accuracy */}
                <div className="space-y-6">
                    <AIAccuracyWidget />
                    <SportsNewsWidget />
                </div>
            </div>
            
            {/* Secondary Navigation Grid - Compact 3-column */}
            <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-300 mb-4">More Tools</h2>
            </div>
            <MenuGrid menuItems={menuItems} isAdmin={isAdmin} gridClasses="grid-cols-2 lg:grid-cols-3" />
        </div>
    );
};

const MobileDashboardContent = ({ menuItems, webExclusiveItems, isAdmin }) => {
    return (
        <div className="w-full">
            <motion.div 
                className="text-center pt-2 pb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Glowing logo container */}
                <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-3xl blur-xl opacity-40 animate-pulse" />
                    <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                        alt="SWH Logo"
                        className="relative w-20 h-20 rounded-3xl object-cover shadow-2xl border-2 border-purple-500/50"
                    />
                </div>
                <h1 className="text-2xl font-black tracking-tighter">
                    <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                        SPORTS WAGER HELPER
                    </span>
                </h1>
                <p className="text-slate-400 mt-1 text-sm font-medium">
                    AI-Powered Sports Analytics
                </p>
            </motion.div>
            
            {/* 2-column grid for tablets, 1-column for phones */}
            <MenuGrid menuItems={menuItems} webExclusiveItems={webExclusiveItems} isAdmin={isAdmin} gridClasses="grid-cols-1 sm:grid-cols-2" />
        </div>
    );
};


export default function Dashboard() {
    const { isNativeApp, isMobileScreen } = usePlatform();
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        // Handle payment success from both Dashboard and MyAccount redirects
        if (urlParams.get('payment_success') === 'true') {
            setShowSuccessMessage(true);
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => setShowSuccessMessage(false), 5000);
        }
    }, []);

    const { data: currentUser, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const isAuth = await base44.auth.isAuthenticated();
            if (!isAuth) return null;
            return base44.auth.me();
        },
    });

    // Redirect unauthenticated users to Home
    React.useEffect(() => {
        if (!isLoading && !currentUser) {
            window.location.href = createPageUrl('Home');
        }
    }, [isLoading, currentUser]);

    if (isLoading || !currentUser) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            </div>
        );
    }

    const isAdmin = currentUser?.role === 'admin';
    const isMobile = isNativeApp || isMobileScreen;
    const userTier = currentUser?.subscription_type || 'free';
    const isPaidUser = userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly' || userTier === 'influencer';
    
    // Filter menu items based on user tier and platform
    const filterMenuItems = (items) => {
        return items.filter(item => {
            // If user is free, hide paid-only items
            if (!isPaidUser && item.paidOnly) return false;
            return true;
        });
    };
    
    // For mobile: use all items combined, for web: use secondary items only (featured shown separately)
    const filteredAllItems = filterMenuItems(allMenuItems);
    const filteredSecondaryItems = filterMenuItems(secondaryMenuItems);
    const filteredFeaturedItems = filterMenuItems(featuredItems);
    
    const menuItems = isMobile ? filteredAllItems.filter(item => !item.webOnly) : filteredSecondaryItems;
    const webExclusiveItems = isMobile ? filteredAllItems.filter(item => item.webOnly) : [];
    
    if (isMobile) {
        return (
            <>
                {showSuccessMessage && (
                    <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        <span className="font-bold">Payment successful!</span>
                    </motion.div>
                )}
                <MobileDashboardContent menuItems={menuItems} webExclusiveItems={webExclusiveItems} isAdmin={isAdmin} />
            </>
        );
    }

    return (
        <div className="min-h-screen relative">
            <CircuitBackground />

            {showSuccessMessage && (
                <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-xl shadow-2xl shadow-green-500/30 flex items-center gap-2 border border-green-400/30">
                    <Check className="w-5 h-5" />
                    <span className="font-bold">Payment successful!</span>
                </motion.div>
            )}

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <WebDashboardContent 
                    featuredItems={filteredFeaturedItems}
                    menuItems={menuItems} 
                    isAdmin={isAdmin} 
                    userName={currentUser?.full_name}
                    isPaidUser={isPaidUser}
                />
            </div>

            <Footer />
        </div>
    );
    }