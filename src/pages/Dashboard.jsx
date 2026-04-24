import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePlatform } from "@/components/hooks/usePlatform";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Crown, BarChart2, Users, User, Star, Flame, Shield,
  ChevronRight, Lock, LogOut, TrendingUp, DollarSign,
  Calculator, BookOpen, Target, Brain, Newspaper,
  Activity, RefreshCw, Clock, AlertCircle, Trophy,
  Swords, BarChart3, MessageSquare
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useFreeLookupTracker, FreeLookupModal } from "@/components/auth/FreeLookupTracker";

const SAL_IMG = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg";
const SWH_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png";
const ADMIN_EMAILS = ["huertasfam@gmail.com", "huertasfam1@icloud.com", "huertasfam"];
const SPORT_KEYS = ["basketball_nba","americanfootball_nfl","baseball_mlb","icehockey_nhl"];
const SPORT_LABELS = { basketball_nba:"NBA", americanfootball_nfl:"NFL", baseball_mlb:"MLB", icehockey_nhl:"NHL" };
const SPORT_EMOJI  = { basketball_nba:"🏀", americanfootball_nfl:"🏈", baseball_mlb:"⚾", icehockey_nhl:"🏒" };

function getDisplayName(user) {
  const storedName = (() => { try { return localStorage.getItem("swh_full_name") || null; } catch { return null; } })();
  if (!user) return storedName ? storedName.split(" ")[0] : null;
  const name = user.full_name || "";
  const badNames = ["SWH User", "User", ""];
  const isAppleId = name.startsWith("Apple_0") || name.includes("@privaterelay") || name.length > 40;
  if (name && !badNames.includes(name) && !isAppleId) return name.split(" ")[0];
  if (storedName) return storedName.split(" ")[0];
  if (user.email && !user.email.includes("privaterelay")) {
    const prefix = user.email.split("@")[0];
    if (!prefix.startsWith("apple_")) return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return null;
}
function isAdmin(user) {
  if (!user) return false;
  const email = (user.email || "").toLowerCase();
  const userId = (user.apple_user_id || user.user_id || user.id || "").toLowerCase();
  const name = (user.full_name || user.name || user.displayName || "").toLowerCase();
  return ADMIN_EMAILS.some(a => {
    const al = a.toLowerCase();
    return email.includes(al) || userId.includes(al) || name.includes(al);
  });
}

// ─── Sidebar nav items ──────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "CORE",
    items: [
      { id: "dashboard", label: "Dashboard", icon: BarChart2, page: "Dashboard", color: "lime" },
      { id: "sal", label: "Ask S.A.L.", icon: Brain, page: "AskSAL", color: "purple", badge: "AI" },
      { id: "analysis", label: "Analysis Hub", icon: Swords, page: "AnalysisHub", color: "yellow" },
    ]
  },
  {
    label: "STATS",
    items: [
      { id: "player", label: "Player Stats", icon: Users, page: "PlayerStats", color: "cyan" },
      { id: "team", label: "Team Stats", icon: Shield, page: "TeamStats", color: "blue" },
      { id: "live", label: "Live Odds", icon: Activity, page: "LiveOdds", color: "red", badge: "LIVE" },
      { id: "news", label: "News & Scores", icon: Newspaper, page: "SportsNewsTicker", color: "orange" },
    ]
  },
  {
    label: "TOOLS",
    items: [
      { id: "parlay", label: "Parlay Builder", icon: Zap, page: "AIParlayBuilder", color: "lime" },
      { id: "roi", label: "ROI Tracker", icon: TrendingUp, page: "ROITracker", color: "green" },
      { id: "bankroll", label: "Bankroll", icon: DollarSign, page: "BankrollManager", color: "emerald" },
      { id: "calc", label: "Bet Calculator", icon: Calculator, page: "BettingCalculator", color: "slate" },
    ]
  },
  {
    label: "MORE",
    items: [
      { id: "community", label: "Community", icon: MessageSquare, page: "CommunityHub", color: "pink" },
      { id: "briefs", label: "Daily Briefs", icon: BookOpen, page: "DailyBriefs", color: "indigo" },
      { id: "saved", label: "Saved Results", icon: Star, page: "SavedResults", color: "yellow" },
      { id: "pricing", label: "Pricing / Upgrade", icon: Crown, page: "Pricing", color: "purple" },
    ]
  },
];

const COLOR_MAP = {
  lime:    { bg: "bg-lime-500/10",    border: "border-lime-500/20",    text: "text-lime-400",    dot: "bg-lime-400" },
  purple:  { bg: "bg-purple-500/10",  border: "border-purple-500/20",  text: "text-purple-400",  dot: "bg-purple-400" },
  yellow:  { bg: "bg-yellow-500/10",  border: "border-yellow-500/20",  text: "text-yellow-400",  dot: "bg-yellow-400" },
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    text: "text-cyan-400",    dot: "bg-cyan-400" },
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    dot: "bg-blue-400" },
  red:     { bg: "bg-red-500/10",     border: "border-red-500/20",     text: "text-red-400",     dot: "bg-red-400" },
  orange:  { bg: "bg-orange-500/10",  border: "border-orange-500/20",  text: "text-orange-400",  dot: "bg-orange-400" },
  green:   { bg: "bg-green-500/10",   border: "border-green-500/20",   text: "text-green-400",   dot: "bg-green-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
  slate:   { bg: "bg-slate-500/10",   border: "border-slate-500/20",   text: "text-slate-400",   dot: "bg-slate-400" },
  pink:    { bg: "bg-pink-500/10",    border: "border-pink-500/20",    text: "text-pink-400",    dot: "bg-pink-400" },
  indigo:  { bg: "bg-indigo-500/10",  border: "border-indigo-500/20",  text: "text-indigo-400",  dot: "bg-indigo-400" },
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ activePage, navigate, user, onLogout, credits, isPaid }) {
  const displayName = getDisplayName(user);
  return (
    <aside className="flex flex-col w-full h-full bg-gray-900 border-r border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="relative">
          <div className="absolute inset-0 bg-lime-500/30 rounded-xl blur-md" />
          <img src={SWH_LOGO} alt="SWH" className="relative w-9 h-9 rounded-xl border border-lime-500/30 object-cover" />
        </div>
        <div>
          <p className="text-white font-black text-sm leading-tight">Sports Wager</p>
          <p className="text-lime-400 font-black text-sm leading-tight">Helper</p>
        </div>
      </div>

      {/* User card */}
      <div className="mx-3 mt-3 mb-2 bg-gray-800 rounded-2xl p-3 border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-700 flex items-center justify-center font-black text-white text-sm">
            {displayName ? displayName[0].toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{displayName || "Guest"}</p>
            <p className="text-gray-500 text-xs">{isPaid ? "✨ Pro Member" : "Free Plan"}</p>
          </div>
          <button onClick={() => navigate(createPageUrl("Pricing"))}
            className="flex items-center gap-1 bg-gray-700 rounded-lg px-2 py-1">
            <Zap className="w-3 h-3 text-lime-400" />
            <span className="text-xs font-black text-white">{isPaid ? "∞" : credits}</span>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-black text-gray-600 tracking-widest px-2 mb-1">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const c = COLOR_MAP[item.color];
                const active = activePage === item.page;
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => navigate(createPageUrl(item.page))}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group
                      ${active ? `${c.bg} ${c.border} border` : "hover:bg-gray-800 border border-transparent"}`}>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? c.text : "text-gray-500 group-hover:text-gray-300"}`} />
                    <span className={`text-sm font-semibold flex-1 ${active ? "text-white" : "text-gray-400 group-hover:text-white"}`}>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${item.badge === "LIVE" ? "bg-red-500 text-white animate-pulse" : "bg-purple-500 text-white"}`}>{item.badge}</span>
                    )}
                    {active && <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-gray-800">
        {isAdmin(user) && (
          <button onClick={() => navigate(createPageUrl("AdminPanel"))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-yellow-500/10 text-yellow-400 text-sm font-semibold mb-1 transition-colors">
            <Crown className="w-4 h-4" /> Admin Panel
          </button>
        )}
        <button onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 text-sm font-semibold transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Live odds strip ─────────────────────────────────────────────────────────
function OddsStrip() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("basketball_nba");
  const scrollRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setGames([]);
    fetch(`/api/getLiveOdds?sport=${sport}`)
      .then(r => r.json())
      .then(d => { setGames((d.games || []).slice(0, 8)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sport]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Sport tabs */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
        <Activity className="w-4 h-4 text-red-400 flex-shrink-0 mr-1" />
        <span className="text-xs font-black text-red-400 uppercase tracking-wider flex-shrink-0 mr-3">Live Odds</span>
        {SPORT_KEYS.map(k => (
          <button key={k} onClick={() => setSport(k)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${sport === k ? "bg-lime-500/20 text-lime-400 border border-lime-500/30" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"}`}>
            <span>{SPORT_EMOJI[k]}</span>
            <span>{SPORT_LABELS[k]}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {loading && (
          <div className="flex items-center justify-center py-6 w-full">
            <RefreshCw className="w-5 h-5 text-gray-600 animate-spin" />
            <span className="text-gray-600 text-sm ml-2">Fetching live odds...</span>
          </div>
        )}
        {!loading && games.length === 0 && (
          <div className="flex items-center gap-2 py-4 text-gray-600 text-sm">
            <Clock className="w-4 h-4" />
            No games scheduled right now — check back soon.
          </div>
        )}
        {games.map((game, i) => {
          const dk = game.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
          const home = dk.find(o => o.name === game.home_team);
          const away = dk.find(o => o.name === game.away_team);
          const spread = game.bookmakers?.[0]?.markets?.find(m => m.key === "spreads")?.outcomes || [];
          const homeSpread = spread.find(o => o.name === game.home_team);
          const awaySpread = spread.find(o => o.name === game.away_team);
          const gameTime = game.commence_time ? new Date(game.commence_time) : null;
          const timeStr = gameTime ? gameTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : "TBD";

          return (
            <div key={i} className="flex-shrink-0 w-64 bg-gray-800 border border-gray-700 rounded-2xl p-4 hover:border-lime-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{SPORT_LABELS[sport]}</span>
                <span className="text-[10px] text-gray-600">{timeStr}</span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-semibold truncate flex-1 mr-2">{game.away_team?.split(' ').pop()}</span>
                  <div className="flex gap-2">
                    {away && <span className={`text-xs font-black ${away.price > 0 ? "text-green-400" : "text-red-400"}`}>{away.price > 0 ? "+" : ""}{away.price}</span>}
                    {awaySpread && <span className="text-xs text-gray-500">{awaySpread.point > 0 ? "+" : ""}{awaySpread.point}</span>}
                  </div>
                </div>
                <div className="h-px bg-gray-700" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-semibold truncate flex-1 mr-2">{game.home_team?.split(' ').pop()}</span>
                  <div className="flex gap-2">
                    {home && <span className={`text-xs font-black ${home.price > 0 ? "text-green-400" : "text-red-400"}`}>{home.price > 0 ? "+" : ""}{home.price}</span>}
                    {homeSpread && <span className="text-xs text-gray-500">{homeSpread.point > 0 ? "+" : ""}{homeSpread.point}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                <span>🏦</span><span>DraftKings</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SAL Quick Chat ───────────────────────────────────────────────────────────
function SalQuickChat({ navigate }) {
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { canLookup, recordLookup, lookupsRemaining, isAuthenticated, userTier } = useFreeLookupTracker();

  const PROMPTS = [
    "Best bet tonight?",
    "NBA underdog pick?",
    "NFL value play this week?",
    "MLB hot streak player?",
  ];

  const ask = async (q) => {
    const question = q || msg.trim();
    if (!question) return;

    // ── GATE: check lookup allowance before hitting the API ──
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    setReply("");
    try {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const resp = await fetch('/api/sal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `[Today: ${today}]\n\n${question}`, history: [] }),
      });
      const data = await resp.json();
      setReply(data.reply || "S.A.L. is thinking...");
      // ── RECORD: deduct only after a successful response ──
      recordLookup();
    } catch {
      setReply("The archives are temporarily unavailable. Try again in a moment.");
    }
    setLoading(false);
    setMsg("");
  };

  // Free-user lookup badge for the widget header
  const isPaidTier = ['legacy','vip_annual','premium_monthly','influencer',
    'unlimited_monthly','unlimited_yearly','half_year','basic_monthly'].includes(userTier);

  return (
    <>
    <FreeLookupModal show={showLimitModal} onClose={() => setShowLimitModal(false)}
      lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} />
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-purple-500/40 rounded-xl blur-md" />
          <img src={SAL_IMG} alt="S.A.L." className="relative w-10 h-10 rounded-xl object-cover border border-purple-500/40" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-black text-sm">S.A.L. — Sports Analysis & Logic</h3>
          <p className="text-gray-500 text-xs">Your AI sports detective • Live odds aware</p>
        </div>
        <button onClick={() => navigate(createPageUrl("AskSAL"))}
          className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
          Full chat <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide">
        {PROMPTS.map(p => (
          <button key={p} onClick={() => ask(p)} disabled={loading}
            className="flex-shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-purple-500/10 border border-gray-700 hover:border-purple-500/30 rounded-xl text-xs text-gray-300 hover:text-purple-300 font-medium transition-all disabled:opacity-40">
            {p}
          </button>
        ))}
      </div>

      {/* Reply area */}
      <div className="px-5 pb-3 min-h-[80px]">
        {loading && (
          <div className="flex items-center gap-2 py-3">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-purple-400"
                  animate={{ scale: [1,1.4,1], opacity: [0.5,1,0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
            <span className="text-gray-500 text-xs">S.A.L. is investigating...</span>
          </div>
        )}
        {reply && !loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-2xl rounded-tl-sm p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🦉</span>
              <span className="text-xs font-bold text-purple-400">S.A.L.</span>
            </div>
            <div className="prose prose-invert prose-xs max-w-none text-gray-300 text-sm leading-relaxed">
              <ReactMarkdown>{reply}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 pb-4">
        <div className="flex gap-2">
          <input value={msg} onChange={e => setMsg(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && msg.trim()) ask(); }}
            disabled={loading}
            placeholder="Ask S.A.L. anything..."
            className="flex-1 bg-gray-800 border border-gray-700 focus:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none transition-colors disabled:opacity-40" />
          <button onClick={() => ask()} disabled={!msg.trim() || loading}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-all active:scale-95">
            Ask
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

// ─── Feature grid ─────────────────────────────────────────────────────────────
const FEATURE_TILES = [
  { label: "Player Stats",    icon: Users,       page: "PlayerStats",    color: "cyan",    tag: null,      desc: "Search any player. AI analysis.",  webExclusive: false },
  { label: "Team Stats",      icon: Shield,       page: "TeamStats",      color: "blue",    tag: null,      desc: "Full breakdown + wager rating.",   webExclusive: false },
  { label: "Ask S.A.L.",      icon: Brain,        page: "AskSAL",         color: "purple",  tag: "AI",      desc: "Your AI sports detective.",        webExclusive: false },
  { label: "Live Odds",       icon: Activity,     page: "LiveOdds",       color: "red",     tag: "LIVE",    desc: "Real-time odds across sports.",    webExclusive: false },
  { label: "News & Scores",   icon: Flame,        page: "SportsNewsTicker",color:"orange",  tag: null,      desc: "Breaking news & live scores.",    webExclusive: false },
  { label: "Parlay Builder",  icon: Zap,          page: "AIParlayBuilder",color: "lime",    tag: null,      desc: "AI-built parlays, max EV.",        webExclusive: true  },
  { label: "ROI Tracker",     icon: TrendingUp,   page: "ROITracker",     color: "green",   tag: null,      desc: "Track every bet. See your edge.", webExclusive: true  },
  { label: "Bankroll",        icon: DollarSign,   page: "BankrollManager",color: "emerald", tag: null,      desc: "Manage your stakes & limits.",    webExclusive: true  },
  { label: "Bet Calculator",  icon: Calculator,   page: "BettingCalculator",color:"slate",  tag: null,      desc: "Parlay payout & odds math.",      webExclusive: true  },
  { label: "Analysis Hub",    icon: BarChart3,    page: "AnalysisHub",    color: "yellow",  tag: "HOT",     desc: "AI predictions & matchup reads.", webExclusive: true  },
  { label: "Daily Briefs",    icon: BookOpen,     page: "DailyBriefs",    color: "indigo",  tag: null,      desc: "Morning betting briefing.",       webExclusive: true  },
  { label: "Community",       icon: MessageSquare,page: "CommunityHub",   color: "pink",    tag: null,      desc: "Picks, tips & social bets.",      webExclusive: true  },
  { label: "Saved Results",   icon: Star,         page: "SavedResults",   color: "yellow",  tag: null,      desc: "All your past analyses.",         webExclusive: true  },
  { label: "Upgrade",         icon: Crown,        page: "Pricing",        color: "purple",  tag: "PRO",     desc: "Unlimited credits & features.",   webExclusive: false },
  { label: "My Account",      icon: User,         page: "MyAccount",      color: "slate",   tag: null,      desc: "Settings, privacy & delete.",     webExclusive: false },
];

function FeatureGrid({ navigate, isPaid, isIOSNative }) {
  const sorted = [...FEATURE_TILES].sort((a, b) => {
    if (isIOSNative) {
      if (a.webExclusive && !b.webExclusive) return 1;
      if (!a.webExclusive && b.webExclusive) return -1;
    }
    return 0;
  });
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {sorted.map(tile => {
        const c = COLOR_MAP[tile.color] || COLOR_MAP.slate;
        const Icon = tile.icon;
        const locked = tile.webExclusive && isIOSNative;
        return (
          <motion.button key={tile.page}
            whileHover={locked ? {} : { scale: 1.02 }} whileTap={locked ? {} : { scale: 0.97 }}
            onClick={() => { if (!locked) navigate(createPageUrl(tile.page)); }}
            className={`relative text-left rounded-2xl p-4 transition-all group border ${locked ? "bg-gray-900/40 border-gray-800 opacity-50 cursor-default" : `bg-gray-900 hover:${c.border} ${c.border}`}`}>
            {locked && (
              <span className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-400">Web Only</span>
            )}
            {!locked && tile.tag && (
              <span className={`absolute top-3 right-3 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                tile.tag === "LIVE" ? "bg-red-500 text-white animate-pulse" :
                tile.tag === "HOT" ? "bg-orange-500 text-white" :
                tile.tag === "NEW" ? "bg-blue-500 text-white" :
                tile.tag === "PRO" ? "bg-purple-500 text-white" :
                tile.tag === "AI"  ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
              }`}>{tile.tag}</span>
            )}
            <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon className={`w-4.5 h-4.5 ${c.text}`} />
            </div>
            <p className="text-white font-bold text-sm leading-tight">{tile.label}</p>
            <p className="text-gray-500 text-xs mt-1 leading-snug">{tile.desc}</p>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ credits, isPaid }) {
  // credits = lookupsRemaining from hook (0-5 for free, 999 for paid)
  const creditDisplay = isPaid ? "∞" : (credits >= 5 ? "5" : String(credits));
  const creditLabel   = isPaid ? "Unlimited" : `Free Look${credits !== 1 ? "ups" : "up"}`;
  const creditColor   = isPaid ? "text-lime-400" : credits > 2 ? "text-lime-400" : credits > 0 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
        <p className={`text-2xl font-black ${creditColor}`}>{creditDisplay}</p>
        <p className="text-xs text-gray-500 mt-1">{creditLabel}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
        <p className="text-2xl font-black text-purple-400">10+</p>
        <p className="text-xs text-gray-500 mt-1">Sports Covered</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
        <p className="text-2xl font-black text-blue-400">AI</p>
        <p className="text-xs text-gray-500 mt-1">S.A.L. Online</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { isIOSNative, isAndroidNative } = usePlatform();
  const isMobileNative = isIOSNative || isAndroidNative;
  const [greeting, setGreeting] = useState("Welcome");
  const [currentUser, setCurrentUser] = useState(null);
  const [credits, setCredits] = useState(5);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("swh_user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}
    try {
      const stored = localStorage.getItem("swh_user");
      const u = stored ? JSON.parse(stored) : null;
      const fromUser = u?.search_credits ?? u?.credits ?? null;
      const fromKey = parseInt(localStorage.getItem("swh_search_credits") || "0", 10);
      setCredits(fromUser !== null ? fromUser : (fromKey > 0 ? fromKey : 5));
    } catch { setCredits(5); }
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    const sync = () => {
      try {
        const u = JSON.parse(localStorage.getItem("swh_user") || "null");
        const fromUser = u?.search_credits ?? u?.credits ?? null;
        const fromKey = parseInt(localStorage.getItem("swh_search_credits") || "0", 10);
        setCredits(fromUser !== null ? fromUser : (fromKey > 0 ? fromKey : 5));
      } catch {}
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("focus", sync); };
  }, []);

  const handleLogout = async () => {
    // Clear every swh_ key from localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith("swh_"));
    keys.forEach(k => localStorage.removeItem(k));
    // Also clear known explicit keys
    ["swh_user","swh_apple_user_id","swh_user_id","swh_is_premium","swh_plan",
     "swh_email","swh_search_credits","swh_full_name","swh_credits"].forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    // Sign out of base44 auth so Splash doesn't bounce back
    try { await base44.auth.logout(); } catch {}
    // Tell native wrapper to clear its state
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: "SIGN_OUT" }));
    navigate(createPageUrl("Splash"), { replace: true });
  };

  const displayName = getDisplayName(currentUser);
  const isPaid = ["pro","premium_monthly","lifetime_vip","vip_annual","legacy","influencer","unlimited_monthly","unlimited_yearly","half_year","basic_monthly"].includes(currentUser?.subscription_type);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar (desktop only) */}
      <div className="hidden lg:flex flex-col w-64 min-h-screen bg-gray-900 border-r border-gray-800 fixed left-0 top-0 bottom-0 z-30">
        <Sidebar activePage="Dashboard" navigate={navigate} user={currentUser}
          onLogout={() => setShowLogoutConfirm(true)} credits={credits} isPaid={isPaid} />
      </div>

      {/* Mobile nav overlay */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileNavOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden bg-gray-900 border-r border-gray-800 overflow-y-auto">
              <Sidebar activePage="Dashboard" navigate={(url) => { navigate(url); setMobileNavOpen(false); }}
                user={currentUser} onLogout={() => { setMobileNavOpen(false); setShowLogoutConfirm(true); }}
                credits={credits} isPaid={isPaid} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout confirm */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-8">
            <div className="bg-gray-900 border border-gray-700 rounded-3xl p-7 w-full max-w-sm text-center">
              <p className="text-white font-black text-lg mb-2">Sign out?</p>
              <p className="text-gray-400 text-sm mb-6">You'll lose access to your saved credits until you sign back in.</p>
              <button onClick={handleLogout} className="w-full py-3 rounded-2xl bg-red-600 text-white font-black text-sm mb-3">Sign Out</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-3 rounded-2xl border border-gray-700 text-gray-400 text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden">
        {/* Top bar (mobile only) */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-gray-800 bg-gray-950 sticky top-0 z-20">
          <button onClick={() => setMobileNavOpen(true)} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <img src={SWH_LOGO} alt="" className="w-7 h-7 rounded-lg" />
            <span className="font-black text-white text-sm">SWH</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(createPageUrl("Pricing"))}
              className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
              <Zap className="w-3.5 h-3.5 text-lime-400" />
              <span className="text-xs font-black text-white">{isPaid ? "∞" : credits}</span>
            </button>
            <button onClick={() => setShowLogoutConfirm(true)}
              className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700"
              title="Sign Out">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="px-4 lg:px-8 py-6 space-y-6 max-w-6xl mx-auto">
          {/* Welcome header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">{greeting}</p>
              <h1 className="text-2xl lg:text-3xl font-black mt-1">
                {displayName ? `${displayName} 👋` : "Sports Wager Helper"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Your command center for smarter wagers.</p>
            </div>
            {!isPaid && (
              <button onClick={() => navigate(createPageUrl("Pricing"))}
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:from-purple-500 hover:to-indigo-500 transition-all">
                <Crown className="w-4 h-4" /> Go Pro
              </button>
            )}
          </div>

          {/* Stats bar */}
          <StatsBar credits={credits} isPaid={isPaid} />

          {/* SAL Quick Chat */}
          <SalQuickChat navigate={navigate} />

          {/* Live Odds Strip */}
          <OddsStrip />

          {/* Feature Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">All Tools</h2>
              <span className="text-xs text-gray-500">{FEATURE_TILES.length} features</span>
            </div>
            <FeatureGrid navigate={navigate} isPaid={isPaid} isIOSNative={isMobileNative} />
          </div>

          {/* Footer nudge */}
          {!isPaid && (
            <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-white font-black">Unlock unlimited searches</p>
                <p className="text-gray-400 text-sm mt-0.5">Pro members get unlimited credits, all tools, no restrictions.</p>
              </div>
              <button onClick={() => navigate(createPageUrl("Pricing"))}
                className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-5 py-3 rounded-xl text-sm">
                Upgrade →
              </button>
            </div>
          )}
        </div>

        {/* ── Apple-required footer links ─────────────────────────────── */}
        <div className="mt-8 pb-10 px-4">
          <div className="border-t border-gray-800 pt-6">
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-500 mb-3">
              <button onClick={() => navigate(createPageUrl("PrivacyPolicy"))} className="hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => navigate(createPageUrl("ContactUs"))} className="hover:text-white transition-colors">Contact Us</button>
              <button onClick={() => navigate(createPageUrl("MyAccount"))} className="hover:text-white transition-colors">Delete Account</button>
              <button onClick={() => navigate(createPageUrl("Pricing"))} className="hover:text-white transition-colors">Manage Subscription</button>
            </div>
            <p className="text-center text-[10px] text-gray-600 leading-relaxed">
              ⚠️ Sports Wager Helper provides AI-powered sports analysis and information only — not financial, legal, or betting advice. Always wager responsibly. Must be 18+ to use.
            </p>
            <p className="text-center text-[10px] text-gray-700 mt-1">
              If you or someone you know has a gambling problem, call 1-800-522-4700.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
