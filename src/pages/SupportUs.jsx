import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, Loader2, Info, AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { usePlatform } from "@/components/hooks/usePlatform";

// Stripe Donation Page URL
const DONATION_URL = "https://donate.stripe.com/eVq3cxeAl4HS1VI09w8N209";

export default function SupportUs() {
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [donationAmount, setDonationAmount] = useState(null);
  const { isNativeApp, isIOSNative } = usePlatform();

  // Check for success/cancel URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('donation_success') === 'true') {
      setDonationSuccess(true);
      setDonationAmount(urlParams.get('amount'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Open donation link - works for both web and native
  const handleDonate = () => {
    const url = DONATION_URL;
    
    if (typeof window !== "undefined") {
      // Try native bridge methods first for native apps
      if (window.WTN?.openExternalBrowser) {
        window.WTN.openExternalBrowser(url);
      } else if (window.WTN?.openURL) {
        window.WTN.openURL(url);
      } else if (window.WTN?.openExternalUrl) {
        window.WTN.openExternalUrl(url);
      } else {
        // Web fallback: open in new tab
        window.open(url, "_blank", "noopener,noreferrer");
      }
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

        {/* Single Donate Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <Card className="border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
            <CardContent className="p-8 text-center">
              <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Please Help Us Keep Going! 🙏
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
                Your donation helps cover server costs, AI improvements, and keeps this project alive. 
                Any amount helps - even a few dollars makes a difference!
              </p>
              <Button
                onClick={handleDonate}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-6 px-10 text-lg hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Donate Now
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                {isNativeApp ? "Opens in your browser • " : ""}Secure payment via Stripe
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* External Website Notice for Native Apps */}
        {isNativeApp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500/50 mb-8">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-800 dark:text-blue-300 text-sm">
                    {isIOSNative 
                      ? "This will open Stripe in your browser. Apple is not responsible for external transactions."
                      : "This will open Stripe in your browser. Google Play policies do not apply to external purchases."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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