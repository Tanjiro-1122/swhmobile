import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Clock, Gauge } from 'lucide-react';
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

const SPEED_OPTIONS = [
    { label: 'Slow', speed: 15 },
    { label: 'Medium', speed: 50 },
    { label: 'Fast', speed: 100 },
];

export const LiveMarketTicker = () => {
    const [speedIndex, setSpeedIndex] = useState(0);
    const currentSpeed = SPEED_OPTIONS[speedIndex];

    const cycleSpeed = () => {
        setSpeedIndex((prev) => (prev + 1) % SPEED_OPTIONS.length);
    };

    const { data: scores, isLoading } = useQuery({
        queryKey: ['liveScores'],
        queryFn: async () => {
            try {
                const res = await base44.functions.invoke('getLiveScores');
                return res.data || [];
            } catch {
                return []; // Fail silently — show empty state instead of error
            }
        },
        refetchInterval: 120000, // Refresh every 2 minutes
        staleTime: 60000,
        retry: false, // Don't retry on fail
    });

    const hasGames = !isLoading && scores && scores.length > 0;

    if (isLoading) {
        return (
            <div className="bg-black/20 backdrop-blur-sm border-y border-white/10 py-3">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading scores...</span>
                </div>
            </div>
        );
    }

    if (!hasGames) {
        return (
            <div className="bg-black/20 backdrop-blur-sm border-y border-white/10 py-3">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">No live games right now — check back soon</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black/20 backdrop-blur-sm border-y border-white/10 py-3 relative">
            <div className="flex items-center justify-between px-3 mb-2">
                <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/50 rounded-full px-3 py-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-red-400 tracking-wide">LIVE SCORES</span>
                </div>
                <button
                    onClick={cycleSpeed}
                    className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 border border-white/20 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors"
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
