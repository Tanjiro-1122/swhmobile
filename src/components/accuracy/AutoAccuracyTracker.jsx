import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Activity, Clock } from "lucide-react";

export default function AutoAccuracyTracker() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const createAccuracyRecord = useMutation({
    mutationFn: (data) => base44.entities.PredictionAccuracy.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    }
  });

  // DISABLED: Automatic checking is turned OFF to prevent rate limit errors
  // Users must manually check accuracy from the AccuracyTracker page
  const checkFinishedGames = async () => {
    console.log("⏸️ Auto-accuracy check is DISABLED to prevent rate limits.");
    console.log("💡 Please use the manual 'Check Accuracy' button on the Accuracy Tracker page.");
    return;
  };

  // Load last check time on mount
  useEffect(() => {
    const lastCheckTime = localStorage.getItem('lastAccuracyCheck');
    if (lastCheckTime) {
      setLastCheck(new Date(parseInt(lastCheckTime)));
    }
  }, []);

  // DISABLED: Do not run automatic checks
  useEffect(() => {
    // Automatic checks are disabled
    // checkFinishedGames();
  }, [currentUser]);

  // Don't render anything - this component is now silent
  return null;
}