import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function PlayerSearchBar({ onSearch, isSearching }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const popularPlayers = [
    "Patrick Mahomes",
    "Christian McCaffrey",
    "LeBron James",
    "Stephen Curry",
    "Tyreek Hill"
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-400 transition-colors z-10" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any player: 'Patrick Mahomes', 'LeBron James', 'Cristiano Ronaldo'..."
            className="pl-14 pr-36 h-14 text-base bg-slate-900/50 border-2 border-slate-700 focus:border-purple-500 text-white placeholder:text-slate-500 rounded-xl transition-all shadow-lg"
            disabled={isSearching}
          />
          <Button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 rounded-lg shadow-lg shadow-purple-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="flex items-center gap-3 flex-wrap">
        <TrendingUp className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-400 font-medium">Popular players:</span>
        {popularPlayers.map((player, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setQuery(player);
              onSearch(player);
            }}
            className="text-sm px-4 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white border border-slate-700 hover:border-purple-500/50 transition-all"
          >
            {player}
          </motion.button>
        ))}
      </div>
    </div>
  );
}