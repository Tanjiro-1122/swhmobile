import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Flame, Calendar, BarChart2 } from 'lucide-react';
import moment from 'moment';

const fetchScores = async () => {
    const { data } = await base44.functions.invoke('getLiveScores');
    if (!Array.isArray(data)) {
        // If the function returns an error object, throw it
        if (data && data.error) throw new Error(data.error);
        return [];
    }
    return data;
};

const SportLogo = ({ sportKey }) => {
    const logos = {
        americanfootball_nfl: '🏈',
        basketball_nba: '🏀',
        baseball_mlb: '⚾️',
        icehockey_nhl: '🏒',
    };
    return <span className="text-lg">{logos[sportKey] || '🏆'}</span>;
};

const TickerItem = ({ game }) => {
    const isLive = game.completed === false && moment.utc(game.commence_time).isBefore(moment.utc());
    const isFinal = game.completed === true;
    const isUpcoming = !isLive && !isFinal;

    const homeScore = game.scores?.find(s => s.name === game.home_team)?.score || '0';
    const awayScore = game.scores?.find(s => s.name === game.away_team)?.score || '0';

    return (
        <div className="flex-shrink-0 w-72 h-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 flex flex-col justify-between text-white shadow-lg mx-2">
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                    <SportLogo sportKey={game.sport_key} />
                    <span className="truncate max-w-[120px]">{game.sport_title}</span>
                </div>
                {isLive && <div className="flex items-center gap-1.5 text-red-500 animate-pulse"><Flame size={14} /> LIVE</div>}
                {isFinal && <div className="text-slate-400">FINAL</div>}
                {isUpcoming && <div className="text-cyan-400">{moment(game.commence_time).fromNow()}</div>}
            </div>
            
            <div className="my-2 space-y-1 text-sm">
                <div className="flex justify-between items-center">
                    <span className="font-bold truncate max-w-[180px]">{game.away_team}</span>
                    <span className="font-black text-lg">{awayScore}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-bold truncate max-w-[180px]">{game.home_team}</span>
                    <span className="font-black text-lg">{homeScore}</span>
                </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between mt-auto">
                 <div className="flex items-center gap-1"><Calendar size={12}/> {moment(game.commence_time).format('MMM D, h:mm a')}</div>
                 <BarChart2 size={14} className="text-slate-600 hover:text-cyan-400 cursor-pointer" title="View match stats"/>
            </div>
        </div>
    );
};


const SportsTicker = () => {
    const { data: scores, isLoading, error } = useQuery({
        queryKey: ['liveScores'],
        queryFn: fetchScores,
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
        staleTime: 4 * 60 * 1000,
    });

    const tickerVariants = {
        animate: {
            x: ['0%', '-100%'],
            transition: {
                x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: (scores?.length || 0) * 8, // Adjust duration based on number of items
                    ease: "linear",
                },
            },
        },
    };

    if (isLoading) return (
        <div className="h-28 w-full bg-slate-900/80 flex items-center justify-center text-slate-400">
            Loading Live Scores...
        </div>
    );

    if (error) return (
        <div className="h-28 w-full bg-red-900/50 text-red-300 flex items-center justify-center text-sm p-2">
            Error loading scores: {error.message}
        </div>
    );

    if (!scores || scores.length === 0) return null; // Don't render if there's nothing to show

    return (
        <div className="w-full h-28 bg-slate-900/80 overflow-hidden relative border-y border-slate-800/50">
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-900 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-900 to-transparent z-10" />

            <motion.div
                className="h-full flex items-center absolute top-0 left-0"
                variants={tickerVariants}
                animate="animate"
            >
                {/* Render the list of items twice for a seamless loop */}
                <div className="flex h-full items-center">
                    {scores.map((game, index) => <TickerItem key={`${game.id}-${index}`} game={game} />)}
                </div>
                <div className="flex h-full items-center">
                    {scores.map((game, index) => <TickerItem key={`${game.id}-clone-${index}`} game={game} />)}
                </div>
            </motion.div>
        </div>
    );
};

export default SportsTicker;