import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <div className="relative text-center py-20 md:py-32 lg:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-900 z-10"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-20 container mx-auto px-4"
      >
        <p className="font-semibold text-cyan-400 mb-3 text-lg">Revolutionizing Sports Betting Analysis</p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight">
          The Future of <span className="text-cyan-400">Winning</span>
        </h1>
        <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-slate-300">
          Powered by advanced neural networks, SportWagerHelper transforms chaotic data into precise betting opportunities.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button asChild size="lg" className="bg-cyan-400 text-slate-900 font-bold hover:bg-cyan-300 px-8 py-6 rounded-full text-base">
            <Link to={createPageUrl('Dashboard')}>Deploy AI Assistant</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-slate-600 hover:bg-slate-800 hover:text-white px-8 py-6 rounded-full text-base">
            <Link to={createPageUrl('AnalysisHub')}>See Predictions</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;