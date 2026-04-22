import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, DollarSign, Search, Clock, AlertTriangle,
  Receipt, CheckCircle, XCircle, Crown, Star, Sparkles,
  Zap, TrendingUp, Activity, ChevronDown, ChevronUp,
  Trash2, Edit3, RefreshCw, Eye, EyeOff, Award,
  BarChart2, CreditCard, LogOut, X, Check, Ban
} from "lucide-react";

const ADMIN_EMAILS = ["huertasfam@gmail.com", "huertasfam1@icloud.com", "huertasfam"];
const isAdminEmail = (email) => ADMIN_EMAILS.some(a => (email||"lower").toLowerCase().includes(a.toLowerCase()));

// ─── Tier config ─────────────────────────────────────────────────────────────
const TIERS = [
  { value: "free",            label: "Free",            color: "text-gray-400",   bg: "bg-gray-800" },
  { value: "premium_monthly", label: "Premium Monthly", color: "text-purple-400", bg: "bg-purple-900/40" },
  { value: "vip_annual",      label: "VIP Annual",      color: "text-yellow-400", bg: "bg-yellow-900/40" },
  { value: "legacy",          label: "Legacy",          color: "text-amber-400",  bg: "bg-amber-900/40" },
  { value: "influencer",      label: "Influencer",      color: "text-pink-400",   bg: "bg-pink-900/40" },
];

const tierLabel = (t) => TIERS.find(x => x.value === t)?.label || "Free";
const tierColor = (t) => TIERS.find(x => x.value === t)?.color || "text-gray-400";

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = "lime", delay = 0 }) => {
  const colors = {
    lime:   "border-lime-500/30 bg-lime-500/10 text-lime-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    cyan:   "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    red:    "border-red-500/30 bg-red-500/10 text-red-400",
    green:  "border-green-500/30 bg-green-500/10 text-green-400",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border p-4 ${colors[color]}`}
    >
      <Icon className="w-5 h-5 mb-2" />
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs font-bold mt-0.5">{label}</div>
      {sub && <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>}
    </motion.div>
  );
};

// ─── User Row ─────────────────────────────────────────────────────────────────
const UserRow = ({ user, onUpdateTier, onGrantCredits, onBan, updating }) => {
  const [expanded, setExpanded] = useState(false);
  const [newTier, setNewTier] = useState(user.subscription_type || "free");
  const [creditAmt, setCreditAmt] = useState("10");
  const [showCreditInput, setShowCreditInput] = useState(false);

  const joinDate = new Date(user.created_date).toLocaleDateString();
  const lastLogin = user.last_login_date
    ? new Date(user.last_login_date).toLocaleDateString()
    : "Never";

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
      {/* Row header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-sm font-black text-gray-400 flex-shrink-0">
          {(user.full_name || user.email || "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{user.full_name || "No name"}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-800 ${tierColor(user.subscription_type)}`}>
            {tierLabel(user.subscription_type)}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-800 p-4 space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-500">Joined</p>
                  <p className="text-white font-bold mt-0.5">{joinDate}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-500">Last Login</p>
                  <p className="text-white font-bold mt-0.5">{lastLogin}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-500">Search Credits</p>
                  <p className="text-lime-400 font-black mt-0.5">{user.search_credits ?? 5}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-500">Role</p>
                  <p className="text-white font-bold mt-0.5">{user.role || "user"}</p>
                </div>
              </div>

              {/* Change tier */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Change Tier</p>
                <div className="flex gap-2">
                  <select
                    value={newTier}
                    onChange={e => setNewTier(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2"
                  >
                    {TIERS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => onUpdateTier(user.id, newTier)}
                    disabled={updating}
                    className="px-4 py-2 rounded-xl bg-lime-500 text-gray-950 text-sm font-black disabled:opacity-50"
                  >
                    {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Grant credits */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Grant Credits</p>
                {showCreditInput ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={creditAmt}
                      onChange={e => setCreditAmt(e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2"
                      min="1" max="999"
                    />
                    <button
                      onClick={() => { onGrantCredits(user.id, parseInt(creditAmt), user.search_credits ?? 5); setShowCreditInput(false); }}
                      disabled={updating}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-gray-950 text-sm font-black disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowCreditInput(false)} className="px-3 py-2 rounded-xl bg-gray-700 text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreditInput(true)}
                    className="w-full py-2 rounded-xl bg-gray-800 border border-gray-700 text-cyan-400 text-sm font-bold flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4" /> Add Search Credits
                  </button>
                )}
              </div>

              {/* Danger zone */}
              <div className="flex gap-2">
                <button
                  onClick={() => onBan(user.id, user.email)}
                  className="flex-1 py-2 rounded-xl bg-red-900/40 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5" /> Suspend
                </button>
                <button
                  onClick={() => onUpdateTier(user.id, "free")}
                  className="flex-1 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Reset to Free
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Purchase Row ─────────────────────────────────────────────────────────────
const PurchaseRow = ({ p }) => {
  const statusMap = {
    verified:            { icon: CheckCircle, color: "text-green-400",  label: "Verified" },
    pending:             { icon: Clock,        color: "text-yellow-400", label: "Pending" },
    failed:              { icon: XCircle,      color: "text-red-400",   label: "Failed" },
    manually_activated:  { icon: Shield,       color: "text-blue-400",  label: "Manual" },
    refunded:            { icon: AlertTriangle,color: "text-orange-400",label: "Refunded" },
  };
  const s = statusMap[p.status] || statusMap.pending;
  const Icon = s.icon;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0">
      <Icon className={`w-4 h-4 flex-shrink-0 ${s.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-semibold truncate">{p.product_id || "Unknown product"}</p>
        <p className="text-xs text-gray-500 truncate">{p.user_email || p.user_id}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-lime-400">${p.amount ? Number(p.amount).toFixed(2) : "—"}</p>
        <p className="text-[10px] text-gray-600">{new Date(p.created_date).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [updatingUser, setUpdatingUser] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Auth check — mobile uses localStorage, web uses base44 session ──────────
  const { data: currentUser, isLoading: authLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      // First check localStorage (mobile Apple Sign-In path)
      try {
        const stored = localStorage.getItem("swh_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.email || parsed?.apple_user_id) return parsed;
        }
      } catch {}
      // Fallback: base44 session (web path)
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) return await base44.auth.me();
      } catch {}
      return null;
    },
  });

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list("-created_date", 1000),
    enabled: isAdminEmail(currentUser?.email),
  });

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ["adminPurchases"],
    queryFn: () => base44.entities.PurchaseAudit.list("-created_date", 100),
    enabled: isAdminEmail(currentUser?.email),
  });

  // ── Platform split stats ─────────────────────────────────────────────────────
  const mobileUsers = allUsers.filter(u => u.apple_user_id && u.apple_user_id.startsWith("apple_"));
  const webOnlyUsers = allUsers.filter(u => !u.apple_user_id || !u.apple_user_id.startsWith("apple_"));
  const linkedUsers = allUsers.filter(u => u.apple_user_id && u.linked_web_account_id);
  const totalCredits = allUsers.reduce((a, u) => a + (u.search_credits || u.credits || 0), 0);
  const avgCredits = total ? (totalCredits / total).toFixed(1) : 0;

  // ── Mutations ───────────────────────────────────────────────────────────────
  const updateTier = async (userId, tier) => {
    setUpdatingUser(userId);
    try {
      const updates = { subscription_type: tier };
      if (tier === "influencer") {
        const exp = new Date();
        exp.setDate(exp.getDate() + 7);
        updates.subscription_expiry_date = exp.toISOString().split("T")[0];
      }
      await base44.entities.User.update(userId, updates);
      await refetchUsers();
      showToast(`Tier updated to ${tierLabel(tier)}`);
    } catch (e) {
      showToast("Failed to update tier", "error");
    }
    setUpdatingUser(null);
  };

  const grantCredits = async (userId, amount, current) => {
    setUpdatingUser(userId);
    try {
      await base44.entities.User.update(userId, { search_credits: (current || 0) + amount });
      await refetchUsers();
      showToast(`+${amount} credits granted`);
    } catch {
      showToast("Failed to grant credits", "error");
    }
    setUpdatingUser(null);
  };

  const banUser = async (userId, email) => {
    if (!confirm(`Suspend ${email}? This will set them to free and flag the account.`)) return;
    setUpdatingUser(userId);
    try {
      await base44.entities.User.update(userId, { subscription_type: "free", is_suspended: true });
      await refetchUsers();
      showToast(`${email} suspended`);
    } catch {
      showToast("Failed to suspend user", "error");
    }
    setUpdatingUser(null);
  };

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  if (!currentUser || !isAdminEmail(currentUser.email)) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <Shield className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-black text-white">Access Denied</h2>
        <p className="text-gray-500 text-sm">This page is restricted to admins only.</p>
        <button
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="mt-4 px-6 py-3 rounded-2xl bg-gray-800 text-gray-300 font-bold text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const total = allUsers.length;
  const free = allUsers.filter(u => !u.subscription_type || u.subscription_type === "free").length;
  const premium = allUsers.filter(u => u.subscription_type === "premium_monthly").length;
  const vip = allUsers.filter(u => u.subscription_type === "vip_annual").length;
  const legacy = allUsers.filter(u => u.subscription_type === "legacy").length;
  const influencer = allUsers.filter(u => u.subscription_type === "influencer").length;
  const paid = premium + vip + legacy;
  const mrr = (premium * 19.99) + (vip * 149.99 / 12) + (legacy * 0);
  const verifiedPurchases = purchases.filter(p => p.status === "verified").length;
  const failedPurchases = purchases.filter(p => p.status === "failed").length;

  // Recent signups (last 7 days)
  const week = new Date(); week.setDate(week.getDate() - 7);
  const newUsers = allUsers.filter(u => new Date(u.created_date) > week).length;

  // Influencer countdowns
  const influencerUsers = allUsers
    .filter(u => u.subscription_type === "influencer")
    .map(u => {
      const exp = u.subscription_expiry_date
        ? new Date(u.subscription_expiry_date)
        : (() => { const d = new Date(u.created_date); d.setDate(d.getDate() + 7); return d; })();
      const diff = exp - Date.now();
      return { ...u, exp, expired: diff <= 0, days: Math.max(0, Math.floor(diff / 86400000)), hours: Math.max(0, Math.floor((diff % 86400000) / 3600000)) };
    });

  // Filtered users
  const filteredUsers = allUsers.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
    const matchTier = tierFilter === "all" || (u.subscription_type || "free") === tierFilter;
    return matchSearch && matchTier;
  });

  const TABS = [
    { id: "overview",  label: "Overview",  icon: BarChart2 },
    { id: "users",     label: "Users",     icon: Users },
    { id: "purchases", label: "Purchases", icon: Receipt },
    { id: "platform",  label: "Platform",  icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-4 right-4 z-50 py-3 px-4 rounded-2xl text-sm font-bold text-center shadow-xl ${
              toast.type === "error" ? "bg-red-500 text-white" : "bg-lime-500 text-gray-950"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-lime-400" />
            <span className="text-xs font-black text-lime-400 uppercase tracking-widest">Admin</span>
          </div>
          <h1 className="text-2xl font-black">Control Center</h1>
        </div>
        <button
          onClick={() => refetchUsers()}
          className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-400"
        >
          <RefreshCw className={`w-4 h-4 ${usersLoading ? "animate-spin text-lime-400" : ""}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex bg-gray-900 rounded-2xl p-1 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                tab === t.id ? "bg-lime-500 text-gray-950" : "text-gray-500"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="px-4 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users}      label="Total Users"    value={total}   sub={`+${newUsers} this week`} color="lime"   delay={0} />
            <StatCard icon={Crown}      label="Paying Users"   value={paid}    sub={`${((paid/total)*100||0).toFixed(0)}% conversion`} color="yellow" delay={0.05} />
            <StatCard icon={Sparkles}   label="Premium"        value={premium} sub="$19.99/mo each"         color="purple" delay={0.1} />
            <StatCard icon={Star}       label="VIP Annual"     value={vip}     sub="$149.99/yr each"        color="cyan"   delay={0.15} />
            <StatCard icon={Award}      label="Legacy"         value={legacy}  sub="Lifetime access"        color="yellow" delay={0.2} />
            <StatCard icon={Activity}   label="Free Users"     value={free}    sub="No subscription"       color="lime"   delay={0.25} />
          </div>

          {/* MRR card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-xs font-black text-green-400 uppercase tracking-wide">Est. Monthly Revenue</span>
            </div>
            <div className="text-4xl font-black text-white">${mrr.toFixed(2)}</div>
            <div className="flex gap-4 mt-3 text-xs text-gray-400">
              <span>Premium: <span className="text-purple-400 font-bold">${(premium * 19.99).toFixed(2)}</span></span>
              <span>VIP: <span className="text-yellow-400 font-bold">${(vip * 149.99 / 12).toFixed(2)}</span></span>
            </div>
          </motion.div>

          {/* Purchase health */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-5"
          >
            <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Purchase Health</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm"><span className="font-black text-white">{verifiedPurchases}</span> <span className="text-gray-500">verified</span></span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm"><span className="font-black text-white">{failedPurchases}</span> <span className="text-gray-500">failed</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-500" />
                <span className="text-sm"><span className="font-black text-white">{purchases.length}</span> <span className="text-gray-500">total</span></span>
              </div>
            </div>
          </motion.div>

          {/* Influencer countdowns */}
          {influencerUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-pink-500/30 bg-pink-500/10 p-5"
            >
              <p className="text-xs font-black text-pink-400 uppercase tracking-wide mb-3">
                Influencer Trials ({influencerUsers.length})
              </p>
              <div className="space-y-3">
                {influencerUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{u.full_name || u.email}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    {u.expired ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400 font-bold">EXPIRED</span>
                        <button
                          onClick={() => updateTier(u.id, "free")}
                          className="text-xs px-2 py-1 rounded-lg bg-red-900/40 text-red-400 font-bold"
                        >
                          Reset
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-black text-pink-300 bg-pink-900/40 px-3 py-1 rounded-full">
                        {u.days}d {u.hours}h left
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent signups */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-5"
          >
            <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Recent Signups</p>
            {allUsers.slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm text-white font-semibold">{u.full_name || "No name"}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-800 ${tierColor(u.subscription_type)}`}>
                  {tierLabel(u.subscription_type)}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* ── USERS ────────────────────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="px-4 space-y-3">
          {/* Search + filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-xl pl-9 pr-4 py-2.5"
              />
            </div>
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-3 py-2.5"
            >
              <option value="all">All</option>
              {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <p className="text-xs text-gray-600">{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</p>

          {usersLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-lime-400 animate-spin mx-auto" />
            </div>
          ) : (
            filteredUsers.map(u => (
              <UserRow
                key={u.id}
                user={u}
                onUpdateTier={updateTier}
                onGrantCredits={grantCredits}
                onBan={banUser}
                updating={updatingUser === u.id}
              />
            ))
          )}
        </div>
      )}

      {/* ── PURCHASES ────────────────────────────────────────────────────────── */}
      {tab === "purchases" && (
        <div className="px-4 space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{verifiedPurchases}</p>
              <p className="text-[10px] text-green-400 font-bold">Verified</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{failedPurchases}</p>
              <p className="text-[10px] text-red-400 font-bold">Failed</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{purchases.length}</p>
              <p className="text-[10px] text-gray-400 font-bold">Total</p>
            </div>
          </div>

          {/* Purchase list */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            {purchasesLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 text-lime-400 animate-spin mx-auto" />
              </div>
            ) : purchases.length === 0 ? (
              <p className="text-center text-gray-600 py-8 text-sm">No purchases yet</p>
            ) : (
              purchases.map(p => <PurchaseRow key={p.id} p={p} />)
            )}
          </div>
        </div>
      )}

      {/* ── PLATFORM TAB ──────────────────────────────────────────────────────── */}
      {tab === "platform" && (
        <div className="px-4 space-y-4 pb-4">

          <div className="bg-gray-900 rounded-2xl p-4 border border-white/5">
            <h3 className="text-sm font-black text-white mb-3 uppercase tracking-wide">📱 User Source Breakdown</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Mobile (Apple)", value: mobileUsers.length, color: "text-blue-400", icon: "🍎" },
                { label: "Web Only", value: webOnlyUsers.length, color: "text-purple-400", icon: "🌐" },
                { label: "Linked Both", value: linkedUsers.length, color: "text-lime-400", icon: "🔗" },
              ].map(s => (
                <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-4 border border-white/5">
            <h3 className="text-sm font-black text-white mb-3 uppercase tracking-wide">🔑 Search Credits</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-yellow-400">{totalCredits}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Total Credits Held</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-cyan-400">{avgCredits}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Avg Per User</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-4 border border-white/5">
            <h3 className="text-sm font-black text-white mb-3 uppercase tracking-wide">🍎 Mobile App Users ({mobileUsers.length})</h3>
            {mobileUsers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No mobile users yet</p>
            ) : (
              <div className="space-y-2">
                {mobileUsers.slice(0, 25).map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-xs font-bold text-white">{u.full_name || u.email || "Anonymous"}</p>
                      <p className="text-[10px] text-gray-500">{u.email || (u.apple_user_id||"").slice(0,24)+"…"}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${tierColor(u.subscription_type)}`}>{tierLabel(u.subscription_type)}</p>
                      <p className="text-[10px] text-gray-500">{u.search_credits ?? u.credits ?? 0} credits</p>
                    </div>
                  </div>
                ))}
                {mobileUsers.length > 25 && <p className="text-center text-xs text-gray-500 pt-1">+{mobileUsers.length - 25} more</p>}
              </div>
            )}
          </div>

          <div className="bg-gray-900 rounded-2xl p-4 border border-white/5">
            <h3 className="text-sm font-black text-white mb-3 uppercase tracking-wide">🌐 Web App Users ({webOnlyUsers.length})</h3>
            {webOnlyUsers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No web-only users</p>
            ) : (
              <div className="space-y-2">
                {webOnlyUsers.slice(0, 25).map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-xs font-bold text-white">{u.full_name || u.email || "—"}</p>
                      <p className="text-[10px] text-gray-500">{u.email || "no email"}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${tierColor(u.subscription_type)}`}>{tierLabel(u.subscription_type)}</p>
                      <p className="text-[10px] text-gray-500">{u.search_credits ?? u.credits ?? 0} credits</p>
                    </div>
                  </div>
                ))}
                {webOnlyUsers.length > 25 && <p className="text-center text-xs text-gray-500 pt-1">+{webOnlyUsers.length - 25} more</p>}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
