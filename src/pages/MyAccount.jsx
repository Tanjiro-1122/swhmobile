import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, Trophy, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import RequireAuth from "@/components/auth/RequireAuth";

import ProfileContent from "@/components/hub/ProfileContent";
import PreferencesContent from "@/components/hub/PreferencesContent";
import SavedResultsContent from "@/components/hub/SavedResultsContent";
import SubscriptionContent from "@/components/hub/SubscriptionContent";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";

function MyAccountContent() {
  const [activeTab, setActiveTab] = useState("profile");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activatingIAP, setActivatingIAP] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Handle tab parameter
    const tabParam = params.get('tab');
    if (tabParam && ['profile', 'subscription', 'preferences', 'saved'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Handle payment success
    if (params.get('payment_success') === 'true') {
      setPaymentSuccess(true);
      setActiveTab("subscription");
    }
    
    // Handle pending IAP activation after login
    if (params.get('activate_iap') === 'true') {
      activatePendingIAP();
    }
    
    // Clean URL
    if (params.toString()) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const activatePendingIAP = async () => {
    const receipt = localStorage.getItem('pending_iap_receipt');
    const productId = localStorage.getItem('pending_iap_product');
    
    if (receipt && productId) {
      setActivatingIAP(true);
      try {
        const response = await base44.functions.invoke('handleAppleIAP', {
          receipt,
          productId
        });

        if (response.data.success) {
          setPaymentSuccess(true);
          setActiveTab("subscription");
          // Clear stored data
          localStorage.removeItem('pending_iap_receipt');
          localStorage.removeItem('pending_iap_product');
        } else {
          alert('Failed to activate subscription. Please contact support.');
        }
      } catch (error) {
        console.error('IAP activation error:', error);
        alert('Failed to activate subscription. Please contact support.');
      } finally {
        setActivatingIAP(false);
      }
    }
  };

  return (
        <div className="min-h-screen overflow-x-hidden">
          <div className="max-w-5xl mx-auto">
            {/* Header - 8-point grid: 32px bottom margin, 24px padding */}
            <div className="mb-8 bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                👤 MY ACCOUNT
              </h1>
              <p className="text-white/70 text-base md:text-lg">Manage your profile, preferences, and saved results</p>
            </div>

            {activatingIAP && (
              <Alert className="mb-6 bg-blue-50 border-2 border-blue-300">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <AlertDescription className="text-blue-800 font-semibold">
                  Activating your subscription... Please wait.
                </AlertDescription>
              </Alert>
            )}

            {paymentSuccess && (
              <Alert className="mb-6 bg-green-50 border-2 border-green-300">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 font-semibold">
                  🎉 Payment successful! Your subscription is now active. Welcome to the club!
                </AlertDescription>
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
                value="subscription" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span>Plan</span>
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

          <TabsContent value="subscription">
            <SubscriptionContent />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesContent />
          </TabsContent>

          <TabsContent value="saved">
            <SavedResultsContent />
          </TabsContent>
          </Tabs>
          <FloatingDashboardButton />
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