import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function LiveScoresWidget() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchScores = async () => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Get the latest live and recent sports scores from today across NFL, NBA, MLB, NHL, and Soccer (Premier League, Champions League).
                 For each game provide: sport, home team, away team, home score, away score, game status (Live/Final/Scheduled), quarter/period/inning if live.
                 Return at least 15-20 games. Use current real scores from ESPN, Fox Sports, and league sites.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            games: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sport: { type: "string" },
                  home_team: { type: "string" },
                  away_team: { type: "string" },
                  home_score: { type: "string" },
                  away_score: { type: "string" },
                  status: { type: "string" },
                  period: { type: "string" }
                }
              }
            }
          }
        }
      });
      setGames(result.games || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching scores:', error);
      setLoading(false);
    }
  };

  const getSportColor = (sport) => {
    const colors = {
      NFL: 'bg-blue-600',
      NBA: 'bg-orange-500',
      MLB: 'bg-red-600',
      NHL: 'bg-teal-500',
      Soccer: 'bg-green-600',
      EPL: 'bg-purple-600',
      UCL: 'bg-blue-700'
    };
    return colors[sport] || 'bg-slate-600';
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border-y border-slate-700 py-3 overflow-hidden">
        <div className="text-slate-400 text-center text-sm">Loading live scores...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border-y border-slate-700 py-3 overflow-hidden relative">
      <motion.div
        className="flex gap-8"
        animate={{
          x: [0, -5000],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 60,
            ease: "linear",
          },
        }}
      >
        {[...games, ...games, ...games, ...games].map((game, index) => (
          <div
            key={index}
            className="flex items-center gap-3 whitespace-nowrap px-4 py-1 bg-slate-800/50 rounded-lg border border-slate-700"
          >
            <span className={`${getSportColor(game.sport)} px-2 py-0.5 rounded text-white text-xs font-bold`}>
              {game.sport}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white font-semibold">{game.away_team}</span>
              <span className="text-yellow-400 font-bold">{game.away_score}</span>
              <span className="text-slate-500">@</span>
              <span className="text-white font-semibold">{game.home_team}</span>
              <span className="text-yellow-400 font-bold">{game.home_score}</span>
              {game.status === 'Live' && (
                <span className="flex items-center gap-1 text-red-400 text-xs animate-pulse">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                  {game.period || 'LIVE'}
                </span>
              )}
              {game.status === 'Final' && (
                <span className="text-slate-500 text-xs">FINAL</span>
              )}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}