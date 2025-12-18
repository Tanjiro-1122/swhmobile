import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
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
        { name: 'Analysis', page: 'AnalysisHub' },
        { name: 'Predictions', page: 'DailyBriefs' },
        { name: 'Pricing', page: 'Pricing' },
        { name: 'Dashboard', page: 'Dashboard' },
    ];
    
    if (isNativeApp) return null;

    const handleLogin = () => base44.auth.redirectToLogin(window.location.href);
    const handleLogout = () => base44.auth.logout('/');


    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-white/10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                        <Bot className="w-8 h-8 text-[hsl(var(--brand-accent))]" />
                        <span className="text-xl font-bold text-white">BettingAI</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <Link
                                key={link.name}
                                to={createPageUrl(link.page)}
                                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4">
                        {user ? (
                             <Button onClick={handleLogout} variant="ghost" className="hidden md:inline-flex text-white/80 hover:text-white hover:bg-white/10">
                                Log Out
                            </Button>
                        ) : (
                            <Button onClick={handleLogin} variant="ghost" className="hidden md:inline-flex text-white/80 hover:text-white hover:bg-white/10">
                                Log In
                            </Button>
                        )}
                        <Button asChild className="bg-[hsl(var(--brand-accent))] text-black font-bold hover:bg-[hsl(var(--brand-accent)/0.9)]">
                           <Link to={createPageUrl('Pricing')}>Get Started</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;