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
      onSearch(query.trim());
    }
  };

  const popularPlayers = [
    "Stephen Curry",
    "LeBron James",
    "Kevin Durant",
    "Giannis",
    "Patrick Mahomes"
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try: 'Stephen Curry', 'Steph Curry', 'KD', 'LeBron', 'Giannis'..."
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
                Searching...
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
        <span className="text-sm text-gray-500 font-medium">Try these popular players:</span>
        {popularPlayers.map((player, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setQuery(player);
              onSearch(player);
            }}
            disabled={isSearching}
            className="text-sm px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-full text-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {player}
          </motion.button>
        ))}
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong className="font-bold">💡 NICKNAME-FRIENDLY:</strong> Search using any name variation!
        </p>
        <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
          <li>• <strong>Nicknames:</strong> "Steph Curry", "KD", "King James", "Giannis"</li>
          <li>• <strong>Short names:</strong> "LeBron", "Dame", "AD", "Luka"</li>
          <li>• <strong>Full names:</strong> "Stephen Curry", "Kevin Durant"</li>
          <li>• <strong>With team:</strong> "LeBron Lakers", "Mahomes Chiefs"</li>
        </ul>
      </div>
    </div>
  );
}