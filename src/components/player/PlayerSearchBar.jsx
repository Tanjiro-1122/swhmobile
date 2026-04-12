import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Sparkles } from "lucide-react";

export default function PlayerSearchBar({ onSearch, isSearching }) {
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

  const popularPlayers = [
    "LeBron James",
    "Patrick Mahomes",
    "Aaron Judge",
    "Nikola Jokic",
    "Erling Haaland"
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for any player..."
            disabled={isSearching}
            className="w-full h-14 pl-12 pr-10 text-base border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl shadow-sm bg-white text-gray-900 placeholder:text-gray-500"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          {query && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-12 rounded-xl disabled:opacity-50"
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
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-gray-700">Popular Players:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularPlayers.map((player, index) => (
            <button
              key={index}
              onClick={() => setQuery(player)}
              disabled={isSearching}
              className="px-4 py-2 bg-white border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {player}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-semibold text-purple-900 mb-2">💡 Search Tips:</p>
          <p>• Use full player names for best results: <span className="font-semibold text-purple-700">"LeBron James"</span></p>
          <p>• Include team if needed: <span className="font-semibold text-purple-700">"Steph Curry Warriors"</span></p>
          <p>• Try nicknames: <span className="font-semibold text-purple-700">"King James"</span> or <span className="font-semibold text-purple-700">"Greek Freak"</span></p>
        </div>
      </div>
    </div>
  );
}