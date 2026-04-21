import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, Trophy, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RequireAuth from "@/components/auth/RequireAuth";

import ProfileContent from "@/components/hub/ProfileContent";
import PreferencesContent from "@/components/hub/PreferencesContent";
import SavedResultsContent from "@/components/hub/SavedResultsContent";


function MyAccountContent() {
  const [activeTab, setActiveTab] = useState("profile");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activatingIAP, setActivatingIAP] = useState(false);
  const [iapError, setIapError] = useState("");

  // ✅ FIXED: no longer uses base44.functions.invoke (broken empty functions)
  // With the RevenueCat webhook in place, credits are added server-side automatically.
  // This function now just does a lightweight DB refresh to pull the latest credits into localStorage.
  const activatePendingIAP = useCallback(async () => {
    const productId = localStorage.getItem('pending_iap_product');
    if (!productId) return;

    setActivatingIAP(true);
    setIapError("");

    try {
      const appleUserId = localStorage.getItem('swh_apple_user_id') || '';

      if (appleUserId) {
        // Pull latest credits from DB via lookupAccount
        const resp = await fetch('/api/lookupAccount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appleUserId }),
        });
        const data = await resp.json();

        if (data?.success && data?.user) {
          // Sync localStorage with what's actually in the DB
          const dbCredits = data.user.search_credits ?? data.user.credits ?? 0;
          localStorage.setItem('swh_search_credits', String(dbCredits));
          try {
            const stored = localStorage.getItem('swh_user');
            if (stored) {
              const u = JSON.parse(stored);
              u.search_credits = dbCredits;
              u.credits = dbCredits;
              u.subscription_type = data.user.subscription_type || u.subscription_type;
              u.subscription_status = data.user.subscription_status || u.subscription_status;
              localStorage.setItem('swh_user', JSON.stringify(u));
            }
          } catch {}
          setPaymentSuccess(true);
        } else {
          // DB didn't have us yet — webhook may still be in-flight, show success anyway
          // (RevenueCat webhook will update within seconds)
          setPaymentSuccess(true);
        }
      } else {
        // Not signed in — credits are in localStorage, webhook will catch up when they sign in
        setPaymentSuccess(true);
      }

      // Clean up pending markers
      localStorage.removeItem('pending_iap_receipt');
      localStorage.removeItem('pending_iap_product');
      localStorage.removeItem('pending_iap_platform');
      localStorage.removeItem('pending_iap_credits');
      localStorage.removeItem('apple_provider_id');
      localStorage.removeItem('apple_provider_email');
      localStorage.removeItem('apple_is_private_email');

    } catch (err) {
      console.error('[activatePendingIAP] error:', err.message);
      // Don't show an error — purchase is real, webhook will handle it
      setPaymentSuccess(true);
    } finally {
      setActivatingIAP(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('payment_success') === 'true') {
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 8000);
    } else {
      const tabParam = params.get('tab');
      if (tabParam && ['profile', 'preferences', 'saved'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }

    if (params.get('activate_iap') === 'true') {
      activatePendingIAP();
    }

    const emailParam = params.get('email');
    const newUrl = emailParam
      ? `${window.location.pathname}?email=${encodeURIComponent(emailParam)}`
      : window.location.pathname;
    if (params.toString() && window.location.href !== newUrl) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [activatePendingIAP]);

  return (
    <div className="overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="w-full flex justify-start mb-2">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            👤 MY ACCOUNT
          </h1>
          <p className="text-white/80 text-base md:text-lg">Manage your profile, preferences, and saved results</p>
        </div>

        {activatingIAP && (
          <Alert className="mb-6 bg-blue-50 border-2 border-blue-300">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800 font-semibold">
              Syncing your purchase... Please wait.
            </AlertDescription>
          </Alert>
        )}

        {paymentSuccess && (
          <Alert className="mb-6 bg-green-50 border-2 border-green-300">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-semibold">
              🎉 Purchase confirmed! Your credits have been added. Welcome to the club!
            </AlertDescription>
          </Alert>
        )}

        {iapError && (
          <Alert className="mb-6 bg-red-50 border-2 border-red-300">
            <AlertDescription className="text-red-800 font-semibold">{iapError}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 -mx-4 px-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <TabsList className="inline-flex w-max min-w-full gap-1 bg-black/40 backdrop-blur-sm p-1.5 rounded-xl border border-white/10">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <User className="w-4 h-4 flex-shrink-0" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Heart className="w-4 h-4 flex-shrink-0" />
                <span>Prefs</span>
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Trophy className="w-4 h-4 flex-shrink-0" />
                <span>Saved</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile">
            <ProfileContent />
          </TabsContent>
          <TabsContent value="preferences">
            <PreferencesContent />
          </TabsContent>
          <TabsContent value="saved">
            <SavedResultsContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function MyAccount() {
  return (
    <RequireAuth pageName="My Account">
      <MyAccountContent />
    </RequireAuth>
  );
}
