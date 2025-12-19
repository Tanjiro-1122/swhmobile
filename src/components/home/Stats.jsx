import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { value: '84.2%', label: 'Historical Precision', description: 'AI backtested accuracy on over 1 million events.' },
  { value: 'Active', label: 'Analysis Engine', description: 'Real-time monitoring across 50+ sportsbooks.' },
];

const Users = () => (
  <div className="flex items-center justify-center -space-x-4">
    {Array(5).fill(0).map((_, i) => (
      <img
        key={i}
        className="w-12 h-12 rounded-full border-2 border-slate-700 bg-slate-800"
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 41}`}
        alt={`User ${i + 1}`}
      />
    ))}
    <div className="w-12 h-12 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center text-xs font-semibold text-cyan-400">15K+</div>
  </div>
);


const Stats = () => {
  return (
    <div className="relative py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-1 text-center lg:text-left">
            <Users />
            <p className="mt-4 text-lg font-semibold text-white">Join 15,000+ Smart Money Bettors</p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.5 }}
                className="bg-slate-800/50 p-6 rounded-xl border border-slate-700"
              >
                <p className="text-3xl font-bold text-cyan-400">{stat.value}</p>
                <p className="text-lg font-semibold text-white mt-1">{stat.label}</p>
                <p className="text-sm text-slate-400 mt-2">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;