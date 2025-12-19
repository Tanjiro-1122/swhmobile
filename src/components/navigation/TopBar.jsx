import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/components/hooks/usePlatform';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const TopBar = () => {
    const { isNativeApp } = usePlatform();
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me().catch(() => null),
    });

    const navLinks = [
        { name: 'Dashboard', page: 'Dashboard' },
        { name: 'Analysis', page: 'AnalysisHub' },
        { name: 'Pricing', page: 'Pricing' },
        { name: 'Community', page: 'CommunityHub' },
    ];
    
    if (isNativeApp) return null;

    const handleLogin = () => base44.auth.redirectToLogin(window.location.href);
    const handleLogout = () => base44.auth.logout('/');

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-white/10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to={createPageUrl(user ? 'Dashboard' : 'Home')} className="flex items-center gap-3">
                        <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                            alt="SportWagerHelper"
                            className="w-9 h-9 rounded-lg"
                        />
                        <span className="text-xl font-bold text-white">SportWagerHelper</span>
                    </Link>

                    {/* Navigation Links - Center */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <Link
                                key={link.name}
                                to={createPageUrl(link.page)}
                                className="text-sm font-medium text-white/70 hover:text-white transition-colors relative group"
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lime-400 group-hover:w-full transition-all duration-300" />
                            </Link>
                        ))}
                    </nav>

                    {/* Auth Buttons - Right */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <Button 
                                onClick={handleLogout} 
                                variant="ghost" 
                                className="hidden md:inline-flex text-white/80 hover:text-white hover:bg-white/10"
                            >
                                Log Out
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleLogin} 
                                variant="ghost" 
                                className="hidden md:inline-flex text-white/80 hover:text-white hover:bg-white/10"
                            >
                                Log In
                            </Button>
                        )}
                        <Button 
                            asChild 
                            className="bg-lime-400 text-slate-900 font-bold hover:bg-lime-300 rounded-full px-5"
                        >
                            <Link to={createPageUrl('Pricing')}>Get Started</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;