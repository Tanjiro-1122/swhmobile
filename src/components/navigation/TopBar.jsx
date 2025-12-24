import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/components/hooks/usePlatform';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Menu, X } from 'lucide-react';

const TopBar = () => {
    const { isNativeApp } = usePlatform();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    
    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const isAuth = await base44.auth.isAuthenticated();
            if (!isAuth) return null;
            return base44.auth.me();
        },
        staleTime: 5 * 60 * 1000,
    });

    // Different nav links based on auth status
    const navLinks = user 
        ? [
            { name: 'Dashboard', page: 'Dashboard' },
            { name: 'AI Assistant', page: 'AIAssistant' },
            { name: 'Analysis', page: 'AnalysisHub' },
            { name: 'Pricing', page: 'Pricing' },
          ]
        : [
            { name: 'Pricing', page: 'Pricing' },
            { name: 'Community', page: 'CommunityHub' },
          ];
    
    if (isNativeApp) return null;

    const handleLogin = () => base44.auth.redirectToLogin(window.location.href);
    const handleLogout = () => base44.auth.logout('/');

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to={createPageUrl(user ? 'Dashboard' : 'Home')} className="flex items-center gap-3">
                        <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                            alt="Sports Wager Helper"
                            className="w-9 h-9 rounded-lg"
                        />
                        <span className="text-xl font-bold text-white hidden sm:inline">Sports Wager Helper</span>
                    </Link>

                    {/* Navigation Links - Center (Desktop) */}
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

                    {/* Auth Buttons - Right (Desktop) */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <Button 
                                onClick={handleLogout} 
                                variant="ghost" 
                                className="text-white/80 hover:text-white hover:bg-white/10"
                            >
                                Log Out
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    onClick={handleLogin} 
                                    variant="ghost" 
                                    className="text-white/80 hover:text-white hover:bg-white/10"
                                >
                                    Log In
                                </Button>
                                <Button 
                                    asChild 
                                    className="bg-lime-400 text-slate-900 font-bold hover:bg-lime-300 rounded-full px-5"
                                >
                                    <Link to={createPageUrl('Pricing')}>Get Started</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button 
                        className="md:hidden p-2 text-white/80 hover:text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/5">
                    <div className="container mx-auto px-4 py-4 space-y-3">
                        {navLinks.map(link => (
                            <Link
                                key={link.name}
                                to={createPageUrl(link.page)}
                                className="block py-2 text-white/80 hover:text-white font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-3 border-t border-white/10 space-y-2">
                            {user ? (
                                <Button 
                                    onClick={handleLogout} 
                                    variant="ghost" 
                                    className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                                >
                                    Log Out
                                </Button>
                            ) : (
                                <>
                                    <Button 
                                        onClick={handleLogin} 
                                        variant="ghost" 
                                        className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                                    >
                                        Log In
                                    </Button>
                                    <Button 
                                        asChild 
                                        className="w-full bg-lime-400 text-slate-900 font-bold hover:bg-lime-300 rounded-full"
                                    >
                                        <Link to={createPageUrl('Pricing')}>Get Started</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default TopBar;