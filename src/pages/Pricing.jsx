import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Zap, Loader2, RotateCcw, LogIn } from "lucide-react";
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

export default function Pricing() {
  const [processingItem, setProcessingItem] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creditsGranted, setCreditsGranted] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const iapTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();

  const { isIOSNative, isAndroidNative } = usePlatform();

  useEffect(() => {
    isMountedRef.current = true;

    // Listen for post-purchase Apple sign-in result from native wrapper
    const handleNativeMessage = (event) => {
      try {
        let msg = event.data;
        if (typeof msg === "string") msg = JSON.parse(msg);
        if (typeof msg === "string") msg = JSON.parse(msg);

        if (msg?.type === "POST_PURCHASE_APPLE_SIGN_IN") {
          if (msg.success && msg.identityToken) {
            base44.functions
              .invoke("appleSignIn", {
                identityToken: msg.identityToken,
                authorizationCode: msg.authorizationCode,
                user: msg.user,
                email: msg.email,
                fullName: msg.fullName,
                creditsAmount: msg.creditsAmount,
                productId: msg.productId,
                source: "post_purchase",
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
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return null;
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const isSignedIn = !!currentUser;

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
      const resp = await base44.functions.invoke("handleAppleSignIn", {
        action: "nativeSignIn",
        identityToken: result.identityToken,
        authorizationCode: result.authorizationCode,
        user: result.user,
        email: result.email,
        fullName: result.fullName,
      });
      if (resp.data?.success && resp.data?.sessionToken) {
        await base44.auth.setToken(resp.data.sessionToken);
        navigate(createPageUrl("Dashboard"), { replace: true });
      } else {
        alert(resp.data?.error || "Sign in failed. Please try again.");
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
          const existing = parseInt(
            localStorage.getItem("swh_search_credits") || "5",
            10
          );
          const newTotal = existing + pack.credits;
          localStorage.setItem("swh_search_credits", String(newTotal));
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
            const existing = parseInt(
              localStorage.getItem("swh_search_credits") || "5",
              10
            );
            localStorage.setItem(
              "swh_search_credits",
              String(existing + pack.credits)
            );
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
              className="bg-gray-900 border border-cyan-500/40 rounded-3xl p-8 text-center w-full max-w-sm"
            >
              <div className="text-5xl mb-4">⚡️</div>
              <h2 className="text-2xl font-black text-white mb-2">Credits Added!</h2>
              <p className="text-gray-400 text-sm mb-1">
                <span className="text-cyan-400 font-black text-xl">{creditsGranted}</span>{" "}
                search credits added
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Sign in to sync your credits across devices, or start searching right now.
              </p>

              {/* Sign in to save credits */}
              {!isSignedIn && isIOSNative && (
                <button
                  onClick={async () => {
                    setShowSuccessModal(false);
                    await handleAppleSignIn();
                  }}
                  className="w-full py-3 rounded-2xl bg-black border border-white/20 text-white font-bold text-sm mb-3 flex items-center justify-center gap-2"
                >
                  <span className="text-lg"></span> Sign in with Apple to save credits
                </button>
              )}

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(createPageUrl("Dashboard"), { replace: true });
                }}
                className="w-full py-3 rounded-2xl bg-cyan-500 text-gray-950 font-black text-sm"
              >
                Start Searching →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight">Get More Credits</h1>
        <p className="text-gray-400 text-sm mt-1">
          Pay once · Use anytime · Credits never expire
        </p>
      </div>

      {/* Sign In Banner — shown to guests */}
      {!isSignedIn && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4"
        >
          <p className="text-blue-300 text-sm font-semibold mb-1">
            🔒 Sign in to save your credits
          </p>
          <p className="text-blue-400/70 text-xs mb-3">
            Without signing in, credits are stored on this device only.
          </p>
          {isIOSNative ? (
            <button
              onClick={handleAppleSignIn}
              disabled={isSigningIn}
              className="w-full py-2.5 rounded-xl bg-black border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              {isSigningIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="text-lg"></span> Sign in with Apple
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/Splash'}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          )}
        </motion.div>
      )}

      {/* Credit Packs */}
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
                {processingItem === pack.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Buy"
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-gray-600 text-xs mt-6 px-4">
        Credits are used for AI match analysis, player stats, and team breakdowns.
      </p>

      {/* Restore Purchases */}
      <div className="mt-8 text-center">
        <button
          onClick={handleRestore}
          disabled={processingItem === "restore"}
          className="flex items-center gap-1.5 text-gray-600 text-xs mx-auto hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          {processingItem === "restore" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          Restore Purchases
        </button>
      </div>
    </div>
  );
}
