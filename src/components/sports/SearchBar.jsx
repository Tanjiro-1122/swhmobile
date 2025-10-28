import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Zap } from "lucide-react";
import { motion } from "framer-motion";

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
        <motion.div 
          className="relative group"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any match: 'Lakers vs Celtics', 'Man United vs Liverpool'..."
            className="pl-16 pr-36 h-16 text-lg bg-slate-800/50 border-2 border-slate-700 focus:border-blue-500 text-white placeholder:text-slate-500 rounded-xl transition-all"
            disabled={isSearching}
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-6 rounded-lg shadow-lg shadow-blue-500/50 transition-all"
            >
              {isSearching ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </form>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-400 font-medium">Popular:</span>
        {popularSearches.map((search, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              setQuery(search);
              onSearch(search);
            }}
            className="text-sm px-4 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white border border-slate-700 hover:border-blue-500/50 transition-all"
          >
            {search}
          </motion.button>
        ))}
      </div>
    </div>
  );
}