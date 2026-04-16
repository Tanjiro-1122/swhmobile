import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Mail, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { usePlatform } from '@/components/hooks/usePlatform';
import { triggerAppleSignIn } from '@/components/utils/iapBridge';


export default function PostPurchaseSignIn() {
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const { isIOSNative } = usePlatform();
  const [appleSignInLoading, setAppleSignInLoading] = useState(false);

  useEffect(() => {
    // Check for pending IAP purchase data
    const receipt = localStorage.getItem('pending_iap_receipt');
    const product = localStorage.getItem('pending_iap_product');
    const platform = localStorage.getItem('pending_iap_platform');
    
    if (receipt && product) {
      setPendingPurchase({ receipt, product, platform });
    }
  }, []);

  const handleEmailSignIn = () => {
    base44.auth.redirectToLogin('/MyAccount?activate_iap=true');
  };

  const handleAppleSignIn = async () => {
    setAppleSignInLoading(true);
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
      console.error('[PostPurchase] Apple Sign In error:', err);
      alert('Apple Sign In failed. Please try again.');
    } finally {
      setAppleSignInLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background effects */}
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
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-white text-center mb-2">
              Payment Successful! 🎉
            </h1>
            <p className="text-white/70 text-center mb-8">
              Sign in to activate your subscription and start using all premium features.
            </p>

            {/* Sign In Options */}
            <div className="space-y-4">
              {isIOSNative && (
                <Button
                  onClick={handleAppleSignIn}
                  disabled={appleSignInLoading}
                  className="w-full bg-black hover:bg-gray-900 text-white font-bold py-4 text-lg rounded-xl flex items-center justify-center gap-2"
                >
                  {appleSignInLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  )}
                  {appleSignInLoading ? 'Signing in...' : 'Continue with Apple'}
                </Button>
              )}
              {/* Email Sign In */}
              <Button
                onClick={handleEmailSignIn}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 text-lg rounded-xl"
              >
                <Mail className="w-5 h-5 mr-2" />
                Sign in with Email
              </Button>
            </div>

            {/* Pending purchase info */}
            {pendingPurchase && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-green-400 text-sm text-center">
                  ✓ Your {pendingPurchase.platform === 'ios' ? 'Apple' : 'Google Play'} purchase is ready to activate
                </p>
              </div>
            )}

            {/* Help text */}
            <p className="text-white/40 text-xs text-center mt-6">
              Your subscription will be activated immediately after sign in.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
