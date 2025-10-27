import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-20 left-4 right-4 z-50"
      >
        <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
          isOnline 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-6 h-6" />
              <div>
                <div className="font-bold">Back Online!</div>
                <div className="text-sm">You're connected to the internet</div>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="w-6 h-6" />
              <div>
                <div className="font-bold">You're Offline</div>
                <div className="text-sm">Some features may be limited</div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}