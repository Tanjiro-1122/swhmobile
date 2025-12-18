import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { LogOut, Crown, Mail, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DomainChangeBanner from '../DomainChangeBanner';
import AgeGate from '../auth/AgeGate';
import WebSidebar from '../navigation/WebSidebar';

export default function WebLayout({ children, currentPageName }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  React.useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);
  
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.isAuthenticated().then(isAuth => isAuth ? base44.auth.me() : null),
  });

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      setIsAuthenticated(false);
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
    if (currentUser?.subscription_type === 'legacy') return { label: 'LEGACY', color: 'bg-yellow-500' };
    if (currentUser?.subscription_type === 'vip_annual') return { label: 'VIP', color: 'bg-purple-500' };
    if (currentUser?.subscription_type === 'premium_monthly') return { label: 'PREMIUM', color: 'bg-blue-500' };
    return { label: 'FREE', color: 'bg-gray-500' };
  };

  const subscription = getSubscriptionBadge();

  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="h-screen w-screen flex bg-slate-900 text-white overflow-hidden">
      <WebSidebar currentPageName={currentPageName} />
      <div className="flex-1 flex flex-col">
        <header className="h-16 flex-shrink-0 bg-slate-800/50 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold">{currentPageName}</h1>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <div className={`hidden sm:flex items-center gap-2 ${subscription.color} px-3 py-1.5 rounded-full`}>
                  <Crown className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold text-white">{subscription.label}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                          {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:flex flex-col items-start">
                        <span className="font-semibold text-sm">{currentUser.full_name || currentUser.email}</span>
                        <span className="text-xs text-slate-400">View Profile</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="mr-4 bg-slate-800 border-slate-700 text-white">
                    <DropdownMenuItem 
                        onSelect={() => window.location.href = createPageUrl('MyAccount')}
                        className="hover:bg-slate-700 cursor-pointer"
                    >My Account</DropdownMenuItem>
                    <DropdownMenuItem 
                        onSelect={handleLogout}
                        className="text-red-400 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-6"
              >
                <Mail className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <AgeGate />
          <DomainChangeBanner />
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}