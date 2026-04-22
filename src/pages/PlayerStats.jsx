import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Zap, Trophy, Target, TrendingUp, Calendar, Activity, Star, AlertCircle, ChevronRight } from "lucide-react";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import { useFreeLookupTracker, FreeLookupModal } from "../components/auth/FreeLookupTracker";
import { motion, AnimatePresence } from "framer-motion";

const StatCard = ({ label, value, sub, color = "lime", big = false }) => {
  const colors = {
    lime:   "border-lime-500/30 bg-lime-500/10 text-lime-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    blue:   "border-blue-500/30 bg-blue-500/10 text-blue-400",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    green:  "border-green-500/30 bg-green-500/10 text-green-400",
    red:    "border-red-500/30 bg-red-500/10 text-red-400",
    yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    cyan:   "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className={`font-black text-white ${big ? "text-3xl" : "text-2xl"}`}>{value ?? "—"}</div>
      <div className="text-xs font-bold mt-1 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
};

const WagerMeter = ({ score }) => {
  const s = Math.min(10, Math.max(0, score || 0));
  const pct = (s / 10) * 100;
  const color = s >= 7 ? "#4ade80" : s >= 5 ? "#facc15" : "#f87171";
  const label = s >= 8 ? "🔥 HOT PICK" : s >= 6 ? "✅ SOLID BET" : s >= 4 ? "⚠️ RISKY" : "❌ AVOID";
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800/60 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Wager Rating</span>
        <span className="text-lg font-black text-white">{s}/10</span>
      </div>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="text-sm font-black" style={{ color }}>{label}</div>
    </div>
  );
};

export default function PlayerStats() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [player, setPlayer] = useState(null);

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier } = useFreeLookupTracker();

  const handleSearch = async (query) => {
    if (!canLookup()) { setShowLimitModal(true); return; }
    setIsSearching(true);
    setError(null);
    setPlayer(null);
    try {
      const resp = await fetch('/api/getPlayerStats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Player not found');
      if (!result.player_name) throw new Error("Player not found. Try full name.");
      recordLookup();
      setPlayer(result);
    } catch (err) {
      setError(err.message || "Search failed. Please try again.");
    }
    setIsSearching(false);
  };

  const stats = player?.stats?.key_stats || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <FreeLookupModal show={showLimitModal} onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} />

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-12 pb-5 sticky top-0 z-20">
        <button onClick={() => navigate(createPageUrl("Dashboard"))}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 min-h-[44px] -ml-1 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-black">Player Stats</h1>
            <p className="text-xs text-gray-500">Live data · AI analysis · Wager ratings</p>
          </div>
          {!isAuthenticated && (
            <div className="ml-auto flex items-center gap-1.5 bg-lime-500/10 border border-lime-500/20 rounded-xl px-3 py-1.5">
              <Zap className="w-3.5 h-3.5 text-lime-400" />
              <span className="text-xs font-black text-lime-400">{lookupsRemaining} left</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-black text-white text-lg">Pulling Live Data</p>
              <p className="text-gray-500 text-sm mt-1">BallDontLie · TheSportsDB · AI Analysis</p>
            </div>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {player && !isSearching && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Player Hero */}
              <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-purple-300 uppercase tracking-widest mb-1">{player.sport} · {player.position}</div>
                    <h2 className="text-3xl font-black text-white leading-tight">{player.player_name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-purple-200 font-semibold">{player.team}</span>
                      {player.jersey_number && (
                        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-black">#{player.jersey_number}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-5xl font-black text-white/20 select-none">{player.jersey_number || "—"}</div>
                </div>
                <div className="mt-4 bg-black/20 rounded-xl p-3">
                  <p className="text-sm text-purple-100 leading-relaxed">{player.ai_insight}</p>
                </div>
              </div>

              {/* Key Stats Grid */}
              {stats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-lime-400" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Season Stats · {player.stats?.season}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {stats.map((s, i) => {
                      const colors = ["lime","purple","blue","orange","green","cyan","yellow","red"];
                      return <StatCard key={i} label={s.label} value={s.value} color={colors[i % colors.length]} />;
                    })}
                  </div>
                </div>
              )}

              {/* Wager Rating */}
              {player.wager_rating && (
                <WagerMeter score={player.wager_rating.score} />
              )}

              {/* Recent Form */}
              {player.recent_form && (
                <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-black text-white">Recent Form</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{player.recent_form}</p>
                </div>
              )}

              {/* Next Game */}
              {player.next_game?.opponent && (
                <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-black text-white">Next Game</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">vs {player.next_game.opponent}</p>
                      <p className="text-gray-400 text-sm">{player.next_game.date} · {player.next_game.time}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{player.next_game.location}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              )}

              {/* Wager Note */}
              {player.wager_rating?.note && (
                <div className="rounded-2xl border border-lime-500/20 bg-lime-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-lime-400" />
                    <span className="text-sm font-black text-lime-400">Analyst Note</span>
                  </div>
                  <p className="text-gray-300 text-sm">{player.wager_rating.note}</p>
                </div>
              )}

              {/* Data source badge */}
              <div className="text-center">
                <span className="text-[10px] text-gray-600 font-medium">
                  📡 {player.data_source || "Live Sports Data + AI Analysis"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
