import { useQuery } from "@tanstack/react-query";
import { Activity, Zap, TrendingUp, Clock, AlertCircle, RefreshCw } from "lucide-react";

const SPORTS = [
  { key: "basketball_nba", label: "NBA", emoji: "🏀" },
  { key: "americanfootball_nfl", label: "NFL", emoji: "🏈" },
  { key: "baseball_mlb", label: "MLB", emoji: "⚾" },
  { key: "icehockey_nhl", label: "NHL", emoji: "🏒" },
];

export default function AIPerformanceContent() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["liveOddsAll"],
    queryFn: async () => {
      const results = [];
      for (const sport of SPORTS) {
        try {
          const resp = await fetch(`/api/getLiveOdds?sport=${sport.key}`);
          if (!resp.ok) continue;
          const json = await resp.json();
          if (json?.games?.length) {
            results.push({ ...sport, games: json.games.slice(0, 4) });
          }
        } catch {}
      }
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-lime-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-lime-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-6 h-6 text-lime-400" />
          </div>
        </div>
        <p className="text-gray-400 text-sm">Fetching live odds...</p>
      </div>
    );
  }

  if (error || !data?.length) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-yellow-300 font-bold text-sm">Live odds not available right now</p>
            <p className="text-gray-400 text-xs mt-1">No games scheduled or API limit reached. Check back soon.</p>
          </div>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 text-sm hover:bg-gray-700 transition-all">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-white text-lg">Live Odds</h3>
          <p className="text-gray-500 text-xs">DraftKings · Updated live</p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 text-xs hover:text-white hover:bg-gray-700 transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {data.map((sport) => (
        <div key={sport.key}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{sport.emoji}</span>
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">{sport.label}</span>
          </div>
          <div className="space-y-2">
            {sport.games.map((game, i) => {
              const dk = game.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
              const home = dk.find(o => o.name === game.home_team);
              const away = dk.find(o => o.name === game.away_team);
              const gameTime = game.commence_time ? new Date(game.commence_time) : null;
              const timeStr = gameTime ? gameTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : null;

              return (
                <div key={i} className="rounded-2xl border border-gray-700 bg-gray-900 p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{game.away_team}</p>
                      <p className="text-gray-500 text-xs">@ {game.home_team}</p>
                    </div>
                    {timeStr && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {timeStr}
                      </div>
                    )}
                  </div>
                  {(home || away) ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[away, home].filter(Boolean).map((o, j) => {
                        const odds = o.price;
                        const isPos = odds > 0;
                        const label = isPos ? `+${odds}` : `${odds}`;
                        const color = isPos ? "text-green-400" : "text-red-400";
                        return (
                          <div key={j} className="bg-gray-800 rounded-xl px-3 py-2 flex items-center justify-between">
                            <span className="text-gray-300 text-xs font-medium truncate flex-1 mr-2">{o.name.split(' ').pop()}</span>
                            <span className={`text-sm font-black ${color}`}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-xs">No odds available</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
