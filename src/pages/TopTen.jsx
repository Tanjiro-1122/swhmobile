import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import FloatingDashboardButton from '@/components/navigation/FloatingDashboardButton';

const sports = [
  {
    name: 'NFL',
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nfl.png',
    gradient: 'from-blue-600 to-blue-800',
    shadow: 'shadow-blue-500/20'
  },
  {
    name: 'MLB',
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/mlb.png',
    gradient: 'from-red-600 to-red-800',
    shadow: 'shadow-red-500/20'
  },
  {
    name: 'NBA',
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nba.png',
    gradient: 'from-orange-500 to-orange-700',
    shadow: 'shadow-orange-500/20'
  },
  {
    name: 'NHL',
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nhl.png',
    gradient: 'from-teal-500 to-teal-700',
    shadow: 'shadow-teal-500/20'
  },
  {
    name: 'Soccer',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/FIFA_logo_without_slogan.svg/500px-FIFA_logo_without_slogan.svg.png',
    gradient: 'from-green-600 to-green-800',
    shadow: 'shadow-green-500/20'
  }
];

export default function TopTen() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-xl shadow-orange-500/30">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-3">
            TOP <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">TEN</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Top players and team rankings across all major sports
          </p>
        </motion.div>

        {/* Sports Cards */}
        <div className="grid gap-4 md:gap-6">
          {sports.map((sport, index) => (
            <motion.div
              key={sport.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={createPageUrl('SportDetail') + '?sport=' + sport.name}>
                <div className={`bg-gradient-to-r ${sport.gradient} rounded-2xl p-6 shadow-xl ${sport.shadow} hover:scale-[1.02] transition-transform cursor-pointer`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center">
                        <img src={sport.logo} alt={sport.name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white">{sport.name}</h2>
                        <p className="text-white/70 text-sm mt-1">Top 10 Players & Team Rankings</p>
                      </div>
                    </div>
                    <div className="text-white/50 text-4xl font-bold">→</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <FloatingDashboardButton />
    </div>
  );
}