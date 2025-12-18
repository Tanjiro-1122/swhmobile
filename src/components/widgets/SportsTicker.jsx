import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, CircleDot } from 'lucide-react';
import moment from 'moment';

const fetchScores = async () => {
    const { data } = await base44.functions.invoke('getNbaLiveScores');
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
    const isLive = game.period > 0 && game.status !== 'Final';
    const isFinal = game.status === 'Final';
    const isUpcoming = !isLive && !isFinal;

    const homeScore = game.home_score;
    const awayScore = game.away_score;

    let statusComponent;
    if (isLive) {
        const liveStatus = game.period_detail || `Q${game.period} ${game.time}`;
        statusComponent = <div className="text-xs flex items-center gap-1 text-red-500 font-bold animate-pulse"><CircleDot className="w-2 h-2 fill-current" /><span>{liveStatus}</span></div>;
    } else if (isFinal) {
        statusComponent = <div className="text-xs font-bold text-gray-500 dark:text-gray-400">FINAL</div>;
    } else {
        statusComponent = <div className="text-xs text-gray-500 dark:text-gray-400">{game.status}</div>;
    }

    return (
        <div className="flex-shrink-0 w-[220px] border-r border-gray-200 dark:border-gray-700 p-3 flex flex-col justify-center text-sm hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{game.league}</span>
                {statusComponent}
            </div>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                        <TeamLogo logoUrl={game.away_team_badge} teamName={game.away_team} />
                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{game.away_team}</span>
                    </div>
                    {!isUpcoming && <span className="font-bold text-lg text-gray-900 dark:text-white">{awayScore}</span>}
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                        <TeamLogo logoUrl={game.home_team_badge} teamName={game.home_team} />
                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{game.home_team}</span>
                    </div>
                    {!isUpcoming && <span className="font-bold text-lg text-gray-900 dark:text-white">{homeScore}</span>}
                </div>
            </div>
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
        // Don't show anything if there are no scores to display
        return null;
    }

    return (
        <div className="w-full bg-gray-50 dark:bg-slate-800 border-y border-gray-200 dark:border-slate-700 shadow-sm relative group">
            <div className="max-w-screen-3xl mx-auto flex items-center h-[92px]">
                <button 
                    onClick={() => scroll('left')}
                    className="h-full px-2 flex items-center justify-center bg-gradient-to-r from-gray-50 to-transparent dark:from-slate-800 dark:to-transparent hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors z-10 opacity-0 group-hover:opacity-100 absolute left-0"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>

                <div ref={scrollContainerRef} className="flex overflow-x-auto scrollbar-hide h-full items-center">
                    {scores.map((game) => (
                        <GameItem key={game.id} game={game} />
                    ))}
                </div>

                <button 
                    onClick={() => scroll('right')}
                    className="h-full px-2 flex items-center justify-center bg-gradient-to-l from-gray-50 to-transparent dark:from-slate-800 dark:to-transparent hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors z-10 opacity-0 group-hover:opacity-100 absolute right-0"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
            </div>
        </div>
    );
};

export default SportsTicker;