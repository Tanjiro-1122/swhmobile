import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Check if prompt was dismissed
    const dismissed = localStorage.getItem('installPromptDismissed');
    const dismissedTime = localStorage.getItem('installPromptDismissedTime');
    
    // Show prompt again after 7 days
    if (dismissed && dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait 10 seconds before showing prompt
      setTimeout(() => {
        if (!standalone) {
          setShowPrompt(true);
        }
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show prompt after 10 seconds if not already installed
    if (ios && !standalone && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 10000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt && !isIOS) return;

    if (deferredPrompt) {
      // Android install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
    localStorage.setItem('installPromptDismissedTime', Date.now().toString());
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
      >
        <Card className="border-2 border-indigo-300 shadow-2xl bg-gradient-to-r from-indigo-500 to-purple-600">
          <CardContent className="p-4 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-white hover:bg-white/20 h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                  alt="SWH"
                  className="w-10 h-10 rounded-lg"
                />
              </div>
              
              <div className="flex-1 text-white">
                <div className="font-bold text-lg mb-1">Install Sports Wager Helper</div>
                <p className="text-sm text-indigo-100 mb-3">
                  {isIOS 
                    ? "Add to your home screen for quick access and native app experience"
                    : "Install our app for instant access and offline support"}
                </p>

                {isIOS ? (
                  <div className="bg-white/20 rounded-lg p-3 text-xs text-white space-y-2 backdrop-blur-sm">
                    <div className="font-semibold flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      How to install on iOS:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-indigo-50">
                      <li>Tap the Share button <span className="font-bold">(⎙)</span> at the bottom</li>
                      <li>Scroll and tap "Add to Home Screen"</li>
                      <li>Tap "Add" in the top right</li>
                    </ol>
                  </div>
                ) : (
                  <Button
                    onClick={handleInstall}
                    className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install App
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}