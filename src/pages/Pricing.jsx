import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Crown, Zap, Check, Loader2, RotateCcw, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlatform } from "@/components/hooks/usePlatform";
import {
  triggerRevenueCatPurchase,
  triggerRestorePurchases,
  callNativeIAPWithCallback,
  submitReceiptToServer,
} from "@/components/utils/iapBridge";

const CREDIT_PACKS = [
  { id: "small",  credits: 25,  price: 4.99,  productId: "com.sportswagerhelper.credits.25",  label: "Starter" },
  { id: "medium", credits: 60,  price: 9.99,  productId: "com.sportswagerhelper.credits.60",  label: "Popular", highlight: true },
  { id: "large",  credits: 100, price: 14.99, productId: "com.sportswagerhelper.credits.100", label: "Best Value" },
];

const SUBSCRIPTION_PLANS = [
  {
    id: "premium",
    label: "Premium",
    price: "$19.99",
    period: "/month",
    productId: "com.sportswagerhelper.premium.monthly",
    color: "from-purple-600 to-pink-600",
    perks: [
      "Unlimited AI match predictions",
      "Unlimited player & team stats",
      "Live odds comparison",
      "Daily AI Top Picks",
      "Parlay builder & ROI tracker",
      "Budget manager",
      "Unlimited saved results",
      "Priority support",
    ],
  },
  {
    id: "vip",
    label: "VIP Annual",
    price: "$149.99",
    period: "/year",
    productId: "com.sportswagerhelper.vip.annual",
    color: "from-yellow-500 to-orange-500",
    badge: "Save 37%",
    perks: [
      "Everything in Premium",
      "Daily AI Insight Briefs",
      "Sharp vs Public Money signals",
      "VIP Discord access",
      "Early access to new features",
      "Lifetime unlimited results",
      "Priority AI processing queue",
    ],
  },
];

export default function Pricing() {
  const [processingItem, setProcessingItem] = useState(null);
  const [activeTab, setActiveTab] = useState("credits");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creditsGranted, setCreditsGranted] = useState(0);

  const iapTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const { isIOSNative, isAndroidNative, isAndroidDevice } = usePlatform();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (iapTimeoutRef.current) clearTimeout(iapTimeoutRef.current);
    };
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return null;
        return await base44.auth.me();
      } catch { return null; }
    },
  });

  const currentPlan = currentUser?.subscription_type || "free";
  const isPremium = currentPlan === "premium_monthly";
  const isVIP = currentPlan === "vip_annual";
  const isLegacy = currentPlan === "legacy";

  // ── Credit purchase ──────────────────────────────────────────────────────

  const handleBuyCredits = async (pack) => {
    if (processingItem) return;
    setProcessingItem(pack.id);

    if (isIOSNative) {
      try {
        const result = await triggerRevenueCatPurchase(pack.productId);
        if (result.success) {
          // Grant credits locally immediately — no sign-in needed for credit packs
          const existing = parseInt(localStorage.getItem("swh_search_credits") || "5", 10);
          const newTotal = existing + pack.credits;
          localStorage.setItem("swh_search_credits", String(newTotal));
          // Notify RevenueCat webhook handles server-side grant too
          setCreditsGranted(pack.credits);
          setShowSuccessModal(true);
        } else if (result.error !== "user_cancelled") {
          alert(`Purchase failed: ${result.error || "Unknown error"}. Please try again.`);
        }
      } catch {
        alert("Purchase failed. Please try again.");
      } finally {
        if (isMountedRef.current) setProcessingItem(null);
      }
      return;
    }

    if (iapTimeoutRef.current) clearTimeout(iapTimeoutRef.current);
    iapTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) { setProcessingItem(null); alert("Purchase timed out. Please try again."); }
    }, 30000);

    try {
      await callNativeIAPWithCallback(
        { productId: pack.productId, productType: isAndroidNative ? "INAPP" : "CONSUMABLE", isConsumable: true },
        (data) => {
          if (iapTimeoutRef.current) { clearTimeout(iapTimeoutRef.current); iapTimeoutRef.current = null; }
          if (!isMountedRef.current) return;
          if (data.isSuccess && (data.receiptData || data.purchaseToken)) {
            // Submit to server for verification — credits granted via webhook, no sign-in required
            submitReceiptToServer({
              receipt: data.receiptData,
              purchaseToken: data.purchaseToken,
              productId: data.productId || pack.productId,
              platform: data.purchaseToken ? "android" : "ios",
            });
            // Grant credits locally immediately
            const existing = parseInt(localStorage.getItem("swh_search_credits") || "5", 10);
            localStorage.setItem("swh_search_credits", String(existing + pack.credits));
            setProcessingItem(null);
            setCreditsGranted(pack.credits);
            setShowSuccessModal(true);
          } else {
            const cancelled = data.isCancelled || ["user_cancelled","cancelled","payment_cancelled"].includes(data.error);
            if (!cancelled && data.error) alert(`Purchase failed: ${data.error}. Please try again.`);
            setProcessingItem(null);
          }
        }
      );
    } catch {
      if (iapTimeoutRef.current) { clearTimeout(iapTimeoutRef.current); iapTimeoutRef.current = null; }
      setProcessingItem(null);
    }
  };

  // ── Subscription purchase ────────────────────────────────────────────────

  const handleSubscribe = async (plan) => {
    if (processingItem) return;
    setProcessingItem(plan.id);

    if (isIOSNative) {
      try {
        const result = await triggerRevenueCatPurchase(plan.productId);
        if (result.success) {
          localStorage.setItem("pending_iap_product", plan.productId);
          localStorage.setItem("pending_iap_platform", "ios");
          window.location.href = "/PostPurchaseSignIn";
        } else if (result.error !== "user_cancelled") {
          alert(`Purchase failed: ${result.error || "Unknown error"}`);
        }
      } catch {
        alert("Purchase failed. Please try again.");
      } finally {
        if (isMountedRef.current) setProcessingItem(null);
      }
      return;
    }

    if (iapTimeoutRef.current) clearTimeout(iapTimeoutRef.current);
    iapTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) { setProcessingItem(null); alert("Purchase timed out. Please try again."); }
    }, 60000);

    try {
      const hasWTN = window?.WTN && typeof window.WTN.inAppPurchase === "function";
      if (!hasWTN) {
        clearTimeout(iapTimeoutRef.current);
        setProcessingItem(null);
        alert("In-app purchasing is currently unavailable. Please try again later.");
        return;
      }
      await callNativeIAPWithCallback(
        { productId: plan.productId, productType: "SUBS" },
        (data) => {
          if (iapTimeoutRef.current) { clearTimeout(iapTimeoutRef.current); iapTimeoutRef.current = null; }
          if (!isMountedRef.current) return;
          if (data.isSuccess && (data.receiptData || data.purchaseToken)) {
            submitReceiptToServer({
              receipt: data.receiptData,
              purchaseToken: data.purchaseToken,
              productId: data.productId || plan.productId,
              platform: data.purchaseToken ? "android" : "ios",
            });
            localStorage.setItem("pending_iap_product", data.productId || plan.productId);
            localStorage.setItem("pending_iap_platform", data.purchaseToken ? "android" : "ios");
            window.location.href = "/PostPurchaseSignIn";
          } else {
            const cancelled = data.isCancelled || ["user_cancelled","cancelled","payment_cancelled"].includes(data.error);
            if (!cancelled && data.error) alert(`Purchase failed: ${data.error}. Please try again.`);
            setProcessingItem(null);
          }
        }
      );
    } catch {
      if (iapTimeoutRef.current) { clearTimeout(iapTimeoutRef.current); iapTimeoutRef.current = null; }
      setProcessingItem(null);
    }
  };

  // ── Restore ──────────────────────────────────────────────────────────────

  const handleRestore = async () => {
    try {
      const result = await triggerRestorePurchases();
      if (result.success) {
        alert("✅ Purchases restored! If your plan isn't showing yet, sign out and back in.");
      } else {
        alert("No previous purchases found.");
      }
    } catch {
      alert("Could not restore purchases. Please try again.");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 pt-6 pb-24">

      {/* ── Credit Purchase Success Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-8"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-900 border border-cyan-500/40 rounded-3xl p-8 text-center w-full max-w-sm"
            >
              <div className="text-5xl mb-4">⚡️</div>
              <h2 className="text-2xl font-black text-white mb-2">Credits Added!</h2>
              <p className="text-gray-400 text-sm mb-1">
                <span className="text-cyan-400 font-black text-xl">{creditsGranted}</span> search credits
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Your credits are ready to use right now — no sign-in needed.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 rounded-2xl bg-cyan-500 text-gray-950 font-black text-sm"
              >
                Start Searching
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight">Get More Power</h1>
        <p className="text-gray-400 text-sm mt-1">
          Credits for searches · Subscriptions for unlimited access
        </p>
      </div>

      {/* Current plan banner */}
      {(isPremium || isVIP || isLegacy) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-center gap-3"
        >
          <Crown className="w-6 h-6 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="font-bold text-yellow-300 text-sm">
              {isLegacy ? "Legacy Member 👑" : isVIP ? "VIP Annual 💎" : "Premium Member ⭐"}
            </p>
            <p className="text-yellow-400/70 text-xs">You already have full access</p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-900 rounded-2xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("credits")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "credits" ? "bg-cyan-500 text-white shadow" : "text-gray-400"
          }`}
        >
          <Zap className="w-4 h-4 inline mr-1.5 mb-0.5" />
          Credits
        </button>
        <button
          onClick={() => setActiveTab("subscribe")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "subscribe" ? "bg-purple-600 text-white shadow" : "text-gray-400"
          }`}
        >
          <Crown className="w-4 h-4 inline mr-1.5 mb-0.5" />
          Subscribe
        </button>
      </div>

      {/* ── CREDITS TAB ─────────────────────────────────────────────────── */}
      {activeTab === "credits" && (
        <motion.div
          key="credits"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-gray-500 text-xs text-center mb-5">
            Pay once · Use anytime · Credits never expire
          </p>

          <div className="flex flex-col gap-4">
            {CREDIT_PACKS.map((pack) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative rounded-2xl border p-5 flex items-center justify-between ${
                  pack.highlight
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-gray-800 bg-gray-900"
                }`}
              >
                {pack.highlight && (
                  <span className="absolute -top-2.5 left-4 bg-cyan-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    MOST POPULAR
                  </span>
                )}
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black">{pack.credits}</span>
                    <span className="text-gray-400 text-sm font-semibold">credits</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    ${(pack.price / pack.credits).toFixed(2)} per search
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xl font-black">${pack.price.toFixed(2)}</span>
                  <button
                    onClick={() => handleBuyCredits(pack)}
                    disabled={processingItem !== null}
                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                      pack.highlight
                        ? "bg-cyan-500 hover:bg-cyan-400 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                  >
                    {processingItem === pack.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : "Buy"
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-gray-600 text-xs mt-6 px-4">
            Credits are used for AI match analysis, player stats, and team breakdowns.
          </p>
        </motion.div>
      )}

      {/* ── SUBSCRIBE TAB ───────────────────────────────────────────────── */}
      {activeTab === "subscribe" && (
        <motion.div
          key="subscribe"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-5"
        >
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrentPlan =
              (plan.id === "premium" && isPremium) ||
              (plan.id === "vip" && isVIP);

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 ${
                  plan.id === "vip"
                    ? "border-yellow-400/40 bg-yellow-500/5"
                    : "border-purple-400/40 bg-purple-500/5"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-black text-base">{plan.label}</p>
                    {plan.badge && (
                      <span className="text-[10px] font-bold text-green-400">{plan.badge}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black">{plan.price}</span>
                    <span className="text-gray-400 text-xs ml-0.5">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.id === "vip" ? "text-yellow-400" : "text-purple-400"}`} />
                      {perk}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <div className={`w-full py-3 rounded-xl text-center text-sm font-bold opacity-60 bg-gradient-to-r ${plan.color}`}>
                    ✓ Current Plan
                  </div>
                ) : isLegacy ? (
                  <div className="w-full py-3 rounded-xl text-center text-sm font-bold bg-gray-800 text-gray-500">
                    Legacy Access Active
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={processingItem !== null}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 bg-gradient-to-r ${plan.color} text-white`}
                  >
                    {processingItem === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                      </span>
                    ) : `Get ${plan.label}`}
                  </button>
                )}
              </div>
            );
          })}

          <p className="text-gray-600 text-xs text-center px-4">
            Subscriptions auto-renew. Cancel anytime in your App Store settings.
          </p>
        </motion.div>
      )}

      {/* Restore Purchases */}
      <div className="mt-8 text-center">
        <button
          onClick={handleRestore}
          className="flex items-center gap-1.5 text-gray-600 text-xs mx-auto hover:text-gray-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restore Purchases
        </button>
      </div>
    </div>
  );
}
