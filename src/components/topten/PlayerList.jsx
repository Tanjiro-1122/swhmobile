import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

const getRankIcon = (rank) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return null;
};

const getStatColumns = (sport) => {
  const columns = {
    NFL: [
      { key: 'position', label: 'POS' },
      { key: 'yds', label: 'YDS' },
      { key: 'td', label: 'TD' },
      { key: 'cmp_att', label: 'CMP/ATT' },
      { key: 'cmp_pct', label: 'CMP%' },
      { key: 'qbr', label: 'QBR' },
      { key: 'rush_yds', label: 'RUSH' },
      { key: 'rec', label: 'REC' },
      { key: 'rec_yds', label: 'REC YDS' },
      { key: 'total_td', label: 'TOTAL TD' }
    ],
    MLB: [
      { key: 'position', label: 'POS' },
      { key: 'avg', label: 'AVG' },
      { key: 'hr', label: 'HR' },
      { key: 'rbi', label: 'RBI' },
      { key: 'obp', label: 'OBP' },
      { key: 'slg', label: 'SLG' },
      { key: 'era', label: 'ERA' },
      { key: 'w', label: 'W' },
      { key: 'k', label: 'K' },
      { key: 'whip', label: 'WHIP' }
    ],
    NBA: [
      { key: 'position', label: 'POS' },
      { key: 'gp', label: 'GP' },
      { key: 'min', label: 'MIN' },
      { key: 'pts', label: 'PTS' },
      { key: 'reb', label: 'REB' },
      { key: 'ast', label: 'AST' },
      { key: 'fg_pct', label: 'FG%' },
      { key: 'three_pct', label: '3P%' }
    ],
    NHL: [
      { key: 'position', label: 'POS' },
      { key: 'gp', label: 'GP' },
      { key: 'g', label: 'G' },
      { key: 'a', label: 'A' },
      { key: 'pts', label: 'PTS' },
      { key: 'plus_minus', label: '+/-' },
      { key: 'pim', label: 'PIM' },
      { key: 'sog', label: 'SOG' },
      { key: 's_pct', label: 'S%' },
      { key: 'toi', label: 'TOI' }
    ],
    Soccer: [
      { key: 'position', label: 'POS' },
      { key: 'gp', label: 'GP' },
      { key: 'g', label: 'G' },
      { key: 'a', label: 'A' },
      { key: 'sot', label: 'SOT' },
      { key: 'pass_pct', label: 'PASS%' },
      { key: 'tck', label: 'TCK' },
      { key: 'min', label: 'MIN' },
      { key: 'yc', label: 'YC' },
      { key: 'rc', label: 'RC' }
    ]
  };
  return columns[sport] || columns.NBA;
};

export default function PlayerList({ players, isLoading, accentColor, sport = 'NBA' }) {
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

  const statColumns = getStatColumns(sport);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-3 font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10">#</th>
              <th className="text-left p-3 font-semibold text-slate-700 sticky left-12 bg-slate-50 z-10 min-w-[160px]">PLAYER</th>
              <th className="text-left p-3 font-semibold text-slate-700 min-w-[140px]">TEAM</th>
              {statColumns.map((col) => (
                <th key={col.key} className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players?.map((player, index) => {
              const icon = getRankIcon(index + 1);
              return (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3 sticky left-0 bg-white">
                    {icon ? (
                      <div className="flex items-center justify-center">{icon}</div>
                    ) : (
                      <span className="font-bold text-slate-700">{index + 1}</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-slate-800 sticky left-12 bg-white">{player.name}</td>
                  <td className="p-3 text-slate-700">{player.team}</td>
                  {statColumns.map((col) => (
                    <td key={col.key} className={`p-3 text-center ${col.key === statColumns[3]?.key ? 'font-semibold text-slate-800' : 'text-slate-700'} ${col.key === 'position' ? 'text-xs text-slate-600' : ''}`}>
                      {player[col.key] || '--'}
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}