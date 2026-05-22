import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles, Shield, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { usePlatform } from '@/components/hooks/usePlatform';
import { triggerAppleSignIn } from '@/components/utils/iapBridge';
import RestorePurchasesModal from "../hub/RestorePurchasesModal";

export default function RequireAuth({ children, pageName = "this feature" }) {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const { isIOSNative, isNativeApp } = usePlatform();
  const [isAppleSignInLoading, setIsAppleSignInLoading] = useState(false);

  useEffect(() => {
    setIsMobileApp(isNativeApp);
  }, [isNativeApp]);

  const handleViewPricing = () => {
    window.location.href = '/Pricing';
  };

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

      const resp = await fetch('/api/handleAppleSignIn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'nativeSignIn',
          identityToken: result.identityToken,
          user: result.user,
          fullName: result.fullName,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        // Store swh_user in localStorage for mobile fallback
        if (data.user) localStorage.setItem('swh_user', JSON.stringify(data.user));
        await refreshUser();
      } else {
        alert(data.error || 'Sign in failed. Please try again.');
      }
    } catch (err) {
      console.error('Apple Sign In error:', err);
      alert('Sign in failed. Please try again.');
    } finally {
      setIsAppleSignInLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-green-400" />
            </div>
            <CardTitle className="text-white text-xl">Sign In Required</CardTitle>
            <p className="text-slate-400 text-sm">You need to be signed in to access {pageName}</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {isMobileApp ? (
              <Button
                className="w-full bg-white text-black hover:bg-gray-100 font-semibold"
                onClick={handleAppleSignIn}
                disabled={isAppleSignInLoading}
              >
                {isAppleSignInLoading ? (
                  <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />Signing in...</>
                ) : (
                  <><span className="mr-2 text-lg"></span>Sign in with Apple</>
                )}
              </Button>
            ) : (
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={() => window.location.href = '/EmailSignIn'}>
                Sign In
              </Button>
            )}
            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700" onClick={handleViewPricing}>
              <Sparkles className="w-4 h-4 mr-2" /> View Plans
            </Button>
            <button
              className="w-full text-xs text-slate-500 hover:text-slate-400 underline py-1"
              onClick={() => setShowRestoreModal(true)}
            >
              Already subscribed? Restore purchases
            </button>
          </CardContent>
        </Card>
        <RestorePurchasesModal open={showRestoreModal} onOpenChange={setShowRestoreModal} />
      </motion.div>
    </div>
  );
}
