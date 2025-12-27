import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Sparkles } from "lucide-react";

export default function SearchBar({ onSearch, isSearching }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isSearching) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
  };

  const popularSearches = [
    "Lakers vs Celtics",
    "Chiefs vs Bills NFL",
    "Yankees vs Red Sox",
    "Man City vs Arsenal",
    "Bucks vs Heat NBA"
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for any match (e.g., 'Lakers vs Celtics NBA' or 'Chelsea vs Arsenal')"
            disabled={isSearching}
            className="w-full min-h-[56px] pl-12 pr-10 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-[16px] shadow-sm bg-white text-gray-900 placeholder:text-gray-500"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          {query && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold min-h-[48px] text-base disabled:opacity-50 rounded-[16px]"
        >
          {isSearching ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Analyzing...
            </div>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </form>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">Popular Searches:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => setQuery(search)}
              disabled={isSearching}
              className="px-4 py-3 bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-[16px] text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[44px]"
            >
              {search}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-semibold text-blue-900 mb-2">💡 Search Tips:</p>
          <p>• Include team names and sport: <span className="font-semibold text-blue-700">"Lakers vs Celtics NBA"</span></p>
          <p>• Add league for soccer: <span className="font-semibold text-blue-700">"Chelsea vs Arsenal Premier League"</span></p>
          <p>• Be specific with dates: <span className="font-semibold text-blue-700">"Chiefs vs Bills Sunday"</span></p>
        </div>
      </div>
    </div>
  );
}