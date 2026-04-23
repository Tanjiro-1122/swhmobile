import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Zap, Shield, TrendingUp, Calendar, Activity,
  Star, AlertCircle, Target, Flame, Users, BarChart2
} from "lucide-react";
import TeamSearchBar from "../components/team/TeamSearchBar";
import { useFreeLookupTracker, FreeLookupModal } from "../components/auth/FreeLookupTracker";
import { motion, AnimatePresence } from "framer-motion";

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

const StatPill = ({ label, value, accent }) => {
  const accents = {
    blue:"text-blue-400", green:"text-green-400", orange:"text-orange-400",
    purple:"text-purple-400", lime:"text-lime-400", cyan:"text-cyan-400",
    yellow:"text-yellow-400", red:"text-red-400",
  };
  return (
    <div className="flex flex-col items-center bg-gray-800/60 border border-gray-700/60 rounded-2xl px-3 py-4 min-w-[80px]">
      <span className={`text-xl font-black ${accents[accent] || "text-white"}`}>{value ?? "—"}</span>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1 text-center leading-tight">{label}</span>
    </div>
  );
};

const RecordBadge = ({ label, value }) => (
  <div className="flex flex-col items-center bg-white/10 rounded-xl px-3 py-2">
    <span className="text-lg font-black text-white">{value || "—"}</span>
    <span className="text-[10px] text-blue-200/70 uppercase font-bold tracking-wide">{label}</span>
  </div>
);

const ACCENT_CYCLE = ["blue","green","orange","purple","lime","cyan","yellow","red"];

export default function TeamStats() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError]             = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [team, setTeam]               = useState(null);
  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup } = useFreeLookupTracker();

  const handleSearch = async (query) => {
    if (!canLookup()) { setShowModal(true); return; }
    setIsSearching(true);
    setError(null);
    setTeam(null);
    try {
      const r = await fetch("/api/getTeamStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Team not found");
      if (!data.team_name) throw new Error("Team not found — try full team name.");
      recordLookup();
      setTeam(data);
    } catch (e) {
      setError(e.message || "Search failed. Please try again.");
    }
    setIsSearching(false);
  };

  const stats = team?.stats?.key_stats || [];

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
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-black leading-none">Team Report</h1>
              <p className="text-[10px] text-gray-500 mt-0.5">AI predictions · Lines · Bet breakdown</p>
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
        {/* Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <TeamSearchBar onSearch={handleSearch} isSearching={isSearching} />
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
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="font-black text-white">Building Team Report…</p>
            <p className="text-gray-500 text-xs">Live data + odds + AI analysis</p>
          </div>
        )}

        {/* ── REPORT ── */}
        <AnimatePresence>
          {team && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >

              {/* ① HERO — team identity + record */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                      {team.sport}
                    </span>
                    <span className="text-[10px] text-blue-300/60 font-bold">{team.league}</span>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-none">{team.team_name}</h2>
                  {team.standing && (
                    <p className="text-blue-200 text-sm font-semibold mt-1">{team.standing}</p>
                  )}
                  <div className="flex gap-3 mt-3">
                    <RecordBadge label="Overall" value={team.record?.display} />
                    {team.home_record && <RecordBadge label="Home" value={team.home_record} />}
                    {team.away_record && <RecordBadge label="Away" value={team.away_record} />}
                  </div>
                </div>
              </div>

              {/* ② AI PREDICTION */}
              <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-black text-white uppercase tracking-wide">AI Prediction</span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{team.ai_insight}</p>
                {team.next_game?.matchup_edge && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Matchup Edge</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{team.next_game.matchup_edge}</p>
                  </div>
                )}
              </div>

              {/* ③ BEST BET */}
              {team.best_bet?.pick && (
                <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/8 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-black text-yellow-400 uppercase tracking-wide">Best Bet</span>
                    </div>
                    <ConfBadge conf={team.best_bet.confidence} />
                  </div>
                  <p className="text-xl font-black text-white mb-1">{team.best_bet.pick}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{team.best_bet.reasoning}</p>
                </div>
              )}

              {/* ④ LIVE LINES */}
              {team.betting_lines && (
                team.betting_lines.moneyline !== "N/A" ||
                team.betting_lines.spread !== "N/A" ||
                team.betting_lines.total !== "N/A"
              ) && (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-lime-400" />
                    <span className="text-sm font-black text-white">Live Lines</span>
                    {team.betting_lines.next_opponent && (
                      <span className="ml-auto text-xs text-gray-500">vs {team.betting_lines.next_opponent}</span>
                    )}
                  </div>
                  <div className="divide-y divide-gray-800/60">
                    {[
                      { label: "Moneyline", val: team.betting_lines.moneyline },
                      { label: "Spread",    val: team.betting_lines.spread },
                      { label: "Total",     val: team.betting_lines.total },
                    ].filter(l => l.val && l.val !== "N/A").map((l, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm font-bold text-gray-400">{l.label}</span>
                        <span className="text-sm font-black text-white">{l.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ⑤ TEAM BET BREAKDOWN */}
              {team.team_bets?.length > 0 && (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-lime-400" />
                    <span className="text-sm font-black text-white">Bet Breakdown</span>
                  </div>
                  <div className="divide-y divide-gray-800/60">
                    {team.team_bets.map((b, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{b.market}</span>
                          </div>
                          <p className="text-lime-300 text-xs font-bold mt-0.5">{b.pick}</p>
                          {b.odds && <p className="text-gray-500 text-[10px]">Odds: {b.odds}</p>}
                          <p className="text-gray-500 text-xs mt-0.5 leading-snug">{b.reasoning}</p>
                        </div>
                        <ConfBadge conf={b.confidence} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ⑥ SEASON STATS */}
              {stats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      {team.stats?.season || "Season"} Stats
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {stats.map((s, i) => (
                      <StatPill key={i} label={s.label} value={s.value} accent={ACCENT_CYCLE[i % ACCENT_CYCLE.length]} />
                    ))}
                  </div>
                </div>
              )}

              {/* ⑦ WAGER RATING */}
              <WagerBar score={team.wager_rating?.score} />

              {/* ⑧ RECENT FORM */}
              {team.recent_form && (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-black text-white">Recent Form</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{team.recent_form}</p>
                </div>
              )}

              {/* ⑨ KEY PLAYERS */}
              {team.key_players?.length > 0 && (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-black text-white">Key Players</span>
                  </div>
                  <div className="space-y-1.5">
                    {team.key_players.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-purple-500 text-xs">▸</span>
                        <span className="text-gray-300 text-sm">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ⑩ INJURIES */}
              {team.injuries && team.injuries !== "No significant injuries reported" && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-black text-orange-400">Injury Report</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{team.injuries}</p>
                </div>
              )}

              {/* ⑪ NEXT GAME */}
              {team.next_game?.opponent && (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-black text-white">Next Game</span>
                    <span className="ml-auto text-xs font-bold text-gray-600">{team.next_game.location}</span>
                  </div>
                  <p className="text-lg font-black text-white">vs {team.next_game.opponent}</p>
                  <p className="text-gray-400 text-sm">{team.next_game.date}</p>
                  {team.next_game.time && <p className="text-gray-500 text-xs">{team.next_game.time}</p>}
                  {team.next_game.venue && <p className="text-gray-600 text-xs mt-0.5">{team.next_game.venue}</p>}
                  {team.wager_rating?.note && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <p className="text-xs text-gray-500 leading-snug">{team.wager_rating.note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ⑫ SOURCE */}
              <div className="flex items-center justify-center gap-2 pt-1 pb-2">
                {team._cache_hit && (
                  <span className="text-[10px] text-green-600 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">
                    ⚡ Cached
                  </span>
                )}
                <span className="text-[10px] text-gray-600">
                  📡 {team.data_source || "Live Data + AI"}
                </span>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
