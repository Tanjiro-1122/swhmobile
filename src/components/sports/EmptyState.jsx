import React from "react";
import { Trophy, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20"
    >
      <div className="relative w-32 h-32 mx-auto mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl opacity-20 blur-2xl" />
        <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 flex items-center justify-center">
          <Trophy className="w-16 h-16 text-blue-400" />
        </div>
      </div>
      
      <h3 className="text-3xl font-bold text-white mb-3">Ready to Win?</h3>
      <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
        Search for any upcoming match to get AI-powered win probabilities, player predictions, and smart betting insights
      </p>
      
      <div className="flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Zap className="w-5 h-5 text-blue-400" />
          <span>Instant Analysis</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <span>Live Data</span>
        </div>
      </div>
    </motion.div>
  );
}