import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  Zap, Crown, BarChart2, Users, Star, Flame,
  ChevronRight, Shield, Lock, LogOut, Link2
} from "lucide-react";

const SWH_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png";
const SAL_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg";

const ADMIN_EMAILS = ["huertasfam@gmail.com", "huertasfam1@icloud.com", "huertasfam"];

const MENU = [
  { id: "sal", title: "Ask S.A.L.", subtitle: "AI Sports Detective", description: "Chat with your AI analyst — ask anything about any match, team, or player.", page: "AskSAL", image: SAL_LOGO, tag: "SIGNATURE", tagColor: "bg-purple-500", cost: "1 credit per question", accent: "purple" },
  { id: "analysis", title: "Match Analysis", subtitle: "AI-Powered Predictions", description: "Deep dive into any matchup — odds, trends, and AI picks in seconds.", page: "AnalysisHub", icon: BarChart2, tag: "POPULAR", tagColor: "bg-yellow-500 text-black", cost: "1 credit per analysis", accent: "yellow" },
  { id: "player", title: "Player Stats", subtitle: "Live Performance Data", description: "Search any player across all major sports for stats and AI insight.", page: "PlayerStats", icon: Users, tag: null, cost: "1 credit per search", accent: "cyan" },
  { id: "team", title: "Team Stats", subtitle: "Full Team Breakdown", description: "Rankings, records, injury reports, and AI-scored strength ratings.", page: "TeamStats", icon: Star, tag: null, cost: "1 credit per search", accent: "cyan" },
  { id: "live", title: "Live Scores & News", subtitle: "Real-Time Ticker", description: "Live scores, breaking sports news, and game updates as they happen.", page: "SportsNewsTicker", icon: Flame, tag: "LIVE", tagColor: "bg-red-500", cost: "Free", accent: "red" },
];

const ACCENT_STYLES = {
  purple: { border: "border-purple-500/30", glow: "bg-purple-500/10", icon: "text-purple-400" },
  yellow: { border: "border-yellow-500/30", glow: "bg-yellow-500/10", icon: "text-yellow-400" },
  cyan:   { border: "border-cyan-500/30",   glow: "bg-cyan-500/10",   icon: "text-cyan-400" },
  red:    { border: "border-red-500/30",    glow: "bg-red-500/10",    icon: "text-red-400" },
};

function getDisplayName(user) {
  // ✅ Also check swh_full_name localStorage key (set by wrapper on Apple Sign-In)
  const storedName = (() => { try { return localStorage.getItem("swh_full_name") || null; } catch { return null; } })();

  if (!user) return storedName ? storedName.split(" ")[0] : null;
  const name = user.full_name || "";

  // Reject raw Apple IDs (Apple_XXXXXX...) and placeholder names
  const badNames = ["SWH User", "User", ""];
  const isAppleId = name.startsWith("Apple_0") || name.includes("@privaterelay") || name.length > 40;

  if (name && !badNames.includes(name) && !isAppleId) {
    return name.split(" ")[0];
  }
  // Fall back to stored name from wrapper
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
  return ADMIN_EMAILS.some(a => email.includes(a.toLowerCase()));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Welcome");
  const [currentUser, setCurrentUser] = useState(null);
  const [credits, setCredits] = useState(5);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    // Load user
    try {
      const stored = localStorage.getItem("swh_user");
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser(u);
      }
    } catch {}

    // Load credits — prefer swh_user.search_credits, fall back to swh_search_credits key
    try {
      const stored = localStorage.getItem("swh_user");
      const u = stored ? JSON.parse(stored) : null;
      const fromUser = u?.search_credits ?? u?.credits ?? null;
      const fromKey = parseInt(localStorage.getItem("swh_search_credits") || "0", 10);
      setCredits(fromUser !== null ? fromUser : (fromKey > 0 ? fromKey : 5));
    } catch {
      setCredits(5);
    }

    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Listen for credit updates from Pricing page (after purchase)
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("swh_user");
        const u = stored ? JSON.parse(stored) : null;
        const fromUser = u?.search_credits ?? u?.credits ?? null;
        const fromKey = parseInt(localStorage.getItem("swh_search_credits") || "0", 10);
        setCredits(fromUser !== null ? fromUser : (fromKey > 0 ? fromKey : 5));
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    // Also poll once on focus (mobile WebView doesn't always fire storage event)
    window.addEventListener("focus", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleStorage);
    };
  }, []);

  const handleLogout = () => {
    // Clear all session data
    localStorage.removeItem("swh_user");
    localStorage.removeItem("swh_apple_user_id");
    localStorage.removeItem("swh_user_id");
    localStorage.removeItem("swh_is_premium");
    localStorage.removeItem("swh_plan");
    localStorage.removeItem("swh_email");
    // Tell native wrapper to clear session too
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "CLEAR_DATA" }));
    }
    navigate(createPageUrl("Splash"), { replace: true });
  };

  const displayName = getDisplayName(currentUser);
  const isPaid = ["premium_monthly", "vip_annual", "legacy"].includes(currentUser?.subscription_type);
  const isGuest = !currentUser;
  const userIsAdmin = isAdmin(currentUser);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-8">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-7 w-full max-w-sm text-center">
            <p className="text-white font-black text-lg mb-2">Sign out?</p>
            <p className="text-gray-400 text-sm mb-6">You'll lose access to your saved credits on this device until you sign back in.</p>
            <button onClick={handleLogout} className="w-full py-3 rounded-2xl bg-red-600 text-white font-black text-sm mb-3">Sign Out</button>
            <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-3 rounded-2xl border border-gray-700 text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

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
            {/* Credit badge */}
            <button
              onClick={() => navigate(createPageUrl("Pricing"))}
              className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2"
            >
              <Zap className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-bold text-white">{isPaid ? "∞" : credits}</span>
              <span className="text-gray-500 text-xs">credits</span>
            </button>
            {/* Avatar — tap to logout */}
            <button
              onClick={() => currentUser ? setShowLogoutConfirm(true) : navigate(createPageUrl("Splash"))}
              className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden relative"
            >
              {currentUser ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <span className="text-lg font-black text-white">
                    {(displayName || "?")[0].toUpperCase()}
                  </span>
                </div>
              ) : (
                <img src={SWH_LOGO} alt="SWH" className="w-full h-full object-cover" />
              )}
            </button>
          </div>
        </div>

        {/* Guest nudge */}
        {isGuest && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-lime-500/10 border border-lime-500/20 rounded-2xl px-4 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-lime-300 text-xs font-bold">5 free searches remaining</p>
              <p className="text-gray-500 text-xs mt-0.5">Sign in to save your credits & results</p>
            </div>
            <button onClick={() => navigate(createPageUrl("Splash"))}
              className="text-xs font-bold text-lime-400 bg-lime-500/20 px-3 py-1.5 rounded-xl"
            >Sign In</button>
          </motion.div>
        )}

        {/* Signed in — show email */}
        {currentUser && currentUser.email && (
          <p className="text-gray-600 text-xs mt-2">{currentUser.email}</p>
        )}

        {/* VIP badge */}
        {isPaid && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-2"
          >
            <Crown className="w-4 h-4 text-yellow-400" />
            <p className="text-yellow-300 text-xs font-bold">Premium — Unlimited Access</p>
          </motion.div>
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
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
            <motion.button key={item.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              onClick={() => navigate(createPageUrl(item.page))}
              className={`w-full text-left rounded-2xl border ${a.border} ${a.glow} p-4 flex items-center gap-4 active:scale-[0.98] transition-transform`}
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <Icon className={`w-7 h-7 ${a.icon}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-black text-base text-white">{item.title}</span>
                  {item.tag && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${item.tagColor} text-white`}>{item.tag}</span>}
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

        {/* ── ADMIN TILE ─────────────────────────────────────────────────── */}
        {userIsAdmin && (
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: MENU.length * 0.07 + 0.1 }}
            onClick={() => navigate(createPageUrl("AdminPanel"))}
            className="w-full text-left rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 flex items-center gap-4 active:scale-[0.98] transition-transform relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0 relative">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-black text-base text-white">Admin Panel</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-500 text-white">OWNER</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-600 text-white">PRIVATE</span>
              </div>
              <p className="text-gray-400 text-xs">Users · Revenue · Error logs · Purchase audits · System health</p>
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

      {/* ── Get More Credits ─────────────────────────────────────────────── */}
      {!isPaid && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mx-4 mt-6">
          <button onClick={() => navigate(createPageUrl("Pricing"))}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 text-gray-950 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Zap className="w-4 h-4" /> Get More Credits
          </button>
        </motion.div>
      )}

      {/* ── Link Web Account ─────────────────────────────────────────────── */}
      {currentUser && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mx-4 mt-3 mb-6">
          <button onClick={() => navigate(createPageUrl("LinkAccount"))}
            className="w-full py-3.5 rounded-2xl border border-gray-700 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Link2 className="w-4 h-4 text-cyan-400" /> Already have a web account? Link it
          </button>
        </motion.div>
      )}
    </div>
  );
}
