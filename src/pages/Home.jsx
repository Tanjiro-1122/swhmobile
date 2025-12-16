import React from 'react';
import { motion } from 'framer-motion';
import SportCard from '@/components/SportCard';
import { Trophy } from 'lucide-react';

const sports = ['NFL', 'MLB', 'NBA', 'NHL', 'Soccer'];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-lg shadow-orange-500/30">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">
            TOP <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">TEN</span>
          </h1>
          <p className="text-slate-400 mt-3 text-lg">
            Your ultimate guide to sports rankings
          </p>
        </motion.div>

        {/* Sports Grid */}
        <div className="space-y-4">
          {sports.map((sport, index) => (
            <SportCard key={sport} sport={sport} index={index} />
          ))}
        </div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-slate-500 text-sm mt-12"
        >
          Select a sport to view top players and team rankings
        </motion.p>
      </div>
    </div>
  );
}