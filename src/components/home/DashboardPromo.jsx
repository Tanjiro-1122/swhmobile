import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, Zap } from 'lucide-react';

const features = [
    "Real-time Odds Tracking",
    "Historical Trends",
    "Custom Alerts"
];

const DashboardPromo = () => {
  return (
    <div className="py-20 sm:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <p className="font-semibold text-cyan-400 mb-2 text-lg">Get Full Access</p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter">AI Analysis Dashboard</h2>
            <p className="mt-6 text-lg text-slate-300">
              Go beyond simple picks. Our dashboard gives you the tools to analyze the market like a pro.
            </p>
            <ul className="mt-8 space-y-4">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-200 text-lg">{feature}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-10 bg-cyan-400 text-slate-900 font-bold hover:bg-cyan-300 rounded-full px-8 py-6">
              <Link to={createPageUrl('Dashboard')}>Explore Dashboard</Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
            className="relative"
          >
            <div className="relative bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-2xl shadow-cyan-500/10">
              <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-cyan-400 font-bold flex items-center gap-2"><Zap className="w-4 h-4"/>Live Engine</span>
                  <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg mb-4">
                <p className="text-xs text-slate-400">Recommended Bet</p>
                <p className="text-xl font-bold text-white">Lakers vs Warriors</p>
                <p className="text-sm text-cyan-400 font-semibold">82% Confidence</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-xs text-slate-400">Spread</p>
                      <p className="text-2xl font-bold text-white">-4.5</p>
                  </div>
                   <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-xs text-slate-400">EV (Expected Value)</p>
                      <p className="text-2xl font-bold text-green-400">+$24.50</p>
                  </div>
              </div>
               <div className="bg-slate-900/50 p-4 rounded-lg mt-4">
                  <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Win Probability</span>
                      <span className="font-bold text-white text-sm">68.4%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
                      <div className="bg-cyan-400 h-2.5 rounded-full" style={{width: '68.4%'}}></div>
                  </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPromo;