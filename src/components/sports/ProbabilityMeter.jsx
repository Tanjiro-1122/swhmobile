import React from "react";
import { motion } from "framer-motion";

export default function ProbabilityMeter({ homeTeam, awayTeam, homeProb, awayProb, drawProb }) {
  // Ensure all values are numbers
  const homeProbNum = Number(homeProb) || 0;
  const awayProbNum = Number(awayProb) || 0;
  const drawProbNum = Number(drawProb) || 0;
  
  const total = homeProbNum + awayProbNum + drawProbNum;
  const homeWidth = total > 0 ? (homeProbNum / total) * 100 : 0;
  const drawWidth = total > 0 && drawProbNum ? (drawProbNum / total) * 100 : 0;
  const awayWidth = total > 0 ? (awayProbNum / total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <div className="text-4xl font-black bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            {homeProbNum.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-400 font-medium">{homeTeam}</div>
        </div>
        {drawProbNum > 0 && (
          <div className="text-center flex-1">
            <div className="text-3xl font-bold text-slate-400 mb-2">{drawProbNum.toFixed(1)}%</div>
            <div className="text-sm text-slate-500 font-medium">Draw</div>
          </div>
        )}
        <div className="text-center flex-1">
          <div className="text-4xl font-black bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {awayProbNum.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-400 font-medium">{awayTeam}</div>
        </div>
      </div>

      <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${homeWidth}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50"
        />
        {drawProbNum > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${drawWidth}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="absolute h-full bg-slate-600"
            style={{ left: `${homeWidth}%` }}
          />
        )}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${awayWidth}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: drawProbNum > 0 ? 0.4 : 0.2 }}
          className="absolute right-0 h-full bg-gradient-to-l from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50"
        />
      </div>
    </div>
  );
}