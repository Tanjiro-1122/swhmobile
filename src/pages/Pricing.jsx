import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Zap, Loader2, RotateCcw, LogIn, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlatform } from "@/components/hooks/usePlatform";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  triggerRevenueCatPurchase,
  triggerRestorePurchases,
  callNativeIAPWithCallback,
  submitReceiptToServer,
  triggerAppleSignIn,
} from "@/components/utils/iapBridge";

const CREDIT_PACKS = [
  { id: "small",  credits: 25,  price: 4.99,  productId: "com.sportswagerhelper.credits.25",  label: "Starter" },
  { id: "medium", credits: 60,  price: 9.99,  productId: "com.sportswagerhelper.credits.60",  label: "Popular", highlight: true },
  { id: "large",  credits: 100, price: 14.99, productId: "com.sportswagerhelper.credits.100", label: "Best Value" },
];

// ✅ Helper: update credits in both swh_user and swh_search_credits keys
function addCreditsToLocalStorage(creditsToAdd) {
  // Update swh_search_credits (legacy key)
  const existing = parseInt(localStorage.getItem("swh_search_credits") || "5", 10);
  const newTotal = existing + creditsToAdd;
  localStorage.setItem("swh_search_credits", String(newTotal));

  // ✅ Also update swh_user.search_credits so Dashboard reads the right value
  try {
    const stored = localStorage.getItem("swh_user");
    if (stored) {
      const user = JSON.parse(stored);
      const userCredits = user.search_credits ?? user.credits ?? existing;
      const updatedUser = { ...user, search_credits: userCredits + creditsToAdd };
      localStorage.setItem("swh_user", JSON.stringify(updatedUser));
    }
  } catch {}

  return newTotal;
}

export default function Pricing() {
  const [processingItem, setProcessingItem] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creditsGranted, setCreditsGranted] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const iapTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { isIOSNative, isAndroidNative } = usePlatform();

  useEffect(() => {
    isMountedRef.current = true;

    const handleNativeMessage = (event) => {
      try {
        let msg = event.data;
        if (typeof msg === "string") msg = JSON.parse(msg);
        if (typeof msg === "string") msg = JSON.parse(msg);

        if (msg?.type === "POST_PURCHASE_APPLE_SIGN_IN") {
          if (msg.success && msg.identityToken) {
            // ✅ Use Vercel API route — NOT base44.functions.invoke (broken/empty)
            fetch("/api/handleAppleSignIn", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                identityToken: msg.identityToken,
                authorizationCode: msg.authorizationCode,
                user: msg.user,
                email: msg.email,
                fullName: msg.fullName,
              }),
            })
              .then((r) => r.json())
              .then((data) => {
                if (data?.success) {
                  // Save user + session
                  localStorage.setItem("swh_user", JSON.stringify(data.user));
                  localStorage.setItem("swh_apple_user_id", data.user.apple_user_id || "");
                  localStorage.setItem("swh_search_credits", String(data.user.search_credits ?? 5));
                  if (data.sessionToken) {
                    base44.auth.setToken(data.sessionToken).catch(() => {});
                  }
                }
              })
              .catch((e) =>
                console.warn("[PostPurchaseAppleSignIn] silent link failed:", e)
              );
          }
        }
      } catch {}
    };

    window.addEventListener("message", handleNativeMessage);
    if (typeof window.__nativeBus !== "undefined") {
      const prev = window.__nativeBus;
      window.__nativeBus = (msg) => {
        handleNativeMessage({ data: msg });
        prev(msg);
      };
    }

    return () => {
      isMountedRef.current = false;
      if (iapTimeoutRef.current) clearTimeout(iapTimeoutRef.current);
      window.removeEventListener("message", handleNativeMessage);
    };
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("swh_user");
        if (stored) return JSON.parse(stored);
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return null;
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const isSignedIn = !!currentUser;

  // ── Go back to dashboard ────────────────────────────────────────────────
  const goToDashboard = () => {
    navigate(createPageUrl("Dashboard"), { replace: true });
  };

  // ── Apple Sign In ────────────────────────────────────────────────────────
  const handleAppleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await triggerAppleSignIn();
      if (!result.success) {
        if (result.error !== "user_cancelled") {
          alert("Apple Sign In failed. Please try again.");
        }
        return;
      }
      const resp = await fetch("/api/handleAppleSignIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "nativeSignIn",
          identityToken: result.identityToken,
          authorizationCode: result.authorizationCode,
          user: result.user,
          email: result.email,
          fullName: result.fullName,
        }),
      });
      const data = await resp.json();
      if (data?.success) {
        localStorage.setItem("swh_user", JSON.stringify(data.user));
        localStorage.setItem("swh_apple_user_id", data.user.apple_user_id || "");
        localStorage.setItem("swh_search_credits", String(data.user.search_credits ?? 5));
        if (data.sessionToken) {
          try { await base44.auth.setToken(data.sessionToken); } catch {}
        }
        // Notify native wrapper
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "SAVE_SESSION",
            data: {
              userId: data.user.apple_user_id,
              email: data.user.email || "",
              isPremium: data.user.subscription_status === "active",
              plan: data.user.subscription_type || "free",
            },
          }));
        }
        // Refresh user query
        queryClient.invalidateQueries(["currentUser"]);
        goToDashboard();
      } else {
        alert(data?.error || "Sign in failed. Please try again.");
      }
    } catch (err) {
      console.error("Apple Sign In error:", err);
      alert("Apple Sign In failed. Please try again.");
    } finally {
      if (isMountedRef.current) setIsSigningIn(false);
    }
  };

  // ── Credit purchase ──────────────────────────────────────────────────────
  const handleBuyCredits = async (pack) => {
    if (processingItem) return;
    setProcessingItem(pack.id);

    if (isIOSNative) {
      try {
        const result = await triggerRevenueCatPurchase(pack.productId);
        if (result.success) {
          // ✅ Update both localStorage keys so Dashboard credit count is accurate
          addCreditsToLocalStorage(pack.credits);
          setCreditsGranted(pack.credits);
          setShowSuccessModal(true);
        } else if (result.error !== "user_cancelled") {
          alert(
            `Purchase failed: ${result.error || "Unknown error"}. Please try again.`
          );
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
      if (isMountedRef.current) {
        setProcessingItem(null);
        alert("Purchase timed out. Please try again.");
      }
    }, 30000);

    try {
      await callNativeIAPWithCallback(
        {
          productId: pack.productId,
          productType: isAndroidNative ? "INAPP" : "CONSUMABLE",
          isConsumable: true,
        },
        (data) => {
          if (iapTimeoutRef.current) {
            clearTimeout(iapTimeoutRef.current);
            iapTimeoutRef.current = null;
          }
          if (!isMountedRef.current) return;
          if (data.isSuccess && (data.receiptData || data.purchaseToken)) {
            submitReceiptToServer({
              receipt: data.receiptData,
              purchaseToken: data.purchaseToken,
              productId: data.productId || pack.productId,
              platform: data.purchaseToken ? "android" : "ios",
            });
            // ✅ Update both localStorage keys
            addCreditsToLocalStorage(pack.credits);
            setProcessingItem(null);
            setCreditsGranted(pack.credits);
            setShowSuccessModal(true);
          } else {
            const cancelled =
              data.isCancelled ||
              ["user_cancelled", "cancelled", "payment_cancelled"].includes(
                data.error
              );
            if (!cancelled && data.error)
              alert(`Purchase failed: ${data.error}. Please try again.`);
            setProcessingItem(null);
          }
        }
      );
    } catch {
      if (iapTimeoutRef.current) {
        clearTimeout(iapTimeoutRef.current);
        iapTimeoutRef.current = null;
      }
      setProcessingItem(null);
    }
  };

  // ── Restore ──────────────────────────────────────────────────────────────
  const handleRestore = async () => {
    if (processingItem) return;
    setProcessingItem("restore");
    try {
      await triggerRestorePurchases();
    } catch (e) {
      console.warn("Restore error:", e);
    } finally {
      if (isMountedRef.current) setProcessingItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 pt-6 pb-24">

      {/* ── Back Button ─────────────────────────────────────────────────── */}
      <button
        onClick={goToDashboard}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </button>

      {/* ── Credit Purchase Success Modal ──────────────────────────────── */}
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
              className="bg-gray-900 border border-cyan-500/40 rounded-3xl p-8 text-center w-full max-w-sm relative"
            >
              {/* ✕ close button — always visible */}
              <button
                onClick={goToDashboard}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-5xl mb-4">⚡️</div>
              <h2 className="text-2xl font-black text-white mb-2">Credits Added!</h2>
              <p className="text-gray-400 text-sm mb-1">
                <span className="text-cyan-400 font-black text-xl">{creditsGranted}</span>{" "}
                search credits added
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Sign in to sync your credits across devices, or start searching right now.
              </p>

              {/* Sign in to save credits — only show if not already signed in */}
              {!isSignedIn && isIOSNative && (
                <button
                  onClick={async () => {
                    setShowSuccessModal(false);
                    await handleAppleSignIn();
                  }}
                  disabled={isSigningIn}
                  className="w-full py-3 rounded-2xl bg-black border border-white/20 text-white font-bold text-sm mb-3 flex items-center justify-center gap-2"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-lg"></span>
                  )}
                  Sign in with Apple to save credits
                </button>
              )}

              {/* Start Searching — always navigates to Dashboard */}
              <button
                onClick={goToDashboard}
                className="w-full py-3 rounded-2xl bg-cyan-500 text-gray-950 font-black text-sm"
              >
                Start Searching →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Get More Credits</h1>
        <p className="text-gray-500 text-sm">Pay once · Use anytime · Credits never expire</p>
      </div>

      {/* ── Sign-in nudge (only shown when not signed in) ──────────────── */}
      {!isSignedIn && isIOSNative && (
        <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="text-yellow-400 font-bold text-sm mb-1">🔒 Sign in to save your credits</p>
          <p className="text-gray-400 text-xs mb-3">Without signing in, credits are stored on this device only.</p>
          <button
            onClick={handleAppleSignIn}
            disabled={isSigningIn}
            className="w-full py-2.5 rounded-xl bg-black border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <span></span>}
            Sign in with Apple
          </button>
        </div>
      )}

      {/* ── Credit packs ────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative rounded-2xl border p-5 flex items-center justify-between ${
              pack.highlight
                ? "border-cyan-500/60 bg-cyan-500/5"
                : "border-gray-800 bg-gray-900/50"
            }`}
          >
            {pack.highlight && (
              <span className="absolute -top-3 left-4 bg-cyan-500 text-gray-950 text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wide">
                Most Popular
              </span>
            )}
            <div>
              <p className="text-2xl font-black text-white">
                {pack.credits}{" "}
                <span className="text-base font-semibold text-gray-400">credits</span>
              </p>
              <p className="text-xs text-gray-500">
                ${(pack.price / pack.credits).toFixed(2)} per search
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white font-black text-lg">${pack.price}</span>
              <button
                onClick={() => handleBuyCredits(pack)}
                disabled={!!processingItem}
                className={`px-5 py-2 rounded-xl font-black text-sm transition-all ${
                  pack.highlight
                    ? "bg-cyan-500 text-gray-950 hover:bg-cyan-400"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                } disabled:opacity-50`}
              >
                {processingItem === pack.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Buy"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Restore ─────────────────────────────────────────────────────── */}
      <div className="text-center">
        <button
          onClick={handleRestore}
          disabled={!!processingItem}
          className="flex items-center gap-2 mx-auto text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          {processingItem === "restore" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          Restore Purchases
        </button>
      </div>
    </div>
  );
}
