
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Zap, Users, Clock, Star, Crown, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function LimitedOfferBanner() {
  const [vipCount, setVipCount] = React.useState(0);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await base44.auth.isAuthenticated();
        setIsAuthenticated(auth);
        
        if (auth) {
          const user = await base44.auth.me();
          setCurrentUser(user);
        }
        
        // Try to get VIP count from public counter first
        try {
          // List with newest first, limit to 1
          const counters = await base44.entities.VIPCounter.list('-updated_date', 1);
          if (counters && counters.length > 0 && counters[0].current_vip_count !== undefined) {
            console.log("=== VIP COUNT from PUBLIC COUNTER ===");
            console.log("VIP Count:", counters[0].current_vip_count);
            setVipCount(counters[0].current_vip_count);
            setIsLoading(false);
            return; // Early exit if public counter is successful
          }
        } catch (counterError) {
          console.log("VIPCounter not available, trying direct user query");
          // Continue to fallback if counter fails
        }
        
        // Fallback: If authenticated, count directly from users and potentially update the public counter
        if (auth) {
          try {
            const users = await base44.entities.User.list();
            const vipUsers = users.filter(u => {
              const hasVIPFlag = u.vip_member === true;
              const hasVIPStatus = u.subscription_status === 'lifetime_vip';
              return hasVIPFlag || hasVIPStatus;
            });
            
            console.log("=== VIP COUNT from USER LIST ===");
            console.log("Total users:", users.length);
            console.log("VIP users found:", vipUsers.length);
            
            setVipCount(vipUsers.length);
            
            // Update the public counter for unauthenticated users if we calculated it
            try {
              const existingCounters = await base44.entities.VIPCounter.list();
              if (existingCounters.length > 0) {
                // Assuming only one counter is desired, update the latest one.
                await base44.entities.VIPCounter.update(existingCounters[0].id, {
                  current_vip_count: vipUsers.length,
                  last_updated: new Date().toISOString()
                });
                console.log("VIPCounter updated successfully.");
              } else {
                await base44.entities.VIPCounter.create({
                  current_vip_count: vipUsers.length,
                  last_updated: new Date().toISOString()
                });
                console.log("VIPCounter created successfully.");
              }
            } catch (updateError) {
              console.warn("Could not update/create VIPCounter (may not have permissions or entity not set up for current user):", updateError.message);
            }
          } catch (userError) {
            console.error("Could not fetch users:", userError);
            // Fallback to cached localStorage value if user fetch fails
            const cached = localStorage.getItem('vipCount');
            if (cached) {
              setVipCount(parseInt(cached, 10));
              console.log("Using cached VIP count from localStorage (user fetch failed).");
            }
          }
        } else {
          // Not authenticated and no public counter - use cached value
          const cached = localStorage.getItem('vipCount');
          if (cached) {
            setVipCount(parseInt(cached, 10));
            console.log("Using cached VIP count from localStorage (not authenticated and public counter failed).");
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Could not fetch VIP count:", error);
        // Ensure isLoading is set to false even on critical errors
        const cached = localStorage.getItem('vipCount');
        if (cached) {
          setVipCount(parseInt(cached, 10));
          console.log("Using cached VIP count from localStorage (general error).");
        }
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Refresh every 30 seconds to keep count updated
    const interval = setInterval(checkAuth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cache the VIP count in localStorage whenever it changes
  React.useEffect(() => {
    if (vipCount > 0) { // Only cache if it's a meaningful count
      localStorage.setItem('vipCount', vipCount.toString());
      console.log("VIP count cached:", vipCount);
    }
  }, [vipCount]);

  const spotsRemaining = Math.max(0, 20 - vipCount);
  const percentageFilled = Math.min(100, (vipCount / 20) * 100);
  const allSpotsTaken = vipCount >= 20;

  // Check if current user is already VIP
  const isUserVIP = currentUser?.vip_member === true || currentUser?.subscription_status === 'lifetime_vip';

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 border-b-4 border-yellow-300 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="animate-pulse text-white text-lg font-bold">Loading VIP status...</div>
          </div>
        </div>
      </div>
    );
  }

  // If all spots taken, show "All Spots Taken" message
  if (allSpotsTaken) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-b-4 border-red-400 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <XCircle className="w-12 h-12 text-white" />
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                😔 All 20 VIP Lifetime Spots Have Been Claimed!
              </h2>
            </div>
            <p className="text-white/90 text-lg mb-6">
              We're sorry, but all lifetime VIP memberships have been claimed. However, you can still get unlimited access with our premium plans!
            </p>
            
            {/* Pricing Options */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Monthly Plan */}
              <Card className="bg-white/10 backdrop-blur-sm border-2 border-white/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="w-6 h-6 text-blue-400" />
                    <h3 className="text-2xl font-black text-white">Premium Monthly</h3>
                  </div>
                  <div className="text-5xl font-black text-white mb-2">$9.99</div>
                  <div className="text-white/80 mb-4">/month</div>
                  <ul className="text-left text-white/90 space-y-2 mb-6">
                    <li>✅ Unlimited match analysis</li>
                    <li>✅ Unlimited player stats</li>
                    <li>✅ Unlimited team analysis</li>
                    <li>✅ Cancel anytime</li>
                  </ul>
                  <Button 
                    onClick={() => window.open('https://buy.stripe.com/3cIcN74ZLa2c8k68G28N200', '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                  >
                    Subscribe Monthly
                  </Button>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card className="bg-white/10 backdrop-blur-sm border-2 border-yellow-400">
                <CardContent className="p-6">
                  <Badge className="bg-yellow-500 text-black font-bold mb-4">BEST VALUE - Save $20!</Badge>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-2xl font-black text-white">Premium Yearly</h3>
                  </div>
                  <div className="text-5xl font-black text-white mb-2">$99</div>
                  <div className="text-white/80 mb-4">/year (2 months FREE)</div>
                  <ul className="text-left text-white/90 space-y-2 mb-6">
                    <li>✅ Everything in Monthly</li>
                    <li>✅ Save $20 per year</li>
                    <li>✅ Priority support</li>
                    <li>✅ Early access to features</li>
                  </ul>
                  <Button 
                    onClick={() => window.open('https://buy.stripe.com/YOUR_YEARLY_LINK', '_blank')}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3"
                  >
                    Subscribe Yearly
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const handleSignup = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 border-b-4 border-yellow-300 shadow-2xl relative overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZjMCA2LjYyNy01LjM3MyAxMi0xMiAxMnsxMi01LjM3My0xMi0xMiA1LjM3My0xMiAxMi0xMiAxMiA1LjM3MyAxMiAxMiIvPjwvZz4NCjwvZz4NCjwvc3ZnPg==')] opacity-20 animate-pulse" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Show VIP status for current user if they're VIP */}
        {isUserVIP && currentUser?.vip_spot_number && (
          <div className="mb-4 text-center">
            <Badge className="bg-green-600 text-white text-lg px-4 py-2">
              <Crown className="w-5 h-5 mr-2 inline" />
              🎉 You're VIP Lifetime Member #{currentUser.vip_spot_number}!
            </Badge>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left side - Offer text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2 flex-wrap">
              <Badge className="bg-white/30 text-white border-white/50 text-sm font-bold px-3 py-1 animate-bounce">
                🔥 LIMITED TIME OFFER
              </Badge>
              <Badge className="bg-red-600 text-white border-red-400 text-sm font-bold px-3 py-1 animate-pulse">
                <Clock className="w-3 h-3 mr-1 inline" />
                ENDING SOON
              </Badge>
              <Badge className="bg-green-600 text-white border-green-400 text-sm font-bold px-3 py-1">
                {spotsRemaining} SPOTS LEFT!
              </Badge>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              🎉 First 20 Users Get LIFETIME Unlimited Access!
            </h2>
            
            <p className="text-white/90 text-base sm:text-lg font-semibold">
              {isUserVIP 
                ? "You already have lifetime access! Share this offer with friends before spots run out."
                : "Sign up now for FREE and unlock unlimited searches forever. No credit card required!"}
            </p>
          </div>

          {/* Middle - Progress Bar (ALWAYS VISIBLE) */}
          <div className="flex-1 w-full lg:w-auto min-w-[300px]">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  VIP Spots Claimed
                </span>
                <span className="text-white font-black text-2xl">{vipCount}/20</span>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-4 bg-white/20 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentageFilled}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-white/80 text-xs">
                  ⚡ {vipCount} claimed
                </p>
                <p className="text-white font-bold text-xs">
                  {spotsRemaining} remaining
                </p>
              </div>
            </div>
          </div>

          {/* Right side - CTA */}
          {!isUserVIP && (
            <div className="flex-shrink-0">
              <Button
                onClick={handleSignup}
                size="lg"
                className="bg-white hover:bg-gray-100 text-orange-600 font-black text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-all border-4 border-yellow-300"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                CLAIM SPOT #{vipCount + 1}
                <Zap className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-white text-xs text-center mt-2 font-semibold">
                💯 100% Free • No Credit Card
              </p>
            </div>
          )}
        </div>

        {/* Bottom urgent message */}
        <div className="mt-4 text-center">
          <p className="text-white/90 text-sm font-bold animate-pulse">
            ⏰ {spotsRemaining <= 5 ? '🚨 HURRY! ' : ''}Only {spotsRemaining} lifetime spot{spotsRemaining === 1 ? '' : 's'} remaining! Once claimed, this offer disappears forever!
          </p>
        </div>
      </div>
    </motion.div>
  );
}
