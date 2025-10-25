import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Info } from "lucide-react";
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
    "Lakers @ Celtics",
    "Chiefs @ Bills",
    "Warriors vs Nuggets",
    "Man United vs Liverpool"
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors z-10" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: 'Lakers @ Celtics' or 'Warriors vs Nuggets'..."
            className="pl-14 pr-36 h-14 text-base bg-slate-900/50 border-2 border-slate-700 focus:border-emerald-500 text-white placeholder:text-slate-500 rounded-xl transition-all shadow-lg"
            disabled={isSearching}
          />
          <Button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-6 rounded-lg shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Format Guide */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-blue-300 mb-2">📝 How to Search:</div>
            <div className="text-sm text-blue-200 space-y-1">
              <div>✅ <strong>"Lakers @ Celtics"</strong> = Lakers away, Celtics home</div>
              <div>✅ <strong>"Chiefs @ Bills"</strong> = Chiefs away, Bills home</div>
              <div>✅ <strong>"Warriors vs Nuggets"</strong> = Warriors home, Nuggets away</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-400 font-medium">Popular:</span>
        {popularSearches.map((search, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery(search);
              onSearch(search);
            }}
            className="text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700 hover:border-emerald-500/50"
          >
            {search}
          </Button>
        ))}
      </div>
    </div>
  );
}