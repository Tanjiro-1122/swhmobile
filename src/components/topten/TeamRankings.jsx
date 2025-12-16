import React from 'react';
import { motion } from 'framer-motion';

export default function TeamRankings({ teams, isLoading, accentColor }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams?.map((team, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 ${accentColor.replace('bg-', 'border-')}`}
        >
          <div className="flex items-start gap-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${accentColor} text-white font-bold text-xl flex-shrink-0`}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-bold text-slate-900 text-lg">{team.name}</h4>
                {team.division && (
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600 whitespace-nowrap">
                    {team.division}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 font-medium mb-1">{team.wins}-{team.losses}</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                2024-2025 season: {team.wins || 0} wins, {team.losses || 0} losses, 
                {team.pointsFor && ` ${team.pointsFor} PPG,`}
                {team.pointsAgainst && ` ${team.pointsAgainst} allowed,`}
                {team.pointDifferential && ` ${parseFloat(team.pointDifferential) > 0 ? '+' : ''}${team.pointDifferential} differential,`}
                {team.homeRecord && ` ${team.homeRecord} home,`}
                {team.awayRecord && ` ${team.awayRecord} away,`}
                {team.lastFive && ` ${team.lastFive} last 5,`}
                {team.streak && ` ${team.streak} streak`}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}