import React from "react";
import { TrendingUp, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
        <TrendingUp className="w-12 h-12 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Matches Analyzed Yet</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Search for any upcoming sports match to see win probabilities based on real-time data and statistics
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Search className="w-4 h-4" />
        <span>Try searching for your favorite teams or leagues</span>
      </div>
    </motion.div>
  );
}