import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Zap, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SearchBar({ onSearch, isSearching }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const popularSearches = [
    "Lakers vs Celtics",
    "Man United vs Liverpool",
    "NBA tonight",
    "Champions League today"
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any match: 'Lakers vs Celtics', 'Man United vs Liverpool'..."
            className="pl-16 pr-36 h-16 text-lg bg-slate-800/50 border-2 border-slate-700 focus:border-blue-500 text-white placeholder:text-slate-500 rounded-xl transition-all"
            disabled={isSearching}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="absolute right-32 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Try: "Lakers vs Celtics NBA", "Patriots vs Chiefs", "Man City Premier League"
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-6 rounded-lg shadow-lg shadow-blue-500/50 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-400 font-medium">Popular:</span>
        {popularSearches.map((search, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setQuery(search);
              onSearch(search);
            }}
            disabled={isSearching}
            className="text-sm px-4 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white border border-slate-700 hover:border-blue-500/50 transition-all disabled:opacity-50"
          >
            {search}
          </motion.button>
        ))}
      </div>
    </div>
  );
}