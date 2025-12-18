import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Crown, Mail, ChevronDown, Menu, X, Settings, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { usePlatform } from '@/components/hooks/usePlatform';
import ThemeToggle from '@/components/ThemeToggle';

const navLinks = [
    { name: 'Dashboard', page: 'Dashboard', webOnly: false },
    { name: 'Analysis Hub', page: 'AnalysisHub', webOnly: false },
    { name: 'Betting Hub', page: 'BettingHub', webOnly: true },
    { name: 'Daily Briefs', page: 'DailyBriefs', webOnly: true },
    { name: 'Community', page: 'CommunityHub', webOnly: false },
    { name: 'Pricing', page: 'Pricing', webOnly: false },
];

export default function TopBar() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.isAuthenticated().then(isAuth => isAuth ? base44.auth.me() : null),
  });
  
  const { isNative } = usePlatform();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      window.location.href = createPageUrl("Dashboard");
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = createPageUrl("Dashboard");
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const getSubscriptionBadge = () => {
    if (currentUser?.subscription_type === 'legacy') return { label: 'LEGACY', color: 'bg-yellow-400 text-yellow-900', iconColor: 'text-yellow-700' };
    if (currentUser?.subscription_type === 'vip_annual') return { label: 'VIP', color: 'bg-purple-200 text-purple-900', iconColor: 'text-purple-600' };
    if (currentUser?.subscription_type === 'premium_monthly') return { label: 'PREMIUM', color: 'bg-blue-200 text-blue-900', iconColor: 'text-blue-600' };
    return { label: 'FREE', color: 'bg-gray-200 text-gray-800', iconColor: 'text-gray-500' };
  };

  const subscription = getSubscriptionBadge();

  const menuItems = isNative ? navLinks.filter(item => !item.webOnly) : navLinks;
  const isAdmin = currentUser?.role === 'admin';

  const NavLink = ({ page, name }) => {
    const pageUrl = createPageUrl(page);
    const isActive = location.pathname === pageUrl;
    return (
      <Link
        to={pageUrl}
        className={`relative text-sm font-semibold transition-colors duration-200 px-3 py-2 rounded-md ${isActive ? 'text-white' : 'text-slate-300 hover:text-white'}`}
      >
        {name}
        {isActive && (
          <motion.div 
            className="absolute bottom-[-1px] left-2 right-2 h-0.5 bg-purple-500"
            layoutId="active-nav-link"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        )}
      </Link>
    );
  };
  
  const MobileNavLink = ({ page, name }) => {
    const pageUrl = createPageUrl(page);
    const isActive = location.pathname === pageUrl;
    return (
      <Link
        to={pageUrl}
        className={`block text-base font-semibold transition-colors duration-200 px-4 py-3 rounded-md ${isActive ? 'text-white bg-purple-600' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {name}
      </Link>
    );
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-4 sm:px-6 z-40"
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png" alt="SWH Logo" className="w-10 h-10 rounded-lg" />
            <span className="hidden sm:inline text-lg font-bold text-white tracking-tight">Sports Wager Helper</span>
          </Link>
        </div>

        <LayoutGroup>
          <nav className="hidden lg:flex items-center gap-2">
            {menuItems.map(link => <NavLink key={link.page} {...link} />)}
            <Link to={createPageUrl('AIAssistant')} className="text-sm font-semibold transition-colors duration-200 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2">
              <Bot size={16} /> AI Assistant
            </Link>
          </nav>
        </LayoutGroup>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/10 p-1.5 rounded-full">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                      {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="font-semibold text-sm text-white">{currentUser.full_name?.split(' ')[0] || currentUser.email}</span>
                    <div className={`flex items-center gap-1.5 ${subscription.iconColor}`}>
                      <Crown className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{subscription.label}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mr-4 bg-slate-800/90 backdrop-blur-lg border-slate-700 text-white mt-2">
                <DropdownMenuItem asChild>
                    <Link to={createPageUrl('MyAccount')} className="cursor-pointer">My Account</Link>
                </DropdownMenuItem>
                {isAdmin && (
                    <DropdownMenuItem asChild>
                        <Link to={createPageUrl('AdminPanel')} className="cursor-pointer flex items-center gap-2"><Settings size={14}/> Admin Panel</Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem onSelect={handleLogout} className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleLogin} size="sm" className="hidden lg:flex bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-4 rounded-full">
              <Mail className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
          <div className="lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="text-white">
              <Menu />
            </Button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-72 bg-slate-900 border-l border-slate-700 p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-lg text-white">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                  <X />
                </Button>
              </div>
              <nav className="flex flex-col gap-2">
                {menuItems.map(link => <MobileNavLink key={link.page} {...link} />)}
                <MobileNavLink page="AIAssistant" name="AI Assistant" />
                {!currentUser && (
                    <Button onClick={handleLogin} size="lg" className="mt-6 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg">
                      <Mail className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}