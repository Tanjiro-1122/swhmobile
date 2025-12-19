import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { usePlatform } from "@/components/hooks/usePlatform";

import { ChevronRight, Settings, Check, PieChart, Activity, Users, FileText, User, Newspaper, BarChart2, Gem } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import TodaysPredictions from "@/components/predictions/TodaysPredictions";
import { LiveMarketTicker } from '@/components/widgets/LiveMarketTicker';

const allMenuItems = [
    { id: "analysis", title: "ANALYSIS HUB", subtitle: "AI-Powered Insights", description: "Match analysis, player stats, team insights", Icon: PieChart, page: "AnalysisHub", tag: "MOST POPULAR", tagColor: "bg-yellow-500 text-black" },
    { id: "tracking", title: "TRACKING TOOLS", subtitle: "Track & Analyze", description: "Performance tracker, calculators, odds comparison", Icon: Activity, page: "BettingHub", tag: "WEB ONLY", tagColor: "bg-cyan-500 text-black", webOnly: true },
    { id: "community", title: "COMMUNITY", subtitle: "Learn & Connect", description: "Daily briefs, learning center, discussions", Icon: Users, page: "CommunityHub", tag: null },
    { id: "briefs", title: "DAILY BRIEFS", subtitle: "AI Market Insights", description: "Daily analysis, top picks, and news", Icon: FileText, page: "DailyBriefs", tag: "WEB ONLY", tagColor: "bg-cyan-500 text-black", webOnly: true },
    { id: "account", title: "MY ACCOUNT", subtitle: "Profile & Settings", description: "Saved results, preferences, subscription", Icon: User, page: "MyAccount", tag: null },
    { id: "thenews", title: "THE NEWS", subtitle: "Latest Updates", description: "Sports betting briefs & news", Icon: Newspaper, page: "TopStats", tag: "FREE", tagColor: "bg-slate-500 text-white" },
    { id: "topten", title: "TOP TEN", subtitle: "Rankings", description: "Top players & team standings", Icon: BarChart2, page: "TopTen", tag: "NEW", tagColor: "bg-blue-500 text-white" },
    { id: "pricing", title: "PRICING", subtitle: "Unlock Full Power", description: "View plans and upgrade your account", Icon: Gem, page: "Pricing", tag: "BEST VALUE", tagColor: "bg-purple-500 text-white" },
];

const DashboardContent = ({ menuItems, isAdmin }) => {
    return (
        <div className="w-full">
            <div className="mb-8"><LiveMarketTicker /></div>
                  <TodaysPredictions />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {menuItems.map((item, index) => {
                    const Icon = item.Icon;
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                        >
                            <Link to={createPageUrl(item.page)} className="block h-full group">
                                <Card className="h-full bg-slate-800/50 border border-slate-700 rounded-lg transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/80 glow-card">
                                    <CardContent className="relative p-6 flex flex-col h-full">
                                        {item.tag && (
                                            <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full ${item.tagColor}`}>{item.tag}</div>
                                        )}
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center border border-slate-600 flex-shrink-0 text-slate-300">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-bold text-white tracking-tight">{item.title}</h3>
                                                <p className="text-slate-400 text-xs font-medium">{item.subtitle}</p>
                                            </div>
                                        </div>
                                        <p className="text-slate-400 text-sm mt-auto group-hover:text-slate-300 transition-colors">{item.description}</p>
                                        <ChevronRight className="w-4 h-4 text-slate-600 transition-transform duration-300 absolute bottom-5 right-5 group-hover:translate-x-0.5 group-hover:text-slate-400" />
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    );
                })}

                {isAdmin && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + menuItems.length * 0.05 }}>
                        <Link to={createPageUrl("AdminPanel")} className="block h-full group">
                            <Card className="h-full bg-red-900/40 border border-red-700/80 rounded-lg transition-all duration-300 hover:border-red-600 hover:bg-red-900/60 glow-card">
                                <CardContent className="relative p-6 flex flex-col h-full">
                                     <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white`}>ADMIN</div>
                                     <div className="flex items-center gap-4 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center border border-slate-600 flex-shrink-0 text-slate-300">
                                            <Settings className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base font-bold text-white tracking-tight">ADMIN PANEL</h3>
                                            <p className="text-slate-400 text-xs font-medium">Manage App</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-sm mt-auto group-hover:text-slate-300 transition-colors">Administrative tools</p>
                                    <ChevronRight className="w-4 h-4 text-slate-600 transition-transform duration-300 absolute bottom-5 right-5 group-hover:translate-x-0.5 group-hover:text-slate-400" />
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                )}
            </div>
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
        queryFn: () => base44.auth.isAuthenticated().then(isAuth => isAuth ? base44.auth.me() : null),
    });

    const isAdmin = currentUser?.role === 'admin';
    const menuItems = (isNativeApp || isMobileScreen) ? allMenuItems.filter(item => !item.webOnly) : allMenuItems;

    if (!isNativeApp && !isMobileScreen) {
        return <DashboardContent menuItems={menuItems} isAdmin={isAdmin} />;
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {showSuccessMessage && (
                <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span className="font-bold">Payment successful!</span>
                </motion.div>
            )}

            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <DashboardContent menuItems={menuItems} isAdmin={isAdmin} />
            </div>
        </div>
    );
}