import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function LimitedOfferBanner() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await base44.auth.isAuthenticated();
      setIsAuthenticated(auth);
      
      // Get total user count
      try {
        const users = await base44.entities.User.list();
        setTotalUsers(users.length);
      } catch (error) {
        console.log("Could not fetch user count");
      }
    };
    
    checkAuth();
  }, []);

  const spotsRemaining = Math.max(0, 100 - totalUsers);
  const percentageFilled = Math.min(100, (totalUsers / 100) * 100);

  if (isAuthenticated || spotsRemaining === 0) return null;

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
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZjMCA2LjYyNy01LjM3MyAxMi0xMiAxMnMtMTItNS4zNzMtMTItMTIgNS4zNzMtMTIgMTItMTIgMTIgNS4zNzMgMTIgMTIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20 animate-pulse" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left side - Offer text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <Badge className="bg-white/30 text-white border-white/50 text-sm font-bold px-3 py-1 animate-bounce">
                🔥 LIMITED TIME OFFER
              </Badge>
              <Badge className="bg-red-600 text-white border-red-400 text-sm font-bold px-3 py-1 animate-pulse">
                <Clock className="w-3 h-3 mr-1 inline" />
                ENDING SOON
              </Badge>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              🎉 First 100 Users Get LIFETIME Unlimited Access!
            </h2>
            
            <p className="text-white/90 text-base sm:text-lg font-semibold">
              Sign up now for FREE and unlock unlimited searches forever. No credit card required!
            </p>
          </div>

          {/* Middle - Progress */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Spots Remaining
                </span>
                <span className="text-white font-black text-2xl">{spotsRemaining}/100</span>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-4 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentageFilled}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg"
                />
              </div>
              
              <p className="text-white/80 text-xs mt-2 text-center">
                ⚡ {totalUsers} users already claimed their spot!
              </p>
            </div>
          </div>

          {/* Right side - CTA */}
          <div className="flex-shrink-0">
            <Button
              onClick={handleSignup}
              size="lg"
              className="bg-white hover:bg-gray-100 text-orange-600 font-black text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-all border-4 border-yellow-300"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              CLAIM YOUR SPOT NOW
              <Zap className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-white text-xs text-center mt-2 font-semibold">
              💯 100% Free • No Credit Card
            </p>
          </div>
        </div>

        {/* Bottom urgent message */}
        <div className="mt-4 text-center">
          <p className="text-white/90 text-sm font-bold animate-pulse">
            ⏰ Once all 100 spots are claimed, this offer disappears forever!
          </p>
        </div>
      </div>
    </motion.div>
  );
}