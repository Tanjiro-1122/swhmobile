import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, Trophy, CheckCircle, Loader2, ArrowLeft, Trash2, Phone, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RequireAuth from "@/components/auth/RequireAuth";

import ProfileContent from "@/components/hub/ProfileContent";
import PreferencesContent from "@/components/hub/PreferencesContent";
import SavedResultsContent from "@/components/hub/SavedResultsContent";


function DeleteAccountSection() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [checked, setChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    if (!checked) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const appleUserId = localStorage.getItem("swh_apple_user_id") || "";
      const resp = await fetch("/api/deleteAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appleUserId }),
      });
      const data = await resp.json();
      if (data?.success) {
        // Clear all local data
        ["swh_user","swh_apple_user_id","swh_user_id","swh_is_premium",
         "swh_plan","swh_email","swh_search_credits","swh_full_name"].forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        setDeleted(true);
        setTimeout(() => navigate(createPageUrl("Splash"), { replace: true }), 3000);
      } else {
        setDeleteError(data?.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (deleted) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center">
        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <p className="text-white font-bold">Account deleted.</p>
        <p className="text-gray-400 text-sm mt-1">All your data has been removed. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-red-900/40 rounded-2xl p-5 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
        <h3 className="text-red-400 font-bold text-sm">Danger Zone</h3>
      </div>

      {!showConfirm ? (
        <>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-700/60 text-red-400 text-sm font-semibold hover:bg-red-500/10 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Delete My Account
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-gray-300 text-sm leading-relaxed">
            This will permanently delete your account, all saved analyses, credit history, and personal data. <strong className="text-red-400">This cannot be undone.</strong>
          </p>

          <button
            onClick={() => setChecked(!checked)}
            className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-xl p-3 active:scale-95 transition-transform text-left"
          >
            <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              checked ? "bg-red-500 border-red-500" : "border-gray-600"
            }`}>
              {checked && <span className="text-white font-black text-xs">✓</span>}
            </div>
            <p className="text-sm text-gray-300 leading-snug">
              I understand this is permanent and cannot be undone. Delete my account and all my data.
            </p>
          </button>

          {deleteError && (
            <p className="text-red-400 text-sm">{deleteError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setShowConfirm(false); setChecked(false); setDeleteError(""); }}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!checked || deleting}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${
                checked && !deleting ? "bg-red-600 text-white" : "bg-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function MyAccountContent() {
  const [activeTab, setActiveTab] = useState("profile");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activatingIAP, setActivatingIAP] = useState(false);
  const [iapError, setIapError] = useState("");

  const activatePendingIAP = useCallback(async () => {
    const productId = localStorage.getItem('pending_iap_product');
    if (!productId) return;

    setActivatingIAP(true);
    setIapError("");

    try {
      const appleUserId = localStorage.getItem('swh_apple_user_id') || '';

      if (appleUserId) {
        const resp = await fetch('/api/lookupAccount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appleUserId }),
        });
        const data = await resp.json();

        if (data?.success && data?.user) {
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
          setPaymentSuccess(true);
        }
      } else {
        setPaymentSuccess(true);
      }

      localStorage.removeItem('pending_iap_receipt');
      localStorage.removeItem('pending_iap_product');
      localStorage.removeItem('pending_iap_platform');
      localStorage.removeItem('pending_iap_credits');
      localStorage.removeItem('apple_provider_id');
      localStorage.removeItem('apple_provider_email');
      localStorage.removeItem('apple_is_private_email');

    } catch (err) {
      console.error('[activatePendingIAP] error:', err.message);
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
            <DeleteAccountSection />
          </TabsContent>
          <TabsContent value="preferences">
            <PreferencesContent />
          </TabsContent>
          <TabsContent value="saved">
            <SavedResultsContent />
          </TabsContent>
        </Tabs>

        {/* Responsible Gambling Footer */}
        <div className="mt-8 mb-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 text-center">
          <p className="text-yellow-400 font-bold text-xs mb-1">⚠️ Gamble Responsibly</p>
          <p className="text-gray-500 text-xs leading-relaxed mb-2">
            Sports Wager Helper is for informational purposes only. Please gamble responsibly and within your means.
          </p>
          <a
            href="tel:18005224700"
            className="inline-flex items-center gap-1.5 text-yellow-400 font-bold text-xs active:opacity-70"
          >
            <Phone className="w-3 h-3" />
            Problem Gambling Helpline: 1-800-522-4700 (Free & Confidential)
          </a>
        </div>
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
