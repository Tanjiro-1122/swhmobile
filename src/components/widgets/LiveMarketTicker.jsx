import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, WifiOff, Clock, Gauge } from 'lucide-react';
import Marquee from 'react-fast-marquee';

const ScoreItem = ({ game }) => (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-lg border border-white/10 flex-shrink-0 mx-3">
        <span className="font-semibold text-sm text-white whitespace-nowrap">
            {game.home_team} vs {game.away_team}
        </span>
        {game.status === 'Live' ? (
            <span className="text-sm font-bold text-lime-400 bg-lime-500/20 px-2 py-0.5 rounded">
                {game.score}
            </span>
        ) : (
            <span className="text-sm font-medium text-cyan-400">{game.score}</span>
        )}
    </div>
);

const LiveBadge = () => (
    <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/50 rounded-full px-3 py-1 flex-shrink-0 mx-3">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs font-bold text-red-400 tracking-wide">LIVE</span>
    </div>
);

// Speed in pixels per second - lower = slower
const SPEED_OPTIONS = [
    { label: 'Slow', speed: 15 },
    { label: 'Medium', speed: 50 },
    { label: 'Fast', speed: 100 },
];

export const LiveMarketTicker = () => {
    const [speedIndex, setSpeedIndex] = useState(0); // Start with Slow
    const currentSpeed = SPEED_OPTIONS[speedIndex];

    const cycleSpeed = () => {
        setSpeedIndex((prev) => (prev + 1) % SPEED_OPTIONS.length);
    };

    const { data: scores, isLoading, isError } = useQuery({
        queryKey: ['liveScores'],
        queryFn: () => base44.functions.invoke('getLiveScores').then(res => res.data),
        refetchInterval: 60000,
        staleTime: 30000,
    });

    const showMarquee = !isLoading && !isError && scores && scores.length > 0;

    if (isLoading) {
        return (
            <div className="bg-black/20 backdrop-blur-sm border-y border-white/10 py-3">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading Live Scores...</span>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-black/20 backdrop-blur-sm border-y border-white/10 py-3">
                <div className="flex items-center justify-center gap-2 text-red-400">
                    <WifiOff className="w-4 h-4" />
                    <span>Failed to load live scores.</span>
                </div>
            </div>
        );
    }

    if (!showMarquee) {
        return (
            <div className="bg-black/20 backdrop-blur-sm border-y border-white/10 py-3">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>No live or upcoming games right now.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black/20 backdrop-blur-sm border-y border-white/10 py-3 relative">
            {/* Top bar with LIVE badge and Speed Control */}
            <div className="flex items-center justify-between px-3 mb-2">
                <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/50 rounded-full px-3 py-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-red-400 tracking-wide">LIVE SCORES</span>
                </div>
                <button
                    onClick={cycleSpeed}
                    className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 border border-white/20 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    title="Change ticker speed"
                >
                    <Gauge className="w-3.5 h-3.5" />
                    <span>{currentSpeed.label}</span>
                </button>
            </div>
            
            <Marquee
                speed={currentSpeed.speed}
                pauseOnHover={true}
                pauseOnClick={false}
                gradient={false}
                className="pr-16"
            >
                <LiveBadge />
                {scores.map((game, index) => (
                    <ScoreItem key={`${game.id}-${index}`} game={game} />
                ))}
            </Marquee>
        </div>
    );
};