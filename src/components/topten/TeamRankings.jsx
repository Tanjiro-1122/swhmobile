import React from 'react';
import { motion } from 'framer-motion';

export default function TeamRankings({ teams, isLoading, accentColor }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-4">
                    <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-3 font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10">#</th>
              <th className="text-left p-3 font-semibold text-slate-700 sticky left-12 bg-slate-50 z-10 min-w-[140px]">TEAM</th>
              <th className="text-center p-3 font-semibold text-slate-700">W</th>
              <th className="text-center p-3 font-semibold text-slate-700">L</th>
              <th className="text-center p-3 font-semibold text-slate-700">WIN%</th>
              <th className="text-center p-3 font-semibold text-slate-700">GB</th>
              <th className="text-center p-3 font-semibold text-slate-700">CONF</th>
              <th className="text-center p-3 font-semibold text-slate-700">DIV</th>
              <th className="text-center p-3 font-semibold text-slate-700">HOME</th>
              <th className="text-center p-3 font-semibold text-slate-700">ROAD</th>
              <th className="text-center p-3 font-semibold text-slate-700">LAST10</th>
              <th className="text-center p-3 font-semibold text-slate-700">STREAK</th>
            </tr>
          </thead>
          <tbody>
            {teams?.map((team, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className={`p-3 font-bold text-slate-700 sticky left-0 bg-white ${index < 6 ? 'border-r-2' : ''}`} style={index < 6 ? {borderRightColor: accentColor.replace('bg-', '')} : {}}>
                  {index + 1}
                </td>
                <td className="p-3 font-semibold text-slate-800 sticky left-12 bg-white">{team.name}</td>
                <td className="p-3 text-center text-slate-700">{team.w}</td>
                <td className="p-3 text-center text-slate-700">{team.l}</td>
                <td className="p-3 text-center text-slate-700">{team.win_pct}</td>
                <td className="p-3 text-center text-slate-500">{team.gb || '--'}</td>
                <td className="p-3 text-center text-slate-600 text-xs">{team.conf}</td>
                <td className="p-3 text-center text-slate-600 text-xs">{team.div}</td>
                <td className="p-3 text-center text-slate-600 text-xs">{team.home}</td>
                <td className="p-3 text-center text-slate-600 text-xs">{team.road}</td>
                <td className="p-3 text-center text-slate-600 text-xs">{team.last10}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${team.streak?.startsWith('W') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {team.streak}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}