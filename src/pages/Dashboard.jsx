import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { usePlatform } from "@/components/hooks/usePlatform";

import { 
        ChevronRight, Settings, Check, Mail, Crown, LogOut 
      } from "lucide-react";
      
      import { Card, CardContent } from "@/components/ui/card";
      import { Button } from "@/components/ui/button";
      import { motion } from "framer-motion";
      import EmailLoginModal from "@/components/auth/EmailLoginModal";
      import ThemeToggle from "@/components/ThemeToggle";
      import TodaysPredictions from "@/components/predictions/TodaysPredictions";
      
      
      // Reusable Icon Components
      const FootballIcon = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><ellipse cx="50" cy="50" rx="45" ry="28" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M20 50 Q50 30 80 50 Q50 70 20 50" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="50" y1="22" x2="50" y2="78" stroke="currentColor" strokeWidth="2"/></svg>
      );
      const BasketballIcon = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M5 50 Q50 20 95 50" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M5 50 Q50 80 95 50" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="2"/></svg>
      );
      const BaseballIcon = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M25 15 Q35 50 25 85" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M75 15 Q65 50 75 85" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      );
      const SoccerIcon = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3"/><polygon points="50,20 65,35 60,55 40,55 35,35" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="50" y1="20" x2="50" y2="5" stroke="currentColor" strokeWidth="2"/><line x1="65" y1="35" x2="80" y2="25" stroke="currentColor" strokeWidth="2"/><line x1="35" y1="35" x2="20" y2="25" stroke="currentColor" strokeWidth="2"/></svg>
      );
      const HockeyIcon = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3"/><ellipse cx="50" cy="50" rx="20" ry="20" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="50" y1="5" x2="50" y2="30" stroke="currentColor" strokeWidth="2"/><line x1="50" y1="70" x2="50" y2="95" stroke="currentColor" strokeWidth="2"/></svg>
      );
      const TrophyIcon = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><path d="M30 20 L70 20 L65 55 Q50 70 35 55 Z" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="40" y="55" width="20" height="15" fill="none" stroke="currentColor" strokeWidth="2"/><rect x="35" y="70" width="30" height="10" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M30 20 Q10 25 15 45 Q20 50 30 45" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M70 20 Q90 25 85 45 Q80 50 70 45" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      );
      const FileTextIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
      );
      
      
      const allMenuItems = [
          { id: "analysis", title: "ANALYSIS HUB", subtitle: "AI-Powered Insights", description: "Match analysis, player stats, team insights", SportIcon: FootballIcon, page: "AnalysisHub", gradient: "from-purple-600 to-indigo-700", borderColor: "border-purple-400", tag: "MOST POPULAR", tagColor: "bg-yellow-500" },
          { id: "tracking", title: "TRACKING TOOLS", subtitle: "Track & Analyze", description: "Performance tracker, calculators, odds comparison", SportIcon: BasketballIcon, page: "BettingHub", gradient: "from-emerald-600 to-teal-700", borderColor: "border-emerald-400", tag: "WEB ONLY", tagColor: "bg-cyan-500", webOnly: true },
          { id: "community", title: "COMMUNITY", subtitle: "Learn & Connect", description: "Daily briefs, learning center, discussions", SportIcon: BaseballIcon, page: "CommunityHub", gradient: "from-orange-600 to-red-700", borderColor: "border-orange-400", tag: null },
          { id: "briefs", title: "DAILY BRIEFS", subtitle: "AI Market Insights", description: "Daily analysis, top picks, and news", SportIcon: FileTextIcon, page: "DailyBriefs", gradient: "from-slate-600 to-gray-700", borderColor: "border-slate-400", tag: "WEB ONLY", tagColor: "bg-cyan-500", webOnly: true },
          { id: "account", title: "MY ACCOUNT", subtitle: "Profile & Settings", description: "Saved results, preferences, subscription", SportIcon: SoccerIcon, page: "MyAccount", gradient: "from-blue-600 to-cyan-700", borderColor: "border-blue-400", tag: null },
          { id: "thenews", title: "THE NEWS", subtitle: "Latest Updates", description: "Sports betting briefs & news", SportIcon: TrophyIcon, page: "TopStats", gradient: "from-yellow-600 to-amber-700", borderColor: "border-yellow-400", tag: "FREE" },
          { id: "topten", title: "TOP TEN", subtitle: "Rankings", description: "Top players & team standings", SportIcon: TrophyIcon, page: "TopTen", gradient: "from-amber-600 to-orange-700", borderColor: "border-amber-400", tag: "NEW" },
          { id: "pricing", title: "PRICING", subtitle: "Unlock Full Power", description: "View plans and upgrade your account", SportIcon: HockeyIcon, page: "Pricing", gradient: "from-pink-600 to-rose-700", borderColor: "border-pink-400", tag: "BEST VALUE" },
      ];

// This is the content part of the dashboard, containing the menu grid.
const DashboardContent = ({ menuItems, isAdmin }) => {
    const [hoveredItem, setHoveredItem] = useState(null);

    return (
        <div className="w-full">
            <TodaysPredictions />
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                  {menuItems.map((item, index) => {
                                      const SportIcon = item.SportIcon;
                                      return (
                                          <motion.div
                                              key={item.id}
                                              initial={{ opacity: 0, y: 30 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ delay: 0.05 * index }}
                                          >
                                              <Link to={createPageUrl(item.page)} className="block h-full group">
                                                                                    <Card className="glow-card h-full bg-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:border-white/20 hover:scale-[1.02]">
                                                                                        <CardContent className="relative p-6 flex flex-col h-full">
                                                                                            {item.tag && (
                                                                                                <div className={`absolute top-4 right-4 ${item.tagColor} text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg`}>{item.tag}</div>
                                                                                            )}
                                                                                            <div className="flex items-start gap-4 mb-4">
                                                                                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 flex-shrink-0 text-indigo-300">
                                                                                                    <SportIcon className="w-7 h-7" />
                                                                                                </div>
                                                                                                <div className="flex-1">
                                                                                                    <h3 className="text-lg font-bold text-white tracking-tight">{item.title}</h3>
                                                                                                    <p className="text-indigo-200/80 font-medium text-sm">{item.subtitle}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                            <p className="text-white/60 text-sm mt-auto mb-4 group-hover:text-white/80 transition-colors">{item.description}</p>
                                                                                            <ChevronRight className="w-5 h-5 text-white/30 transition-transform duration-300 absolute bottom-5 right-5 group-hover:translate-x-1 group-hover:text-white/70" />
                                                                                        </CardContent>
                                                                                    </Card>
                                                                                </Link>
                                          </motion.div>
                                      );
                                  })}

                {isAdmin && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * menuItems.length }}>
                        <Link to={createPageUrl("AdminPanel")} className="block h-full">
                            <Card
                                className={`h-full relative overflow-hidden border-2 border-red-400 cursor-pointer transition-all duration-300 bg-black/60 backdrop-blur-sm ${hoveredItem === 'admin' ? 'scale-[1.03] shadow-2xl shadow-white/10' : 'shadow-xl'}`}
                                onMouseEnter={() => setHoveredItem('admin')}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-rose-700 opacity-80" />
                                <CardContent className="relative p-5 flex flex-col h-full">
                                    <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full">ADMIN</div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 transition-transform duration-300 text-white ${hoveredItem === 'admin' ? 'scale-110 rotate-6' : ''}`}>
                                            <Settings className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-black text-white tracking-wide">ADMIN PANEL</h3>
                                            <div className="text-white/80 font-semibold text-sm">Manage App</div>
                                        </div>
                                    </div>
                                    <p className="text-white/60 text-sm mt-auto">Administrative tools</p>
                                    <ChevronRight className={`w-6 h-6 text-white/40 transition-transform duration-300 absolute bottom-4 right-4 ${hoveredItem === 'admin' ? 'translate-x-1 text-white/70' : ''}`} />
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
};





// The main Dashboard component that decides what to render.
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

    // Web version doesn't need the background or special header, as the WebLayout provides it.
    // On desktop web, just show the content, as WebLayout provides the structure.
              if (!isNativeApp && !isMobileScreen) {
                  return <DashboardContent menuItems={menuItems} isAdmin={isAdmin} />;
              }

    // Native app and mobile web get the full-screen experience with its own background and header.
    return (
        <div className="min-h-screen relative overflow-y-auto">
            {showSuccessMessage && (
                <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span className="font-bold">Payment successful! Your subscription is now active.</span>
                </motion.div>
            )}

            <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 -z-10" />

            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                
                <DashboardContent menuItems={menuItems} isAdmin={isAdmin} />
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mt-10 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
                >
                    <div className="grid grid-cols-2 gap-6 text-center">
                         <div>
                            <h4 className="text-white/50 text-xs font-bold mb-3 uppercase">Support</h4>
                            <Link to={createPageUrl("ContactUs")} className="block text-white/70 hover:text-white text-sm">Contact Us</Link>
                        </div>
                        <div>
                            <h4 className="text-white/50 text-xs font-bold mb-3 uppercase">Legal</h4>
                             <Link to={createPageUrl("PrivacyPolicy")} className="block text-white/70 hover:text-white text-sm">Privacy Policy</Link>
                             <Link to={createPageUrl("TermsOfService")} className="block text-white/70 hover:text-white text-sm mt-2">Terms of Service</Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}