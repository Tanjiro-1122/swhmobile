import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

const getRankIcon = (rank) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-500">#{rank}</span>;
};

export default function PlayerList({ players, isLoading, accentColor }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/4 mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players?.map((player, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 ${accentColor}`}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100">
              {getRankIcon(index + 1)}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800">{player.name}</h4>
              <p className="text-sm text-slate-500">{player.team} • {player.position}</p>
            </div>
            {player.stats && (
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">{player.stats}</p>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}