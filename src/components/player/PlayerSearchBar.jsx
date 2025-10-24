import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, TrendingUp, Info } from "lucide-react";
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
    "Shohei Ohtani",
    "Patrick Mahomes",
    "LeBron James",
    "Aaron Judge",
    "Christian McCaffrey"
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-400 transition-colors z-10" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any player: 'Shohei Ohtani', 'Patrick Mahomes', 'LeBron James'..."
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

      {/* Search Tips */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-blue-300 mb-2">💡 Search Tips:</div>
            <div className="text-sm text-blue-200 space-y-1">
              <div>✅ <strong>Full names work best:</strong> "Shohei Ohtani", "Patrick Mahomes"</div>
              <div>✅ <strong>For common names, add team or league:</strong> "Will Smith Dodgers" or "Will Smith MLB"</div>
              <div>✅ <strong>Works for all sports:</strong> MLB, NBA, NFL, NHL, Soccer</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <TrendingUp className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-400 font-medium">Popular players:</span>
        {popularPlayers.map((player, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery(player);
              onSearch(player);
            }}
            className="text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700 hover:border-purple-500/50"
          >
            {player}
          </Button>
        ))}
      </div>
    </div>
  );
}