import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Zap, Trophy, TrendingUp, Calendar, Activity,
  Star, AlertCircle, Target, Flame, ShieldAlert, CheckCircle2, XCircle, MinusCircle
} from "lucide-react";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import { useFreeLookupTracker, FreeLookupModal } from "../components/auth/FreeLookupTracker";
import { motion, AnimatePresence } from "framer-motion";

// ── Confidence badge ────────────────────────────────────────────────────────
const ConfBadge = ({ conf }) => {
  if (!conf) return null;
  const map = {
    High:   "bg-green-500/20 text-green-400 border-green-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Low:    "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${map[conf] || map.Medium}`}>
      {conf}
    </span>
  );
};

// ── Over/Under chip ─────────────────────────────────────────────────────────
const OUChip = ({ rec }) => {
  if (!rec) return null;
  const isOver = rec.toUpperCase().includes("OVER");
  return (
    <span className={`text-xs font-black px-3 py-1 rounded-lg ${isOver ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
      {isOver ? "▲ OVER" : "▼ UNDER"}
    </span>
  );
};

// ── Wager meter bar ─────────────────────────────────────────────────────────
const WagerBar = ({ score }) => {
  const s = Math.min(10, Math.max(0, score || 0));
  const color = s >= 7 ? "#4ade80" : s >= 5 ? "#facc15" : "#f87171";
  const emoji = s >= 8 ? "🔥" : s >= 6 ? "✅" : s >= 4 ? "⚠️" : "❌";
  const label = s >= 8 ? "HOT PICK" : s >= 6 ? "SOLID BET" : s >= 4 ? "RISKY" : "AVOID";
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">AI Wager Rating</span>
        <span className="text-2xl font-black text-white">{s}<span className="text-gray-500 text-base">/10</span></span>
      </div>
      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(s/10)*100}%`, backgroundColor: color }} />
      </div>
      <p className="text-sm font-black" style={{ color }}>{emoji} {label}</p>
    </div>
  );
};

// ── Stat pill ────────────────────────────────────────────────────────────────
const StatPill = ({ label, value, accent }) => {
  const accents = {
    green:  "text-green-400",
    blue:   "text-blue-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
    lime:   "text-lime-400",
    cyan:   "text-cyan-400",
    yellow: "text-yellow-400",
    red:    "text-red-400",
  };
  return (
    <div className="flex flex-col items-center bg-gray-800/60 border border-gray-700/60 rounded-2xl px-3 py-4 min-w-[80px]">
      <span className={`text-xl font-black ${accents[accent] || "text-white"}`}>{value ?? "—"}</span>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1 text-center leading-tight">{label}</span>
    </div>
  );
};

const ACCENT_CYCLE = ["lime","blue","purple","orange","green","cyan","yellow","red"];

export default function PlayerStats() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError]             = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [player, setPlayer]           = useState(null);

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup } = useFreeLookupTracker();

  const handleSearch = async (query) => {
    if (!canLookup()) { setShowModal(true); return; }
    setIsSearching(true);
    setError(null);
    setPlayer(null);
    try {
      const r = await fetch("/api/getPlayerStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Player not found");
      if (!data.player_name) throw new Error("Player not found — try full name.");
      recordLookup();
      setPlayer(data);
    } catch (e) {
      setError(e.message || "Search failed. Please try again.");
    }
    setIsSearching(false);
  };

  const stats = player?.stats?.key_stats || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      <FreeLookupModal show={showModal} onClose={() => setShowModal(false)}
        lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} />

      {/* ── Header ── */}
      <div className="bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 pt-12 pb-4 sticky top-0 z-20">
        <button onClick={() => navigate(createPageUrl("Dashboard"))}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 transition-colors min-h-[44px] -ml-1">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Dashboard</span>
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-black leading-none">Player Report</h1>
              <p className="text-[10px] text-gray-500 mt-0.5">AI predictions · Props · Wager ratings</p>
            </div>
          </div>
          {!isAuthenticated && (
            <div className="flex items-center gap-1 bg-lime-500/10 border border-lime-500/20 rounded-xl px-2.5 py-1.5">
              <Zap className="w-3 h-3 text-lime-400" />
              <span className="text-xs font-black text-lime-400">{lookupsRemaining} left</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Search bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="font-black text-white">Building Scouting Report…</p>
            <p className="text-gray-500 text-xs">Live data + AI analysis</p>
          </div>
        )}

        {/* ── REPORT ── */}
        <AnimatePresence>
          {player && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >

              {/* ① HERO CARD */}
              <div className="rounded-2xl bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-800 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                      {player.sport}
                    </span>
                    <span className="text-[10px] font-bold text-purple-300/70">{player.position}</span>
                    {player.jersey_number && (
                      <span className="text-[10px] font-black text-white/60 ml-auto">#{player.jersey_number}</span>
                    )}
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-none">{player.player_name}</h2>
                  <p className="text-purple-200 text-sm font-semibold mt-1">{player.team}</p>
                  {player.injury_status && player.injury_status !== "Healthy" && (
                    <div className="mt-2 flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/30 rounded-xl px-3 py-1.5 w-fit">
                      <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs font-bold text-orange-300">{player.injury_status}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ② AI PREDICTION — what they'll do next game */}
              <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-black text-white uppercase tracking-wide">AI Prediction</span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{player.ai_insight}</p>
                {player.next_game?.matchup_edge && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1">Matchup Edge</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{player.next_game.matchup_edge}</p>
                  </div>
                )}
              </div>

              {/* ③ BEST BET — the #1 play */}
              {player.best_bet?.pick && (
                <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/8 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-black text-yellow-400 uppercase tracking-wide">Best Bet</span>
                    </div>
                    <ConfBadge conf={player.best_bet.confidence} />
                  </div>
                  <p className="text-xl font-black text-white mb-1">{player.best_bet.pick}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{player.best_bet.reasoning}</p>
                </div>
              )}

              {/* ④ PROP BET TABLE */}
              {player.prop_bets?.length > 0 && (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-lime-400" />
                    <span className="text-sm font-black text-white">Prop Bet Predictions</span>
                  </div>
                  <div className="divide-y divide-gray-800/60">
                    {player.prop_bets.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-white truncate">{p.market}</span>
                            {p.line && (
                              <span className="text-xs text-gray-500 font-semibold shrink-0">Line: {p.line}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{p.reasoning}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <OUChip rec={p.recommendation} />
                          <ConfBadge conf={p.confidence} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ⑤ SEASON STATS */}
              {stats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      {player.stats?.season || "Season"} Stats
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {stats.map((s, i) => (
                      <StatPill key={i} label={s.label} value={s.value} accent={ACCENT_CYCLE[i % ACCENT_CYCLE.length]} />
                    ))}
                  </div>
                </div>
              )}

              {/* ⑥ WAGER RATING BAR */}
              <WagerBar score={player.wager_rating?.score} />

              {/* ⑦ RECENT FORM */}
              {player.recent_form && (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-black text-white">Recent Form</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{player.recent_form}</p>
                </div>
              )}

              {/* ⑧ NEXT GAME */}
              {player.next_game?.opponent && (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-black text-white">Next Game</span>
                    <span className="ml-auto text-xs font-bold text-gray-600">{player.next_game.location}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-lg font-black text-white">vs {player.next_game.opponent}</p>
                      <p className="text-gray-400 text-sm">{player.next_game.date}</p>
                      {player.next_game.time && <p className="text-gray-500 text-xs">{player.next_game.time}</p>}
                    </div>
                    {player.wager_rating?.note && (
                      <div className="text-right max-w-[45%]">
                        <p className="text-[10px] text-gray-600 leading-snug">{player.wager_rating.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ⑨ SOURCE + CACHE BADGE */}
              <div className="flex items-center justify-center gap-2 pt-1 pb-2">
                {player._cache_hit && (
                  <span className="text-[10px] text-green-600 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">
                    ⚡ Cached
                  </span>
                )}
                <span className="text-[10px] text-gray-600">
                  📡 {player.data_source || "Live Data + AI"}
                </span>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
