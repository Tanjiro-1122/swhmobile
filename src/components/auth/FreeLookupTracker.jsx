import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, UserPlus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

export function useFreeLookupTracker() {
  const [lookupsRemaining, setLookupsRemaining] = useState(5);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        const used = parseInt(localStorage.getItem('freeLookups') || '0');
        setLookupsRemaining(Math.max(0, 5 - used));
      }
    };
    
    checkAuth();
  }, []);

  const useLookup = () => {
    if (isAuthenticated) return true;
    
    const used = parseInt(localStorage.getItem('freeLookups') || '0');
    if (used >= 5) return false;
    
    localStorage.setItem('freeLookups', (used + 1).toString());
    setLookupsRemaining(Math.max(0, 5 - (used + 1)));
    return true;
  };

  const canLookup = () => {
    if (isAuthenticated) return true;
    const used = parseInt(localStorage.getItem('freeLookups') || '0');
    return used < 5;
  };

  return { lookupsRemaining, isAuthenticated, useLookup, canLookup };
}

export function FreeLookupModal({ show, onClose, lookupsRemaining }) {
  if (!show) return null;

  const handleSignup = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="max-w-md w-full border-2 border-blue-200 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Free Lookups Limit Reached</CardTitle>
                  <p className="text-sm text-blue-100">Sign up to continue analyzing</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-gray-300 mb-2">0/5</div>
                <p className="text-gray-600">
                  You've used all your free lookups. Create a free account to get unlimited access!
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Unlimited match analysis</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Unlimited player stats</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Unlimited team analysis</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Save all your results</span>
                </div>
              </div>

              <Button
                onClick={handleSignup}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Sign Up Free - No Credit Card Required
              </Button>

              <p className="text-center text-xs text-gray-500 mt-4">
                Already have an account? Click above to sign in
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function FreeLookupBanner({ lookupsRemaining, isAuthenticated }) {
  if (isAuthenticated || lookupsRemaining === 5) return null;

  const handleSignup = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200"
    >
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-500 text-white text-base px-3 py-1">
              {lookupsRemaining} Free Lookups Remaining
            </Badge>
            <span className="text-sm text-gray-700">
              Sign up for unlimited access to all features
            </span>
          </div>
          <Button
            onClick={handleSignup}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up Free
          </Button>
        </div>
      </div>
    </motion.div>
  );
}