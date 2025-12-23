import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function LiveScoresWidget() {
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['liveScores'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getLiveScores');
      return response.data || [];
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });

  const getSportColor = (sport) => {
    const colors = {
      NFL: 'bg-blue-600',
      NCAAF: 'bg-blue-500',
      NBA: 'bg-orange-500',
      NCAAB: 'bg-orange-400',
      MLB: 'bg-red-600',
      NHL: 'bg-teal-500',
    };
    return colors[sport] || 'bg-slate-600';
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border-y border-slate-700 py-3 overflow-hidden">
        <div className="text-slate-400 text-center text-sm">Loading live scores...</div>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="bg-slate-900 border-y border-slate-700 py-3 overflow-hidden">
        <div className="text-slate-400 text-center text-sm">No games scheduled right now</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border-y border-slate-700 py-3 overflow-hidden relative">
      <motion.div
        className="flex gap-8"
        animate={{
          x: [0, -3000],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 40,
            ease: "linear",
          },
        }}
      >
        {[...games, ...games, ...games].map((game, index) => (
          <div
            key={`${game.id}-${index}`}
            className="flex items-center gap-3 whitespace-nowrap px-4 py-1 bg-slate-800/50 rounded-lg border border-slate-700"
          >
            <span className={`${getSportColor(game.sport_title)} px-2 py-0.5 rounded text-white text-xs font-bold`}>
              {game.sport_title}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white font-semibold">{game.away_team}</span>
              {game.status === 'Live' ? (
                <>
                  <span className="text-yellow-400 font-bold">{game.score}</span>
                  <span className="text-white font-semibold">{game.home_team}</span>
                  <span className="flex items-center gap-1 text-red-400 text-xs animate-pulse">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    {game.detail || 'LIVE'}
                  </span>
                </>
              ) : game.status === 'Final' ? (
                <>
                  <span className="text-yellow-400 font-bold">{game.score}</span>
                  <span className="text-white font-semibold">{game.home_team}</span>
                  <span className="text-slate-500 text-xs">FINAL</span>
                </>
              ) : (
                <>
                  <span className="text-slate-400">@</span>
                  <span className="text-white font-semibold">{game.home_team}</span>
                  <span className="text-cyan-400 text-xs">{game.score}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}