import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const sportColors = {
  NFL: 'from-blue-600 to-blue-800',
  MLB: 'from-red-600 to-red-800',
  NBA: 'from-orange-500 to-orange-700',
  NHL: 'from-teal-500 to-teal-700',
  Soccer: 'from-green-600 to-green-800'
};

const sportLogos = {
  NFL: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nfl.png',
  MLB: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/mlb.png',
  NBA: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nba.png',
  NHL: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nhl.png',
  Soccer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/FIFA_logo_without_slogan.svg/500px-FIFA_logo_without_slogan.svg.png'
};

export default function SportCard({ sport, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={createPageUrl(`SportDetail?sport=${sport}`)}>
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${sportColors[sport]} p-6 cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{sportIcons[sport]}</span>
              <div>
                <h3 className="text-2xl font-bold text-white">{sport}</h3>
                <p className="text-white/70 text-sm mt-1">View Top 10 Rankings</p>
              </div>
            </div>
            <ChevronRight className="w-8 h-8 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}