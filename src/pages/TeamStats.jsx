import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Zap, Shield, Target, TrendingUp, Calendar, Activity, Star, AlertCircle, ChevronRight, Users } from "lucide-react";
import TeamSearchBar from "../components/team/TeamSearchBar";
import { useFreeLookupTracker, FreeLookupModal } from "../components/auth/FreeLookupTracker";
import { motion, AnimatePresence } from "framer-motion";

const StatCard = ({ label, value, color = "blue" }) => {
  const colors = {
    blue:   "border-blue-500/30 bg-blue-500/10 text-blue-400",
    green:  "border-green-500/30 bg-green-500/10 text-green-400",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    lime:   "border-lime-500/30 bg-lime-500/10 text-lime-400",
    red:    "border-red-500/30 bg-red-500/10 text-red-400",
    cyan:   "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-2xl font-black text-white">{value ?? "—"}</div>
      <div className="text-xs font-bold mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
};

const WagerMeter = ({ score }) => {
  const s = Math.min(10, Math.max(0, score || 0));
  const color = s >= 7 ? "#4ade80" : s >= 5 ? "#facc15" : "#f87171";
  const label = s >= 8 ? "🔥 HOT PICK" : s >= 6 ? "✅ SOLID BET" : s >= 4 ? "⚠️ RISKY" : "❌ AVOID";
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800/60 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Wager Rating</span>
        <span className="text-lg font-black text-white">{s}/10</span>
      </div>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(s/10)*100}%`, backgroundColor: color }} />
      </div>
      <div className="text-sm font-black" style={{ color }}>{label}</div>
    </div>
  );
};

export default function TeamStats() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [team, setTeam] = useState(null);
  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup } = useFreeLookupTracker();

  const handleSearch = async (query) => {
    if (!canLookup()) { setShowLimitModal(true); return; }
    setIsSearching(true);
    setError(null);
    setTeam(null);
    try {
      const resp = await fetch('/api/getTeamStats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Team not found');
      if (!result.team_name) throw new Error("Team not found. Try full team name.");
      recordLookup();
      setTeam(result);
    } catch (err) {
      setError(err.message || "Search failed. Please try again.");
    }
    setIsSearching(false);
  };

  const stats = team?.stats?.key_stats || [];

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
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black">Team Stats</h1>
            <p className="text-xs text-gray-500">Live records · Odds · AI breakdown</p>
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
          <TeamSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-black text-white text-lg">Pulling Team Data</p>
              <p className="text-gray-500 text-sm mt-1">BallDontLie · TheSportsDB · Live Odds</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {team && !isSearching && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Team Hero */}
              <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-blue-300 uppercase tracking-widest mb-1">{team.sport} · {team.league}</div>
                    <h2 className="text-3xl font-black text-white leading-tight">{team.team_name}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-2xl font-black text-white">{team.record?.display || "—"}</span>
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-bold">{team.standing}</span>
                    </div>
                  </div>
                  <Shield className="w-16 h-16 text-white/10" />
                </div>
                <div className="mt-4 bg-black/20 rounded-xl p-3">
                  <p className="text-sm text-blue-100 leading-relaxed">{team.ai_insight}</p>
                </div>
              </div>

              {/* Key Stats */}
              {stats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-lime-400" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Season Stats · {team.stats?.season}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {stats.map((s, i) => {
                      const colors = ["blue","green","orange","purple","lime","cyan","red"];
                      return <StatCard key={i} label={s.label} value={s.value} color={colors[i % colors.length]} />;
                    })}
                  </div>
                </div>
              )}

              {/* Wager Rating */}
              {team.wager_rating && <WagerMeter score={team.wager_rating.score} />}

              {/* Recent Form */}
              {team.recent_form && (
                <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-black text-white">Recent Form</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{team.recent_form}</p>
                </div>
              )}

              {/* Key Players */}
              {team.key_players?.length > 0 && (
                <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-black text-white">Key Players</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {team.key_players.map((p, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300 font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Game + Odds */}
              {team.next_game?.opponent && (
                <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-black text-white">Next Game</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">vs {team.next_game.opponent}</p>
                      <p className="text-gray-400 text-sm">{team.next_game.date} · {team.next_game.time}</p>
                      <p className="text-gray-500 text-xs">{team.next_game.location}</p>
                    </div>
                    {team.next_game.odds && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">DraftKings</div>
                        <div className="text-sm font-black text-lime-400">{team.next_game.odds}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analyst Note */}
              {team.wager_rating?.note && (
                <div className="rounded-2xl border border-lime-500/20 bg-lime-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-lime-400" />
                    <span className="text-sm font-black text-lime-400">Analyst Note</span>
                  </div>
                  <p className="text-gray-300 text-sm">{team.wager_rating.note}</p>
                </div>
              )}

              <div className="text-center">
                <span className="text-[10px] text-gray-600">📡 {team.data_source || "Live Sports Data + AI Analysis"}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
