import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Loader2, WifiOff, Clock } from 'lucide-react';

const TickerContent = ({ scores, isLoading, isError, showBadge = true }) => {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-slate-400 px-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading Live Scores...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center gap-2 text-red-400 px-4">
                <WifiOff className="w-4 h-4" />
                <span>Failed to load live scores.</span>
            </div>
        );
    }

    if (!scores || scores.length === 0) {
        return (
             <div className="flex items-center gap-2 text-slate-400 px-4">
                <Clock className="w-4 h-4" />
                <span>No live or upcoming games right now.</span>
            </div>
        );
    }

    return (
        <div className="flex items-center shrink-0 gap-1">
            {showBadge && (
                <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/50 rounded-full px-3 py-1 ml-4 mr-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-red-400 tracking-wide">LIVE</span>
                </div>
            )}
            {scores.map((game, index) => (
                <div key={`${game.id}-${index}`} className="flex items-center gap-3 px-4 mx-2 py-1.5 bg-white/5 rounded-lg border border-white/10 shrink-0">
                    <span className="font-semibold text-sm text-white">{game.home_team} vs {game.away_team}</span>
                    {game.status === 'Live' ? (
                        <span className="text-sm font-bold text-lime-400 bg-lime-500/20 px-2 py-0.5 rounded">{game.score}</span>
                    ) : (
                        <span className="text-sm font-medium text-cyan-400">{game.score}</span>
                    )}
                </div>
            ))}
        </div>
    );
};

export const LiveMarketTicker = () => {
    const { data: scores, isLoading, isError } = useQuery({
        queryKey: ['liveScores'],
        queryFn: () => base44.functions.invoke('getLiveScores').then(res => res.data),
        refetchInterval: 60000, // Refetch every 60 seconds
        staleTime: 30000, // Consider data fresh for 30 seconds
    });

    // Determine if we should render the marquee or a static message
    const showMarquee = !isLoading && !isError && scores && scores.length > 0;
    // Key to reset animation when content changes
    const contentKey = showMarquee ? scores.map(s => s.id + s.score).join(',') : 'static';

    return (
        <div className="bg-black/20 backdrop-blur-sm border-y border-white/10 py-3 overflow-hidden whitespace-nowrap relative">
            {showMarquee ? (
                <motion.div 
                    className="flex"
                    animate={{ x: [0, '-50%'] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: 'loop',
                            duration: 25,
                            ease: 'linear',
                        },
                    }}
                >
                    {/* Two copies for seamless loop - second copy has no LIVE badge */}
                    <div className="flex shrink-0">
                        <TickerContent scores={scores} isLoading={false} isError={false} showBadge={true} />
                    </div>
                    <div className="flex shrink-0">
                        <TickerContent scores={scores} isLoading={false} isError={false} showBadge={false} />
                    </div>
                </motion.div>
            ) : (
                <div className="w-full flex justify-center">
                  <TickerContent scores={scores} isLoading={isLoading} isError={isError} />
                </div>
            )}
        </div>
    );
};