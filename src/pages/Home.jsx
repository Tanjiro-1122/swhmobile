import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Search, Loader2, Info, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedAIGraphic from '@/components/home/AnimatedAIGraphic';
import DailyFreePicks from '@/components/home/DailyFreePicks';
import WalkingRobot from '@/components/home/WalkingRobot';
import PlatformBenefits from '@/components/home/PlatformBenefits';

// --- Free Search Logic ---
const useFreeLookups = () => {
    const MAX_FREE_LOOKUPS = 5;
    const LOOKUP_KEY = 'freeLookupsCount';
    const [lookups, setLookups] = useState(0);

    useEffect(() => {
        const storedLookups = parseInt(localStorage.getItem(LOOKUP_KEY) || '0', 10);
        setLookups(storedLookups);
    }, []);

    const incrementLookups = useCallback(() => {
        const currentCount = parseInt(localStorage.getItem(LOOKUP_KEY) || '0', 10);
        if (currentCount < MAX_FREE_LOOKUPS) {
            const newCount = currentCount + 1;
            localStorage.setItem(LOOKUP_KEY, newCount.toString());
            setLookups(newCount);
            return true;
        }
        setLookups(MAX_FREE_LOOKUPS);
        return false;
    }, []);

    const remainingLookups = Math.max(0, MAX_FREE_LOOKUPS - lookups);
    const isBlocked = remainingLookups <= 0;

    return { remainingLookups, isBlocked, incrementLookups };
};

const SearchResults = ({ data, type }) => {
    if (!data || data.length === 0) {
        return <div className="text-center text-slate-400 py-8">No results found.</div>;
    }

    return (
        <div className="space-y-3 mt-4">
            {data.map(item => (
                <Card key={item.id} className="bg-slate-800/50 border border-slate-700">
                    <CardContent className="p-4">
                        <h3 className="font-bold text-white">{type === 'player' ? item.player_name : item.team_name}</h3>
                        <p className="text-sm text-slate-300">{item.sport} - {type === 'player' ? item.team : item.league}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const FreeSearchView = () => {
    const [activeTab, setActiveTab] = useState('players');
    const [searchTerm, setSearchTerm] = useState('');
    const [query, setQuery] = useState('');
    const { remainingLookups, isBlocked, incrementLookups } = useFreeLookups();
    
    const { data, isLoading, isFetching, refetch, isError } = useQuery({
        queryKey: ['freeSearch', activeTab, query],
        queryFn: async () => {
            if (!query) return null;
            if (isBlocked) return { blocked: true };

            if (incrementLookups()) {
                const entity = activeTab === 'players' ? 'PlayerStats' : 'TeamStats';
                const filterField = activeTab === 'players' ? 'player_name' : 'team_name';
                
                try {
                    const results = await base44.entities[entity].filter({
                        [filterField]: { $ilike: `%${query}%` }
                    }, '-updated_date', 5);
                    return results;
                } catch (error) {
                    console.error("Search failed:", error);
                    return { error: true };
                }
            }
            return { blocked: true };
        },
        enabled: false,
        refetchOnWindowFocus: false,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim() && !isBlocked) {
            setQuery(searchTerm);
            setTimeout(() => refetch(), 0);
        }
    };

    if (isBlocked || data?.blocked) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center bg-slate-800/50 border border-purple-500/30 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-white mb-2">Aww, you're all done now!</h3>
                <p className="text-slate-300 mb-6">Click "Get Started" to unlock unlimited searches and a world of AI difference.</p>
                <Button asChild size="lg" className="bg-lime-400 text-slate-900 font-bold hover:bg-lime-300 rounded-full px-8">
                    <Link to={createPageUrl('Pricing')}>
                        Get Started
                    </Link>
                </Button>
            </motion.div>
        );
    }

    return (
        <Card className="bg-slate-900/70 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Player & Team Stats</CardTitle>
                    <div className="text-sm font-medium text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
                        <span className="font-bold text-lime-400">{remainingLookups}</span> of 5 free searches left
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(tab) => { setSearchTerm(''); setQuery(''); setActiveTab(tab); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                        <TabsTrigger value="players"><Users className="w-4 h-4 mr-2"/>Players</TabsTrigger>
                        <TabsTrigger value="teams"><Shield className="w-4 h-4 mr-2"/>Teams</TabsTrigger>
                    </TabsList>
                    <form onSubmit={handleSearch} className="flex gap-2 mt-4">
                        <Input 
                            type="text"
                            placeholder={`Search for a ${activeTab.slice(0, -1)}...`}
                            className="bg-slate-800 border-slate-700 text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button type="submit" disabled={isFetching || !searchTerm.trim()}>
                            {isFetching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                        </Button>
                    </form>
                    <div className="mt-4 min-h-[200px]">
                        {isFetching ? (
                            <div className="flex justify-center items-center h-full pt-10">
                                <Loader2 className="w-8 h-8 animate-spin text-lime-400"/>
                            </div>
                        ) : data && Array.isArray(data) ? (
                           <SearchResults data={data} type={activeTab === 'players' ? 'player' : 'team'} />
                        ) : (
                             <div className="text-center text-slate-400 py-8 flex flex-col items-center gap-2">
                                <Info className="w-8 h-8 text-slate-500" />
                                <p>Search for a player or team to see AI-powered stats.</p>
                             </div>
                        )}
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};

// --- New Hero Section Components ---
const HeroSection = () => (
    <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
        >
            <span className="inline-block bg-lime-400/10 text-lime-300 text-sm font-medium px-4 py-1.5 rounded-full mb-4 border border-lime-400/20">
                Revolutionizing Sports Betting Analysis
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-6">
                The Future
                <br />
                of <span className="text-lime-400">Winning</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 mb-8">
                Powered by advanced neural networks, SportWagerHelper transforms chaotic data into precise betting opportunities.
            </p>

            <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                 <div className="flex -space-x-2 overflow-hidden">
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-800" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Bettor 1" />
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-800" src="https://images.unsplash.com/photo-1531746020798-1b1580858f91?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Bettor 2" />
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-800" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Bettor 3" />
                 </div>
                 <p className="text-sm text-slate-400"><span className="font-bold text-white">15,000+</span> Smart Money Bettors</p>
            </div>

            {/* App Store Download Links */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a 
                    href="https://apps.apple.com/us/app/sports-wager-helper/id6755343785" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-105"
                >
                    <img 
                        src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                        alt="Download on the App Store" 
                        className="h-12"
                    />
                </a>
                <a 
                    href="https://play.google.com/store/apps/details?id=com.wnapp.id1761803023263&hl=en_US" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-105"
                >
                    <img 
                        src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                        alt="Get it on Google Play" 
                        className="h-[72px] -my-3"
                    />
                </a>
            </div>
        </motion.div>
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
            <AnimatedAIGraphic />
        </motion.div>
    </div>
);

// --- Main Home Page ---
export default function Home() {
    const navigate = useNavigate();
    
    const { data: user, isLoading: isAuthLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.isAuthenticated().then(isAuth => isAuth ? base44.auth.me() : null),
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (!isAuthLoading && user) {
            // Use React Router navigation instead of window.location for smoother transition
            navigate(createPageUrl('Dashboard'), { replace: true });
        }
    }, [user, isAuthLoading, navigate]);

    if (isAuthLoading || user) {
        return (
            <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-lime-400 animate-spin" />
            </div>
        );
    }
    
    // User is not authenticated, show the free search home page.
    // Note: TopBar is rendered by WebLayout, so we don't need a header here
    return (
                  <div className="min-h-screen text-white overflow-x-hidden">
                      <div className="absolute inset-0 bg-grid-dark -z-10"></div>
                      <WalkingRobot />
            
            <main className="max-w-7xl mx-auto px-6 pt-8 lg:pt-16 pb-16">
                <section className="mb-20 lg:mb-28">
                    <HeroSection />
                </section>
                
                {/* Daily Free AI Picks - Always visible */}
                <section className="mb-16">
                    <DailyFreePicks />
                </section>

                <section id="free-search" className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
                           Try Five Free Searches On Us
                        </h2>
                        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                            Get a glimpse of our powerful AI by searching for your favorite players and teams. After 5 lookups, you'll need to subscribe to continue.
                        </p>
                    </div>
                    <div className="max-w-3xl mx-auto">
                        <FreeSearchView />
                    </div>
                </section>
                
                {/* Platform Benefits Section */}
                <PlatformBenefits />
                
                {/* Footer for Home page */}
                <footer className="border-t border-slate-800 pt-8 mt-16">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                        <p>© {new Date().getFullYear()} SportWagerHelper. All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-white transition-colors">Privacy</Link>
                            <Link to={createPageUrl('TermsOfService')} className="hover:text-white transition-colors">Terms</Link>
                            <Link to={createPageUrl('ContactUs')} className="hover:text-white transition-colors">Contact</Link>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}