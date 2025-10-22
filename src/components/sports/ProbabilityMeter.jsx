import React from "react";
import { motion } from "framer-motion";

export default function ProbabilityMeter({ homeTeam, awayTeam, homeProb, awayProb, drawProb }) {
  const total = homeProb + awayProb + (drawProb || 0);
  const homeWidth = (homeProb / total) * 100;
  const drawWidth = drawProb ? (drawProb / total) * 100 : 0;
  const awayWidth = (awayProb / total) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <div className="text-3xl font-bold text-blue-600">{homeProb.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 mt-1">{homeTeam}</div>
        </div>
        {drawProb > 0 && (
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-gray-600">{drawProb.toFixed(1)}%</div>
            <div className="text-sm text-gray-600 mt-1">Draw</div>
          </div>
        )}
        <div className="text-center flex-1">
          <div className="text-3xl font-bold text-purple-600">{awayProb.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 mt-1">{awayTeam}</div>
        </div>
      </div>

      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${homeWidth}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600"
        />
        {drawProb > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${drawWidth}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="absolute h-full bg-gray-400"
            style={{ left: `${homeWidth}%` }}
          />
        )}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${awayWidth}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: drawProb > 0 ? 0.4 : 0.2 }}
          className="absolute right-0 h-full bg-gradient-to-l from-purple-500 to-purple-600"
        />
      </div>
    </div>
  );
}