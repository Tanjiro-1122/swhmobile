import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { triggerAppleSignIn } from '@/components/utils/iapBridge';


export default function PostPurchaseSignIn() {
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [isAppleSignInLoading, setIsAppleSignInLoading] = useState(false);

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
    try {
      const result = await triggerAppleSignIn();
      if (!result.success) {
        if (result.error !== 'user_cancelled') {
          alert('Apple Sign In failed. Please try again.');
        }
        return;
      }
      const resp = await base44.functions.invoke('handleAppleSignIn', {
        action: 'nativeSignIn',
        identityToken: result.identityToken,
        authorizationCode: result.authorizationCode,
        user: result.user,
        email: result.email,
        fullName: result.fullName,
      });
      if (resp.data?.success && resp.data?.sessionToken) {
        await base44.auth.setToken(resp.data.sessionToken);
        window.location.href = '/MyAccount?activate_iap=true';
      } else {
        alert(resp.data?.error || 'Sign in failed. Please try again.');
      }
    } catch (err) {
      console.error('Apple Sign In error:', err);
      alert('Apple Sign In failed. Please try again.');
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
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-black/60 backdrop-blur-xl border-2 border-green-500/50 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-black text-white text-center mb-2">
              Payment Successful! 🎉
            </h1>
            <p className="text-white/70 text-center mb-8">
              Sign in to activate your subscription and start using all premium features.
            </p>

            <div className="space-y-4">
              <Button
                onClick={handleAppleSignIn}
                disabled={isAppleSignInLoading}
                className="w-full bg-black hover:bg-gray-900 text-white font-bold py-4 text-lg rounded-xl flex items-center justify-center gap-2"
              >
                {isAppleSignInLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <span className="text-xl"></span>
                    Continue with Apple
                  </>
                )}
              </Button>
            </div>

            {pendingPurchase && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-green-400 text-sm text-center">
                  ✓ Your Apple purchase is ready to activate
                </p>
              </div>
            )}

            <p className="text-white/40 text-xs text-center mt-6">
              Your subscription will be activated immediately after sign in.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
