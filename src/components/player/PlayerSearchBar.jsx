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
    "LeBron James",
    "Stephen Curry",
    "Cristiano Ronaldo",
    "Lionel Messi",
    "Kevin Durant"
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for any player (e.g., 'LeBron James', 'Cristiano Ronaldo')"
            className="pl-12 pr-32 h-14 text-lg border-2 focus:border-purple-500 transition-all"
            disabled={isSearching}
          />
          <Button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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

      <div className="flex items-center gap-2 flex-wrap">
        <TrendingUp className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-500">Popular players:</span>
        {popularPlayers.map((player, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setQuery(player);
              onSearch(player);
            }}
            className="text-sm px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded-full text-purple-700 transition-colors"
          >
            {player}
          </motion.button>
        ))}
      </div>
    </div>
  );
}