import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, Trophy, CreditCard, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import RequireAuth from "@/components/auth/RequireAuth";

import ProfileContent from "@/components/hub/ProfileContent";
import PreferencesContent from "@/components/hub/PreferencesContent";
import SavedResultsContent from "@/components/hub/SavedResultsContent";
import SubscriptionContent from "@/components/hub/SubscriptionContent";


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
    
    // Clean URL (keep email param for prefill if present)
    const emailParam = params.get('email');
    const newUrl = emailParam 
      ? `${window.location.pathname}?email=${encodeURIComponent(emailParam)}`
      : window.location.pathname;
    if (params.toString() && window.location.href !== newUrl) {
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const activatePendingIAP = async () => {
    const receipt = localStorage.getItem('pending_iap_receipt');
    const productId = localStorage.getItem('pending_iap_product');
    const platform = localStorage.getItem('pending_iap_platform') || 'ios';
    
    // Apple account linking data
    const appleProviderId = localStorage.getItem('apple_provider_id');
    const appleProviderEmail = localStorage.getItem('apple_provider_email');
    const appleIsPrivate = localStorage.getItem('apple_is_private_email') === 'true';
    
    if (productId) {
      setActivatingIAP(true);
      try {
        // Link Apple account if provider data exists
        if (appleProviderId) {
          console.log('Linking Apple account by provider_id:', appleProviderId);
          await base44.auth.updateMe({
            apple_provider_id: appleProviderId,
            apple_provider_email: appleProviderEmail || '',
            apple_is_private_email: appleIsPrivate,
            apple_linked_at: new Date().toISOString()
          });
        }

        const functionName = platform === 'android' ? 'handleGooglePlayIAP' : 'handleAppleIAP';
        
        // Check if we have real receipt or just pending marker
        const isRealReceipt = receipt && receipt.length > 20 && receipt !== '1';
        
        const response = await base44.functions.invoke(functionName, 
          isRealReceipt 
            ? { receipt, productId, purchaseToken: receipt }
            : { action: 'activatePending', productId, platform }
        );

        if (response.data.success) {
          setPaymentSuccess(true);
          setActiveTab("subscription");
          
          // Clean up all localStorage
          localStorage.removeItem('pending_iap_receipt');
          localStorage.removeItem('pending_iap_product');
          localStorage.removeItem('pending_iap_platform');
          localStorage.removeItem('apple_provider_id');
          localStorage.removeItem('apple_provider_email');
          localStorage.removeItem('apple_is_private_email');
        } else {
          console.warn('IAP activation failed:', response.data);
        }
      } catch (error) {
        console.error('IAP activation error:', error);
      } finally {
        setActivatingIAP(false);
      }
    }
  };

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
            {/* Header - 8-point grid: 32px bottom margin, 24px padding */}
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