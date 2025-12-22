import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

export default function DashboardHeader({ userName }) {
  const firstName = userName?.split(' ')[0] || 'Champion';
  
  return (
    <motion.div 
      className="relative mb-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Decorative elements */}
      <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
      <div className="absolute -top-2 right-20 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl" />
      
      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <motion.div 
            className="flex items-center gap-2 mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">AI-Powered</span>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-5xl font-black tracking-tighter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-white">Welcome back, </span>
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              {firstName}
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-slate-400 mt-2 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Your AI betting intelligence is ready for action
          </motion.p>
        </div>
        
        {/* Live indicator */}
        <motion.div 
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-sm font-medium text-slate-300">
            <span className="text-emerald-400 font-bold">Live</span> predictions available
          </span>
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </motion.div>
      </div>
    </motion.div>
  );
}