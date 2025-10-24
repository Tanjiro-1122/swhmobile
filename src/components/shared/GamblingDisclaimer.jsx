import React, { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function GamblingDisclaimer() {
  const [show, setShow] = useState(true);
  
  // Check if user has dismissed disclaimer before
  React.useEffect(() => {
    const dismissed = localStorage.getItem('disclaimerDismissed');
    if (dismissed) {
      setShow(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('disclaimerDismissed', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="sticky top-0 z-40"
        >
          <Alert className="bg-red-500/10 border-2 border-red-500/50 rounded-none">
            <div className="flex items-start gap-3 max-w-7xl mx-auto px-4">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <AlertDescription className="text-red-300 text-sm flex-1">
                <strong className="font-bold">⚠️ GAMBLING DISCLAIMER:</strong> Predictions are for entertainment only. 
                No guarantees. Gambling involves risk. Only bet what you can afford to lose. 21+ only. 
                Problem? Call 1-800-GAMBLER.
              </AlertDescription>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}