import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FuturisticButton from '@/components/ui/FuturisticButton';
import { usePlatform } from '@/components/hooks/usePlatform';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Menu, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const TopBar = () => {
    const { isNativeApp } = usePlatform();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    
    const { data: user } = useQuery({
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
            { name: 'S.A.L. The Detective', page: 'AskSAL' },
            { name: 'Analysis', page: 'AnalysisHub' },
            { name: 'Pricing', page: 'Pricing' },
          ]
        : [
            { name: 'Pricing', page: 'Pricing' },
            { name: 'Community', page: 'CommunityHub' },
          ];
    
    if (isNativeApp) return null;

    const handleLogin = () => {}; // sign-in handled by Splash / RequireAuth
    const handleLogout = () => base44.auth.logout('/');

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            {/* Futuristic gradient border */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-lime-500/50 to-transparent" />
            
            <div className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo with glow effect */}
                        <Link to={createPageUrl(user ? 'Dashboard' : 'Home')} className="flex items-center gap-3 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-lime-500/30 rounded-lg blur-md group-hover:bg-lime-500/50 transition-all" />
                                <img
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                                    alt="Sports Wager Helper"
                                    className="relative w-9 h-9 rounded-lg border border-lime-500/30"
                                />
                            </div>
                            <span className="text-xl font-bold text-white hidden sm:inline">
                                Sports Wager Helper
                            </span>
                        </Link>

                        {/* Navigation Links - Center (Desktop) */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.name}
                                    to={createPageUrl(link.page)}
                                    className="relative px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors group"
                                >
                                    <span className="relative z-10">{link.name}</span>
                                    {/* Hover background */}
                                    <span className="absolute inset-0 bg-slate-800/0 group-hover:bg-slate-800/80 rounded-lg transition-all" />
                                    {/* Bottom accent line */}
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-cyan-400 group-hover:w-3/4 transition-all duration-300" />
                                </Link>
                            ))}
                        </nav>

                        {/* Auth Buttons - Right (Desktop) */}
                        <div className="hidden md:flex items-center gap-3">
                            {user ? (
                                <FuturisticButton 
                                    onClick={handleLogout} 
                                    variant="ghost"
                                    size="sm"
                                >
                                    Log Out
                                </FuturisticButton>
                            ) : (
                                <>
                                    <FuturisticButton 
                                        onClick={handleLogin} 
                                        variant="ghost"
                                        size="sm"
                                    >
                                        Log In
                                    </FuturisticButton>
                                    <FuturisticButton 
                                        to={createPageUrl('Pricing')}
                                        variant="primary"
                                        size="sm"
                                        icon={<Zap className="w-4 h-4" />}
                                    >
                                        Get Started
                                    </FuturisticButton>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <motion.button 
                            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg border border-slate-700 hover:border-lime-500/50 transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            whileTap={{ scale: 0.95 }}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden bg-slate-900/98 backdrop-blur-xl border-b border-slate-800"
                >
                    <div className="container mx-auto px-4 py-4 space-y-2">
                        {navLinks.map((link, i) => (
                            <motion.div
                                key={link.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link
                                    to={createPageUrl(link.page)}
                                    className="block py-3 px-4 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-slate-800/50 border border-transparent hover:border-slate-700 transition-all"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            </motion.div>
                        ))}
                        <div className="pt-4 border-t border-slate-800 space-y-3">
                            {user ? (
                                <FuturisticButton 
                                    onClick={handleLogout} 
                                    variant="ghost"
                                    className="w-full"
                                >
                                    Log Out
                                </FuturisticButton>
                            ) : (
                                <>
                                    <FuturisticButton 
                                        onClick={handleLogin} 
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Log In
                                    </FuturisticButton>
                                    <FuturisticButton 
                                        to={createPageUrl('Pricing')}
                                        variant="primary"
                                        className="w-full"
                                        icon={<Zap className="w-4 h-4" />}
                                    >
                                        Get Started
                                    </FuturisticButton>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </header>
    );
};

export default TopBar;