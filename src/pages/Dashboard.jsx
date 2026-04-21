import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  Zap, Crown, Bot, BarChart2, Users, Activity,
  ChevronRight, Globe, Search, Star, Flame, Shield,
  Settings, Database, TrendingUp, AlertTriangle, Lock
} from "lucide-react";

const SWH_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png";
const SAL_LOGO  = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg");

// Admin emails / apple IDs — Javier's accounts
const ADMIN_IDENTIFIERS = [
  "huertasfam@gmail.com",
  "huertasfam1@icloud.com",
  "huertasfam",
];

const MENU = [
  {
    id: "sal",
    title: "Ask S.A.L.",
    subtitle: "AI Sports Detective",
    description: "Chat with your AI analyst — ask anything about any match, team, or player.",
    page: "AskSAL",
    image: SAL_LOGO,
    tag: "SIGNATURE",
    tagColor: "bg-purple-500",
    cost: "1 credit per question",
    accent: "purple",
  },
  {
    id: "analysis",
    title: "Match Analysis",
    subtitle: "AI-Powered Predictions",
    description: "Deep dive into any matchup — odds, trends, and AI picks in seconds.",
    page: "AnalysisHub",
    icon: BarChart2,
    tag: "POPULAR",
    tagColor: "bg-yellow-500 text-black",
    cost: "1 credit per analysis",
    accent: "yellow",
  },
  {
    id: "player",
    title: "Player Stats",
    subtitle: "Live Performance Data",
    description: "Search any player across all major sports for stats and AI insight.",
    page: "PlayerStats",
    icon: Users,
    tag: null,
    cost: "1 credit per search",
    accent: "cyan",
  },
  {
    id: "team",
    title: "Team Stats",
    subtitle: "Full Team Breakdown",
    description: "Rankings, records, injury reports, and AI-scored strength ratings.",
    page: "TeamStats",
    icon: Star,
    tag: null,
    cost: "1 credit per search",
    accent: "cyan",
  },
  {
    id: "live",
    title: "Live Scores & News",
    subtitle: "Real-Time Ticker",
    description: "Live scores, breaking sports news, and game updates as they happen.",
    page: "SportsNewsTicker",
    icon: Flame,
    tag: "LIVE",
    tagColor: "bg-red-500",
    cost: "Free",
    accent: "red",
  },
];

const ACCENT_STYLES = {
  purple: { border: "border-purple-500/30", glow: "bg-purple-500/10", icon: "text-purple-400", tag: "text-white" },
  yellow: { border: "border-yellow-500/30", glow: "bg-yellow-500/10", icon: "text-yellow-400", tag: "text-black" },
  cyan:   { border: "border-cyan-500/30",   glow: "bg-cyan-500/10",   icon: "text-cyan-400",   tag: "text-white" },
  red:    { border: "border-red-500/30",    glow: "bg-red-500/10",    icon: "text-red-400",    tag: "text-white" },
};

function getDisplayName(user) {
  if (!user) return null;
  // Try full_name first
  if (user.full_name && user.full_name !== "SWH User" && user.full_name !== "User") {
    return user.full_name.split(" ")[0];
  }
  // Try email prefix
  if (user.email) {
    const prefix = user.email.split("@")[0];
    // Capitalize first letter
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return null;
}

function isAdmin(user) {
  if (!user) return false;
  const email = (user.email || "").toLowerCase();
  const name = (user.full_name || "").toLowerCase();
  return ADMIN_IDENTIFIERS.some(id => email.includes(id.toLowerCase()) || name.includes(id.toLowerCase()));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Welcome");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Load user from localStorage
    try {
      const stored = localStorage.getItem("swh_user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}

    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const displayName = getDisplayName(currentUser);
  const credits = currentUser?.search_credits ?? currentUser?.credits ?? parseInt(localStorage.getItem("swh_search_credits") || "5", 10);
  const isPaid = ["premium_monthly","vip_annual","legacy"].includes(currentUser?.subscription_type);
  const isGuest = !currentUser;
  const userIsAdmin = isAdmin(currentUser);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">{greeting}</p>
            <h1 className="text-xl font-black mt-0.5">
              {displayName ? `${displayName} 👋` : "Sports Wager Helper"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(createPageUrl("Pricing"))}
              className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2"
            >
              <Zap className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-bold text-white">
                {isPaid ? "∞" : credits}
              </span>
              <span className="text-gray-500 text-xs">credits</span>
            </button>
            <button
              onClick={() => navigate(createPageUrl("MyAccount"))}
              className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden"
            >
              <img src={SWH_LOGO} alt="SWH" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        {/* Guest nudge */}
        {isGuest && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-lime-500/10 border border-lime-500/20 rounded-2xl px-4 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-lime-300 text-xs font-bold">5 free searches remaining</p>
              <p className="text-gray-500 text-xs mt-0.5">Sign in to save your results</p>
            </div>
            <button
              onClick={() => navigate(createPageUrl("Splash"))}
              className="text-xs font-bold text-lime-400 bg-lime-500/20 px-3 py-1.5 rounded-xl"
            >
              Sign In
            </button>
          </motion.div>
        )}

        {/* VIP / Premium badge */}
        {isPaid && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-2"
          >
            <Crown className="w-4 h-4 text-yellow-400" />
            <p className="text-yellow-300 text-xs font-bold">
              {currentUser?.subscription_type === "legacy" ? "Legacy Member — Unlimited Access" :
               currentUser?.subscription_type === "vip_annual" ? "VIP Annual — Unlimited Access" :
               "Premium — Unlimited Access"}
            </p>
          </motion.div>
        )}
      </div>

      {/* ── Menu label ─────────────────────────────────────────────────────── */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-800" />
          <p className="text-gray-600 text-xs uppercase tracking-widest font-semibold">Today's Menu</p>
          <div className="h-px flex-1 bg-gray-800" />
        </div>
      </div>

      {/* ── Menu Cards ─────────────────────────────────────────────────────── */}
      <div className="px-4 flex flex-col gap-4">
        {MENU.map((item, i) => {
          const a = ACCENT_STYLES[item.accent];
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              onClick={() => navigate(createPageUrl(item.page))}
              className={`w-full text-left rounded-2xl border ${a.border} ${a.glow} p-4 flex items-center gap-4 active:scale-[0.98] transition-transform`}
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <Icon className={`w-7 h-7 ${a.icon}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-black text-base text-white">{item.title}</span>
                  {item.tag && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${item.tagColor} ${a.tag}`}>
                      {item.tag}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs leading-snug line-clamp-2">{item.description}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-lime-500" />
                  <span className="text-lime-500/80 text-[10px] font-semibold">{item.cost}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
            </motion.button>
          );
        })}

        {/* ── ADMIN TILE — only shown to Javier ──────────────────────────── */}
        {userIsAdmin && (
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: MENU.length * 0.07 + 0.1, duration: 0.3 }}
            onClick={() => navigate(createPageUrl("AdminPanel"))}
            className="w-full text-left rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 flex items-center gap-4 active:scale-[0.98] transition-transform relative overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Shield className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1 min-w-0 relative">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-black text-base text-white">Admin Panel</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-500 text-white">
                  OWNER
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                  PRIVATE
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-snug">
                Users · Revenue · Error logs · Purchase audits · System health
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-[10px] font-semibold">Live data</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-orange-400" />
                  <span className="text-orange-400/80 text-[10px] font-semibold">Owner only</span>
                </div>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-orange-500/60 flex-shrink-0 relative" />
          </motion.button>
        )}
      </div>

      {/* ── Get More Credits CTA ────────────────────────────────────────────── */}
      {!isPaid && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-4 mt-6"
        >
          <button
            onClick={() => navigate(createPageUrl("Pricing"))}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 text-gray-950 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Zap className="w-4 h-4" />
            Get More Credits
          </button>
        </motion.div>
      )}
    </div>
  );
}
