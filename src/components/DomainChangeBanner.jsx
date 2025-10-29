import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DomainChangeBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the banner
    const dismissed = localStorage.getItem('domainChangeBannerDismissed');
    const dismissedDate = localStorage.getItem('domainChangeBannerDismissedDate');
    
    // Show banner if:
    // 1. User hasn't dismissed it, OR
    // 2. It's been dismissed but more than 30 days ago (optional safety)
    if (!dismissed) {
      setIsVisible(true);
    } else if (dismissedDate) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed > 30) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('domainChangeBannerDismissed', 'true');
    localStorage.setItem('domainChangeBannerDismissedDate', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
              <div className="text-sm md:text-base font-semibold">
                <span className="hidden sm:inline">🚨 We've moved! </span>
                Our new official home is now{" "}
                <a 
                  href="https://sportswagerhelper.com" 
                  className="underline font-bold hover:text-yellow-200 transition-colors inline-flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sportswagerhelper.com
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="hidden md:inline"> — Please update your bookmarks!</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 flex-shrink-0 h-8 w-8"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}