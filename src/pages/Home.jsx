import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Search, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

// Hook to manage free lookups
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
            if (!query || isBlocked) return null;

            if (incrementLookups()) {
                const entity = activeTab === 'players' ? 'PlayerStats' : 'TeamStats';
                const filterField = activeTab === 'players' ? 'player_name' : 'team_name';
                
                return await base44.entities[entity].list({
                    [filterField]: { $ilike: `%${query}%` }
                }, '-updated_date', 5);
            }
            return { blocked: true };
        },
        enabled: false,
        refetchOnWindowFocus: false,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setQuery(searchTerm);
            setTimeout(() => refetch(), 0);
        }
    };

    if (isBlocked || data?.blocked) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center bg-slate-800/50 border border-purple-500/30 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-white mb-2">Aww, you're all done now!</h3>
                <p className="text-slate-300 mb-6">But click get started and discover a world of AI difference.</p>
                <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg">
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
                    <CardTitle className="text-white">Free Search</CardTitle>
                    <div className="text-sm font-medium text-slate-300">
                        <span className="font-bold text-green-400">{remainingLookups}</span> of 5 searches remaining
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
                                <Loader2 className="w-8 h-8 animate-spin text-purple-400"/>
                            </div>
                        ) : data ? (
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

export default function Home() {
    const { data: user, isLoading: isAuthLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.isAuthenticated().then(isAuth => isAuth ? base44.auth.me() : null),
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (!isAuthLoading && user) {
            // Using replace to avoid breaking back button after login
            window.history.replaceState({}, '', createPageUrl('Dashboard'));
            window.location.reload();
        }
    }, [user, isAuthLoading]);

    if (isAuthLoading || user) {
        return (
            <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            </div>
        );
    }
    
    // User is not authenticated, show the free search home page.
    return (
        <div className="min-h-screen bg-slate-900 bg-grid-dark text-white p-4 sm:p-6 lg:p-8">
             <div className="absolute inset-0 aurora-background -z-10"></div>
            <div className="max-w-3xl mx-auto">
                <div className="text-center my-12">
                    <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                        alt="SWH Logo"
                        className="w-24 h-24 rounded-3xl object-cover mx-auto mb-6 shadow-2xl border-2 border-slate-700 animate-float"
                    />
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
                        Try five searches free on us.
                    </h1>
                    <p className="text-lg text-slate-300 max-w-xl mx-auto">
                        Get a glimpse of our powerful AI by searching for your favorite players and teams.
                    </p>
                </div>

                <FreeSearchView />
            </div>
        </div>
    );
}