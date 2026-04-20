import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Zap, Crown, Bot, BarChart2, Users, Activity,
  ChevronRight, Globe, Search, Star, Flame
} from "lucide-react";

const SWH_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png";
const SAL_LOGO  = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg";

// ─── Menu items ───────────────────────────────────────────────────────────────
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Welcome");

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return null;
        return await base44.auth.me();
      } catch { return null; }
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const firstName = currentUser?.full_name?.split(" ")[0] || null;
  const credits = currentUser?.search_credits ?? 5;
  const isPaid = ["premium_monthly","vip_annual","legacy"].includes(currentUser?.subscription_type);
  const isGuest = !currentUser;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">{greeting}</p>
            <h1 className="text-xl font-black mt-0.5">
              {firstName ? `${firstName} 👋` : "Sports Wager Helper"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Credit badge */}
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
            {/* Avatar / account */}
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
              onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
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
              {/* Icon / image */}
              <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <Icon className={`w-7 h-7 ${a.icon}`} />
                )}
              </div>

              {/* Text */}
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
            Get More Search Credits
          </button>
        </motion.div>
      )}

      {/* ── Website FYI ─────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 mb-2 flex items-center justify-center gap-2 bg-gray-900/50 border border-gray-800 rounded-2xl px-4 py-3">
        <Globe className="w-4 h-4 text-lime-500 flex-shrink-0" />
        <p className="text-gray-500 text-xs leading-tight">
          <span className="text-gray-400 font-semibold">FYI:</span> For the complete AI experience with unlimited tools, visit{" "}
          <span className="text-lime-400 font-bold">sportswagerhelper.com</span>
        </p>
      </div>
    </div>
  );
}
