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
        <div className="flex items-center shrink-0">
            {showBadge && <Badge variant="destructive" className="text-sm font-bold flex-shrink-0 animate-pulse ml-6">LIVE</Badge>}
            {scores.map((game, index) => (
                <div key={`${game.id}-${index}`} className="flex items-center gap-4 px-6 border-l border-white/10 shrink-0">
                    <span className="font-bold text-sm tracking-tight text-slate-100">{game.home_team} vs {game.away_team}</span>
                    {game.status === 'Live' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-green-400 animate-pulse">{game.score}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">{game.score}</span>
                        </div>
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
                <div 
                    className="flex"
                    style={{
                        animation: 'marquee 30s linear infinite',
                    }}
                >
                    {/* Two copies for seamless loop - second copy has no LIVE badge */}
                    <div className="flex shrink-0">
                        <TickerContent scores={scores} isLoading={false} isError={false} showBadge={true} />
                    </div>
                    <div className="flex shrink-0">
                        <TickerContent scores={scores} isLoading={false} isError={false} showBadge={false} />
                    </div>
                </div>
            ) : (
                <div className="w-full flex justify-center">
                  <TickerContent scores={scores} isLoading={isLoading} isError={isError} />
                </div>
            )}
        </div>
    );
};