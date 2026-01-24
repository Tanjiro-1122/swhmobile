import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Coffee, Star, Rocket, ExternalLink, Loader2, Info, AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { usePlatform } from "@/components/hooks/usePlatform";

// Stripe Donation Page URL
const DONATION_URL = "https://donate.stripe.com/eVq3cxeAl4HS1VI09w8N209";

export default function SupportUs() {
  const [processingTier, setProcessingTier] = useState(null);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [donationAmount, setDonationAmount] = useState(null);
  const { isNativeApp, isIOSNative, isAndroidNative, isWeb } = usePlatform();

  // Check for success/cancel URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('donation_success') === 'true') {
      setDonationSuccess(true);
      setDonationAmount(urlParams.get('amount'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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

  // For native apps and all platforms, open external browser with donation link
  const handleNativeDonate = (tier) => {
    // Open the donation URL in external browser
    // Note: Stripe Payment Links don't support custom amounts via query params
    // The amount is pre-set in Stripe Dashboard when you create the Payment Link
    const url = DONATION_URL;
    
    // Force open in external browser / new tab
    if (typeof window !== "undefined") {
      // Try native bridge methods first
      if (window.WTN?.openExternalBrowser) {
        window.WTN.openExternalBrowser(url);
      } else if (window.WTN?.openURL) {
        window.WTN.openURL(url);
      } else if (window.WTN?.openExternalUrl) {
        window.WTN.openExternalUrl(url);
      } else {
        // Fallback: Use window.open with proper target
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        // If popup blocked, try location change
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = url;
        }
      }
    }
  };

  // For web, use Stripe checkout
  const handleWebDonate = async (tier) => {
    setProcessingTier(tier.id);
    try {
      const response = await base44.functions.invoke("createDonationSession", {
        amount: tier.amount,
        tierName: tier.name,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        alert("Failed to create donation session. Please try again.");
      }
    } catch (error) {
      console.error("Donation error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessingTier(null);
    }
  };

  const handleDonate = (tier) => {
    // Use native donate (external browser) for native apps
    // For web, use the Stripe checkout session which allows custom amounts
    if (isNativeApp) {
      handleNativeDonate(tier);
    } else {
      handleWebDonate(tier);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Success Message */}
        {donationSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-2 border-green-400 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-bold text-green-900 dark:text-green-200 text-xl">
                      Thank You for Your Donation! 🎉
                    </h3>
                    <p className="text-green-800 dark:text-green-300">
                      {donationAmount ? `Your $${donationAmount} donation has been received.` : 'Your donation has been received.'} You're helping keep Sports Wager Helper running!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm px-4 py-2 mb-4">
            <Heart className="w-4 h-4 mr-2 inline" />
            SUPPORT OUR MISSION
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Help Us Keep Going
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Sports Wager Helper is built with passion by a small team. Your support helps us maintain servers, improve AI models, and keep bringing you the best sports analytics.
          </p>
        </motion.div>

        {/* Important Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500/50 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-amber-900 dark:text-amber-200 text-lg mb-2">
                    Important: Donations Do NOT Unlock Features
                  </h3>
                  <p className="text-amber-800 dark:text-amber-300 text-sm">
                    Donations are voluntary contributions to support development and are <strong>completely separate</strong> from app subscriptions. 
                    Donating will not unlock Premium or VIP features, remove ads, or provide any in-app benefits. 
                    If you want access to premium features, please visit our <Link to={createPageUrl("Pricing")} className="underline font-semibold">Pricing page</Link>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Native App External Link Disclosure */}
        {isNativeApp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500/50 mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <ExternalLink className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">
                      External Website Notice
                    </h3>
                    <p className="text-blue-800 dark:text-blue-300 text-sm">
                      {isIOSNative ? (
                        <>
                          Tapping a donation button will open an external website in your browser. 
                          This transaction will be processed by Stripe, not Apple. Apple is not responsible for the privacy or security of transactions on external websites.
                        </>
                      ) : (
                        <>
                          Tapping a donation button will open an external website in your browser. 
                          This transaction will be processed by Stripe, not Google Play. Google Play's refund policies do not apply to purchases made on external websites.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Donation Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {donationTiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="h-full border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all hover:shadow-lg">
                  <CardHeader className="text-center pb-2">
                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {tier.name}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {tier.description}
                    </p>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <div className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                      ${tier.amount}
                    </div>
                    <Button
                      onClick={() => handleDonate(tier)}
                      disabled={processingTier !== null}
                      className={`w-full bg-gradient-to-r ${tier.color} text-white font-bold py-6 text-lg hover:opacity-90 transition-opacity`}
                    >
                      {processingTier === tier.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {isNativeApp && <ExternalLink className="w-4 h-4 mr-2" />}
                          Donate ${tier.amount}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* What Your Donation Supports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-2 border-gray-200 dark:border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Info className="w-6 h-6 text-purple-600" />
                What Your Donation Supports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Server costs and infrastructure to keep the app running 24/7</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>AI model improvements and training for better predictions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Data API costs for real-time sports statistics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Development of new features requested by the community</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Keeping the free tier available for everyone</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Receipt & Tax Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-2 border-gray-200 dark:border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Receipt Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-3">
                After completing your donation, you will receive an email receipt from Stripe with your transaction details.
              </p>
              <p className="mb-3">
                <strong>Note:</strong> Sports Wager Helper is not a registered 501(c)(3) nonprofit organization. 
                Donations are not tax-deductible and should be considered personal gifts to support independent software development.
              </p>
              <p>
                All donations are processed securely through Stripe. We never store your payment information.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Refund Policy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="border-2 border-gray-200 dark:border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Refund Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 dark:text-gray-400">
              <p>
                Donations are voluntary and non-refundable. If you believe a donation was made in error, 
                please contact us at{" "}
                <a href="mailto:support@sportswagerhelper.com" className="text-purple-600 dark:text-purple-400 underline">
                  support@sportswagerhelper.com
                </a>{" "}
                within 7 days and we will review your request.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Thank You Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center py-8"
        >
          <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Thank You for Your Support!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Every contribution, no matter the size, helps us continue building great tools for sports enthusiasts.
          </p>
        </motion.div>

        {/* Responsible Gambling Disclaimer */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-500/30 rounded-xl mb-8">
          <p className="text-sm text-amber-900 dark:text-amber-200 text-center">
            <strong>⚠️ Responsible Gambling:</strong> Sports Wager Helper provides analysis for informational purposes only.
            Always gamble responsibly. If you need help, call 1-800-522-4700.
          </p>
        </div>
      </div>
    </div>
  );
}