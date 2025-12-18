import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, CircleDot } from 'lucide-react';
import moment from 'moment';

const fetchScores = async () => {
    const { data } = await base44.functions.invoke('getLiveScores');
    if (!Array.isArray(data)) {
        if (data && data.error) throw new Error(data.error);
        return [];
    }
    return data;
};

const TeamLogo = ({ logoUrl, teamName }) => {
    const [logoError, setLogoError] = useState(false);

    if (logoUrl && !logoError) {
        return <img src={logoUrl} alt={`${teamName} logo`} className="w-5 h-5 object-contain" onError={() => setLogoError(true)} />;
    }
    
    const abbr = teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center font-bold text-[10px] text-gray-600 dark:text-gray-300 flex-shrink-0">
            {abbr}
        </div>
    );
};

const GameItem = ({ game }) => {
    const isLive = game.status && (game.status.includes(':') || (game.period && game.period > 0)) && game.status !== 'Final' && game.status !== 'FT' && game.status !== 'Finished';

    return (
        <div className="flex-shrink-0 flex items-center gap-4 px-4 border-r border-white/10 text-xs text-gray-300">
            <TeamLogo logoUrl={game.away_team_badge} teamName={game.away_team} />
            <div className="flex flex-col items-center">
                <span className="font-bold text-sm text-white">{game.away_team}</span>
                <span className="text-xl font-bold text-white">{game.away_score || 0}</span>
            </div>
            <div className="flex flex-col items-center text-center w-16">
                 {isLive ? (
                    <span className="font-bold text-red-400 animate-pulse">{game.time || 'LIVE'}</span>
                ) : (
                    <span className="text-gray-400">{game.status === 'Final' || game.status === 'FT' ? 'Final' : moment(game.commence_time).format('h:mm A')}</span>
                )}
            </div>
            <div className="flex flex-col items-center">
                <span className="font-bold text-sm text-white">{game.home_team}</span>
                <span className="text-xl font-bold text-white">{game.home_score || 0}</span>
            </div>
            <TeamLogo logoUrl={game.home_team_badge} teamName={game.home_team} />
        </div>
    );
};

const SportsTicker = () => {
    const { data: scores, isLoading, error } = useQuery({
        queryKey: ['liveScores'],
        queryFn: fetchScores,
        refetchInterval: 60 * 1000, // Refetch every 60 seconds
        staleTime: 55 * 1000, // Data is stale after 55 seconds
    });
    const scrollContainerRef = useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.offsetWidth * 0.9;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };
    
    if (isLoading && !scores) return (
        <div className="h-[92px] w-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 border-y border-gray-200 dark:border-slate-700">
            Loading Live Scores Ticker...
        </div>
    );

    if (error) return (
        <div className="h-[92px] w-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 flex items-center justify-center text-sm p-4 text-center border-y border-red-200 dark:border-red-800/50">
           Could not load live scores: {error.message}
        </div>
    );
    
    if (!scores || scores.length === 0) {
        return (
            <div className="h-[92px] w-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 border-y border-gray-200 dark:border-slate-700">
                No live or upcoming games for today.
            </div>
        );
    }

    return (
            <div className="w-full bg-gray-100 dark:bg-gray-800/10 border-y border-gray-200/10 shadow-sm relative group my-6">
                <div className="max-w-screen-3xl mx-auto flex items-center h-12">
                    <button 
                        onClick={() => scroll('left')}
                        className="h-full px-2 flex items-center justify-center bg-gradient-to-r from-[#0d1224] to-transparent hover:bg-slate-800/50 transition-colors z-10 opacity-0 group-hover:opacity-100 absolute left-0"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>

                    <div ref={scrollContainerRef} className="flex overflow-x-auto scrollbar-hide h-full items-center">
                        {scores.map((game) => (
                            <GameItem key={game.id} game={game} />
                        ))}
                    </div>

                    <button 
                        onClick={() => scroll('right')}
                        className="h-full px-2 flex items-center justify-center bg-gradient-to-l from-[#0d1224] to-transparent hover:bg-slate-800/50 transition-colors z-10 opacity-0 group-hover:opacity-100 absolute right-0"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>
        );
};

export default SportsTicker;