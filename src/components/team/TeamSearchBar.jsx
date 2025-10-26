import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Shield, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamSearchBar({ onSearch, isSearching }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const popularTeams = [
    "Los Angeles Lakers",
    "Manchester United",
    "Golden State Warriors",
    "Real Madrid",
    "Dallas Cowboys"
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for any team (e.g., 'Los Angeles Lakers', 'Manchester United')"
            className="pl-12 pr-32 h-14 text-lg border-2 focus:border-green-500 transition-all"
            disabled={isSearching}
          />
          <Button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
        <span className="text-sm text-gray-500">Popular teams:</span>
        {popularTeams.map((team, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setQuery(team);
              onSearch(team);
            }}
            className="text-sm px-3 py-1 bg-green-100 hover:bg-green-200 rounded-full text-green-700 transition-colors"
          >
            {team}
          </motion.button>
        ))}
      </div>
    </div>
  );
}