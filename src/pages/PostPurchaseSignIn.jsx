import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { triggerAppleSignIn } from '@/components/utils/iapBridge';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PostPurchaseSignIn() {
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [isAppleSignInLoading, setIsAppleSignInLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const receipt = localStorage.getItem('pending_iap_receipt');
    const product = localStorage.getItem('pending_iap_product');
    const platform = localStorage.getItem('pending_iap_platform');
    if (receipt && product) {
      setPendingPurchase({ receipt, product, platform });
    }
  }, []);

  const handleAppleSignIn = async () => {
    setIsAppleSignInLoading(true);
    setError(null);
    try {
      const result = await triggerAppleSignIn();
      if (!result.success) {
        if (result.error !== 'user_cancelled') {
          setError('Apple Sign In failed. Please try again.');
        }
        return;
      }

      // ✅ Use the Vercel API route (same as Splash.jsx) — NOT base44.functions
      const resp = await fetch('/api/handleAppleSignIn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'nativeSignIn',
          identityToken: result.identityToken,
          authorizationCode: result.authorizationCode,
          user: result.user,
          email: result.email,
          fullName: result.fullName,
        }),
      });

      const data = await resp.json();

      if (data?.success) {
        // Store user locally (same pattern as Splash.jsx)
        localStorage.setItem('swh_user', JSON.stringify(data.user));
        localStorage.setItem('swh_apple_user_id', data.user.apple_user_id || '');

        // Set Base44 session token
        if (data.sessionToken) {
          try { await base44.auth.setToken(data.sessionToken); } catch (e) {
            console.warn('setToken failed:', e.message);
          }
        }

        // Notify native wrapper
        if (window.ReactNativeWebView && data.user?.id) {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SAVE_SESSION',
              data: {
                userId: data.user.id,
                email: data.user.email || '',
                isPremium: data.user.subscription_status === 'active',
                plan: data.user.subscription_type || 'free',
              }
            }));
          } catch (e) { /* non-native env */ }
        }

        // Navigate to MyAccount to activate the pending IAP
        navigate(createPageUrl('MyAccount') + '?activate_iap=true', { replace: true });
      } else {
        setError(data?.error || 'Sign in failed. Please try again.');
      }
    } catch (err) {
      console.error('Apple Sign In error:', err);
      setError('Sign in failed. Please check your connection and try again.');
    } finally {
      setIsAppleSignInLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <Card className="bg-slate-800/90 border-slate-700 shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">

            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/40">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Purchase Complete! 🎉</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sign in with Apple to save your credits to your account and access them on any device.
              </p>
            </div>

            {pendingPurchase && (
              <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600">
                <p className="text-xs text-slate-400">Pending activation</p>
                <p className="text-sm font-bold text-lime-400 mt-1">{pendingPurchase.product}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={handleAppleSignIn}
              disabled={isAppleSignInLoading}
              className="w-full py-4 rounded-2xl bg-white text-black font-black text-base flex items-center justify-center gap-3 hover:bg-gray-100 disabled:opacity-60 h-auto"
            >
              {isAppleSignInLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
              {isAppleSignInLoading ? 'Signing in...' : 'Sign In with Apple'}
            </Button>

            <p className="text-xs text-slate-500 leading-relaxed">
              Your purchase is saved and won't be lost. Sign in anytime to activate your credits.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
