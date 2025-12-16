import React from 'react';
import { motion } from 'framer-motion';

export default function TeamRankings({ teams, isLoading, accentColor }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-200 rounded" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-1/3 mt-2" />
              </div>
            </div>
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
          className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${accentColor} text-white font-bold`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800">{team.name}</h4>
              <p className="text-sm text-slate-500">{team.record}</p>
            </div>
            {team.conference && (
              <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                {team.conference}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}