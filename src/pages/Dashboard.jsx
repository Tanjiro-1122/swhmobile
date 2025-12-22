import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { usePlatform } from "@/components/hooks/usePlatform";

import { ChevronRight, Settings, Check, PieChart, Activity, Users, FileText, User, Newspaper, BarChart2, Gem, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import TodaysPredictions from "@/components/predictions/TodaysPredictions";
import WebExclusiveCard from "@/components/dashboard/WebExclusiveCard";
import NeonCard from "@/components/dashboard/NeonCard";
import CircuitBackground from "@/components/dashboard/CircuitBackground";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const allMenuItems = [
    { id: "analysis", title: "ANALYSIS HUB", subtitle: "AI-Powered Insights", description: "Match analysis, player stats, team insights", Icon: PieChart, page: "AnalysisHub", tag: "MOST POPULAR", tagColor: "bg-yellow-500 text-black" },
    { id: "tracking", title: "TRACKING TOOLS", subtitle: "Track & Analyze", description: "Performance tracker, calculators, odds comparison", Icon: Activity, page: "BettingHub", tag: "WEB ONLY", tagColor: "bg-cyan-500 text-black", webOnly: true },
    { id: "community", title: "COMMUNITY", subtitle: "Learn & Connect", description: "Daily briefs, learning center, discussions", Icon: Users, page: "CommunityHub", tag: null },
    { id: "briefs", title: "DAILY BRIEFS", subtitle: "AI Market Insights", description: "Daily analysis, top picks, and news", Icon: FileText, page: "DailyBriefs", tag: "WEB ONLY", tagColor: "bg-cyan-500 text-black", webOnly: true },
    { id: "account", title: "MY ACCOUNT", subtitle: "Profile & Settings", description: "Saved results, preferences, subscription", Icon: User, page: "MyAccount", tag: null },
    { id: "sportsnews", title: "SPORTS NEWS & SCORES", subtitle: "Live Updates", description: "Live scores, news ticker & RSS feeds", Icon: Activity, page: "SportsNewsTicker", tag: "LIVE", tagColor: "bg-red-500 text-white" },
    { id: "thenews", title: "TODAY'S INSIGHTS", subtitle: "Latest Updates", description: "Sports betting briefs & news", Icon: Newspaper, page: "TopStats", tag: "FREE", tagColor: "bg-slate-500 text-white" },
    { id: "topten", title: "TOP TEN", subtitle: "Rankings", description: "Top players & team standings", Icon: BarChart2, page: "TopTen", tag: "NEW", tagColor: "bg-blue-500 text-white" },
    { id: "pricing", title: "PRICING", subtitle: "Unlock Full Power", description: "View plans and upgrade your account", Icon: Gem, page: "Pricing", tag: "BEST VALUE", tagColor: "bg-purple-500 text-white" },
];

// Assign glow colors based on card type
const getGlowColor = (id) => {
    const colorMap = {
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

const WebDashboardContent = ({ menuItems, isAdmin }) => {
    return (
        <div className="w-full">
            <TodaysPredictions />
            <div className="mt-8">
              <MenuGrid menuItems={menuItems} isAdmin={isAdmin} gridClasses="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
            </div>
        </div>
    );
};

const MobileDashboardContent = ({ menuItems, webExclusiveItems, isAdmin }) => {
    return (
        <div className="w-full">
            <div className="text-center pt-2 pb-8">
                <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                    alt="SWH Logo"
                    className="w-24 h-24 rounded-3xl object-cover mx-auto mb-6 shadow-2xl border-2 border-slate-700"
                />
                <h1 className="text-3xl font-black text-white tracking-tighter">
                    SPORTS WAGER HELPER
                </h1>
                <p className="text-slate-300 mt-1 text-md">
                    AI-Powered Sports Analytics & Insights
                </p>
            </div>
            <MenuGrid menuItems={menuItems} webExclusiveItems={webExclusiveItems} isAdmin={isAdmin} gridClasses="grid-cols-1" />
        </div>
    );
};


export default function Dashboard() {
    const { isNativeApp, isMobileScreen } = usePlatform();
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_success') === 'true') {
            setShowSuccessMessage(true);
            window.history.replaceState({}, '', window.location.pathname);
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
    
    // For mobile: separate regular items from web-exclusive items
    const menuItems = isMobile ? allMenuItems.filter(item => !item.webOnly) : allMenuItems;
    const webExclusiveItems = isMobile ? allMenuItems.filter(item => item.webOnly) : [];
    
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
        <div className="min-h-screen">
            {showSuccessMessage && (
                <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span className="font-bold">Payment successful!</span>
                </motion.div>
            )}

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <WebDashboardContent menuItems={menuItems} isAdmin={isAdmin} />
            </div>
        </div>
    );
}