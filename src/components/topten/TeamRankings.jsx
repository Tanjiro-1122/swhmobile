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
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${accentColor} text-white font-bold flex-shrink-0`}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{team.name}</h4>
                  <p className="text-sm text-slate-600">{team.record} {team.winPct && `(${team.winPct})`}</p>
                </div>
                {team.conference && (
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600 whitespace-nowrap">
                    {team.conference}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {team.pointsFor && (
                  <div className="bg-green-50 rounded px-2 py-1">
                    <span className="text-green-700 font-semibold">{team.pointsFor}</span>
                    <span className="text-slate-500 ml-1">PPG</span>
                  </div>
                )}
                {team.pointsAgainst && (
                  <div className="bg-red-50 rounded px-2 py-1">
                    <span className="text-red-700 font-semibold">{team.pointsAgainst}</span>
                    <span className="text-slate-500 ml-1">PA</span>
                  </div>
                )}
                {team.pointDifferential && (
                  <div className={`rounded px-2 py-1 ${parseFloat(team.pointDifferential) > 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <span className={`font-semibold ${parseFloat(team.pointDifferential) > 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      {parseFloat(team.pointDifferential) > 0 ? '+' : ''}{team.pointDifferential}
                    </span>
                    <span className="text-slate-500 ml-1">Diff</span>
                  </div>
                )}
                {team.streak && (
                  <div className={`rounded px-2 py-1 ${team.streak.startsWith('W') ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className={`font-semibold ${team.streak.startsWith('W') ? 'text-green-700' : 'text-red-700'}`}>
                      {team.streak}
                    </span>
                  </div>
                )}
              </div>

              {(team.homeRecord || team.awayRecord || team.lastFive) && (
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                  {team.homeRecord && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                      🏠 {team.homeRecord}
                    </span>
                  )}
                  {team.awayRecord && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                      ✈️ {team.awayRecord}
                    </span>
                  )}
                  {team.lastFive && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                      L5: {team.lastFive}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}