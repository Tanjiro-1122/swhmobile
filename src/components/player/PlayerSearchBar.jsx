import { useState } from "react";
import { Search, X, Zap, TrendingUp } from "lucide-react";

const QUICK_PICKS = [
  { name: "LeBron James", sport: "NBA", emoji: "🏀" },
  { name: "Patrick Mahomes", sport: "NFL", emoji: "🏈" },
  { name: "Aaron Judge", sport: "MLB", emoji: "⚾" },
  { name: "Nikola Jokic", sport: "NBA", emoji: "🏀" },
  { name: "Erling Haaland", sport: "Soccer", emoji: "⚽" },
  { name: "Connor McDavid", sport: "NHL", emoji: "🏒" },
];

export default function PlayerSearchBar({ onSearch, isSearching }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isSearching) onSearch(query.trim());
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit}>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="LeBron James, Patrick Mahomes..."
              disabled={isSearching}
              className="w-full h-14 pl-12 pr-10 bg-gray-800 border border-gray-600 rounded-2xl text-white text-base placeholder:text-gray-500 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 disabled:opacity-50"
            />
            {query && !isSearching && (
              <button type="button" onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-700 rounded-full">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <button type="submit" disabled={!query.trim() || isSearching}
            className="h-14 px-6 bg-lime-400 hover:bg-lime-300 disabled:opacity-40 text-gray-950 font-black rounded-2xl flex items-center gap-2 transition-all active:scale-95">
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            <span className="hidden sm:block">{isSearching ? "Analyzing..." : "Search"}</span>
          </button>
        </div>
      </form>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-lime-400" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Search</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_PICKS.map((p) => (
            <button key={p.name} onClick={() => { setQuery(p.name); onSearch(p.name); }}
              disabled={isSearching}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-lime-400/50 rounded-xl text-sm text-gray-300 hover:text-white transition-all disabled:opacity-40 active:scale-95">
              <span>{p.emoji}</span>
              <span className="font-medium">{p.name}</span>
              <span className="text-[10px] text-gray-500 font-bold">{p.sport}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
