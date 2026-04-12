import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LogOut,
  Crown,
  LayoutGrid,
  LogIn,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

import FuturisticButton from "@/components/ui/FuturisticButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DomainChangeBanner from "../DomainChangeBanner";
import AgeGate from "../auth/AgeGate";

export default function MobileLayout({ children, currentPageName }) {

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        return await base44.auth.me();
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!currentUser;
  const isLegacy = currentUser?.subscription_type === 'legacy';
  const isVIP = currentUser?.subscription_type === 'vip_annual';
  const isPremium = currentUser?.subscription_type === 'premium_monthly';

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await base44.auth.logout();
      window.location.href = createPageUrl("Dashboard");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
      window.location.href = createPageUrl("Dashboard");
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  // Stadium background component for consistent styling
  const StadiumBackground = () => (
    <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
  );

  return (
    <div className="min-h-screen relative flex flex-col">
      <StadiumBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <DomainChangeBanner />
        <AgeGate />

        {/* Fixed Header - 56px height, respects iOS safe area */}
        <div className="fixed top-0 left-0 right-0 z-40">
          <header className="relative bg-slate-900/95 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="flex items-center justify-between h-14 px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                    alt="SWH Logo"
                    className="w-10 h-10 rounded-lg object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  <span className="hidden sm:inline text-lg font-bold text-white">
                    Sports Wager Helper
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                {userLoading ? (
                  <div className="w-9 h-9 rounded-full bg-slate-700 animate-pulse" />
                ) : isAuthenticated ? (
                  <>
                    {/* Subscription badges with futuristic glow */}
                    {isLegacy && (
                      <motion.div 
                        className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-full border border-yellow-500/50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)',
                          boxShadow: '0 0 15px rgba(234, 179, 8, 0.3)'
                        }}
                        animate={{ boxShadow: ['0 0 10px rgba(234, 179, 8, 0.3)', '0 0 20px rgba(234, 179, 8, 0.5)', '0 0 10px rgba(234, 179, 8, 0.3)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Crown className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-400">LEGACY</span>
                      </motion.div>
                    )}
                    {isVIP && (
                      <motion.div 
                        className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-full border border-purple-500/50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                          boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)'
                        }}
                        animate={{ boxShadow: ['0 0 10px rgba(168, 85, 247, 0.3)', '0 0 20px rgba(168, 85, 247, 0.5)', '0 0 10px rgba(168, 85, 247, 0.3)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Crown className="w-3 h-3 text-purple-400" />
                        <span className="text-xs font-bold text-purple-400">VIP</span>
                      </motion.div>
                    )}
                    {isPremium && (
                      <motion.div 
                        className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-full border border-cyan-500/50"
                        style={{
                          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                          boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)'
                        }}
                      >
                        <Crown className="w-3 h-3 text-cyan-400" />
                        <span className="text-xs font-bold text-cyan-400">PRO</span>
                      </motion.div>
                    )}
                    
                    {/* User Avatar with glow */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-md" />
                      <Avatar className="relative w-9 h-9 border border-purple-500/50">
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-600 text-white font-bold text-sm">
                          {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    {/* Logout Button - Futuristic style */}
                    <motion.button
                      onClick={handleLogout}
                      className="p-2 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 hover:border-red-500/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      whileTap={{ scale: 0.95 }}
                      title="Log out"
                    >
                      <LogOut className="w-5 h-5" />
                    </motion.button>
                  </>
                ) : (
                  /* Not Authenticated - Futuristic buttons */
                  <div className="flex items-center gap-2">
                    <FuturisticButton
                      onClick={handleLogin}
                      variant="ghost"
                      size="sm"
                      icon={<LogIn className="w-4 h-4" />}
                    >
                      <span className="hidden xs:inline">Log In</span>
                    </FuturisticButton>
                    <FuturisticButton 
                      to={createPageUrl('Pricing')}
                      variant="primary"
                      size="sm"
                      icon={<Zap className="w-4 h-4" />}
                    >
                      <span className="hidden xs:inline">Sign Up</span>
                    </FuturisticButton>
                  </div>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* Main Content - offset for header (56px) */}
        <main className="flex-1 overflow-y-auto" style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full">
            {children}
          </div>
        </main>

        {/* Floating Dashboard Button - Futuristic style */}
        {currentPageName !== 'Dashboard' && (
          <motion.div
            className="fixed right-4 z-[100]"
            style={{ bottom: `calc(1rem + env(safe-area-inset-bottom))` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Link
              to={createPageUrl("Dashboard")}
              className="relative block w-14 h-14"
              aria-label="Go to Dashboard"
            >
              {/* Glow effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-lime-500 to-cyan-500 rounded-full blur-md"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {/* Button */}
              <motion.div 
                className="relative w-full h-full bg-slate-900 rounded-full flex items-center justify-center border border-lime-500/50"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <LayoutGrid className="w-6 h-6 text-lime-400" />
              </motion.div>
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-lime-400 rounded-tl-full" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-lime-400 rounded-tr-full" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-lime-400 rounded-bl-full" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-lime-400 rounded-br-full" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}