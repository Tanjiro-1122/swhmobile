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

  const checkFinishedGames = async () => {
    if (!currentUser || isProcessing) {
      console.log("⏸️ Skipping accuracy check - not ready");
      return;
    }
    
    // CRITICAL: Check if we've run this recently (within last 24 hours)
    const lastCheckTime = localStorage.getItem('lastAccuracyCheck');
    if (lastCheckTime) {
      const timeSinceLastCheck = Date.now() - parseInt(lastCheckTime);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (timeSinceLastCheck < twentyFourHours) {
        const hoursRemaining = Math.ceil((twentyFourHours - timeSinceLastCheck) / (60 * 60 * 1000));
        console.log(`⏸️ Accuracy check skipped - last check was ${hoursRemaining} hours ago. Wait ${hoursRemaining} more hours.`);
        return;
      }
    }

    setIsProcessing(true);
    setErrorMessage(null);
    console.log("🔍 Starting accuracy check (rate-limited mode)...");

    try {
      // Get all matches
      const allMatches = await base44.entities.Match.list('-match_date', 50); // Reduced from 100 to 50
      
      // Add delay after first API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Filter matches that have finished (date is in the past and more than 6 hours ago to ensure game is complete)
      const now = new Date();
      const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000)); // Increased from 3 to 6 hours
      
      const finishedMatches = allMatches.filter(match => {
        if (!match.match_date) return false;
        const matchDate = new Date(match.match_date);
        return matchDate < sixHoursAgo;
      });

      console.log(`Found ${finishedMatches.length} finished matches`);

      // Get existing accuracy records to avoid duplicates
      const existingRecords = await base44.entities.PredictionAccuracy.list();
      
      // Add delay after second API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const existingMatchIds = new Set(existingRecords.map(r => r.match_id).filter(Boolean));

      // Filter out already processed matches
      const unprocessedMatches = finishedMatches.filter(match => !existingMatchIds.has(match.id));
      
      console.log(`${unprocessedMatches.length} matches need processing`);

      // CRITICAL: Only process 1 game per run to avoid rate limits
      const matchesToProcess = unprocessedMatches.slice(0, 1);
      
      if (matchesToProcess.length === 0) {
        console.log("✅ No new games to process");
        setIsProcessing(false);
        localStorage.setItem('lastAccuracyCheck', Date.now().toString());
        return;
      }

      console.log(`⚠️ Processing ONLY ${matchesToProcess.length} game (strict rate limit protection)`);

      let processed = 0;

      for (const match of matchesToProcess) {
        console.log(`📊 Verifying result for: ${match.home_team} vs ${match.away_team}`);

        try {
          // CRITICAL: Wait 10 seconds before making LLM call
          console.log("⏳ Waiting 10 seconds before API call...");
          await new Promise(resolve => setTimeout(resolve, 10000));

          // Use AI to verify actual game result
          const verificationResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Verify the ACTUAL result of this completed game. Use official sources.

GAME DETAILS:
Sport: ${match.sport}
Home Team: ${match.home_team}
Away Team: ${match.away_team}
Match Date: ${match.match_date}
Venue: ${match.venue}

CRITICAL INSTRUCTIONS:
1. Search ESPN, StatMuse, ${match.sport}-Reference.com for the OFFICIAL final score
2. Verify the game actually happened on or near the predicted date
3. Get the EXACT final score
4. Determine if our prediction was correct

OUR PREDICTION:
- Home Win Probability: ${match.home_win_probability}%
- Away Win Probability: ${match.away_win_probability}%
- Draw Probability: ${match.draw_probability || 0}%
- Predicted Winner: ${match.home_win_probability > match.away_win_probability ? match.home_team : match.away_team}

RETURN:
- If game was played: actual_outcome with final score, was_correct (true/false)
- If game was postponed/cancelled: game_status = "postponed" or "cancelled"
- If you cannot find the game: game_status = "not_found"`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                game_status: {
                  type: "string",
                  enum: ["completed", "postponed", "cancelled", "not_found"]
                },
                actual_outcome: { type: "string" },
                final_score: { type: "string" },
                winner: { type: "string" },
                was_correct: { type: "boolean" },
                notes: { type: "string" }
              }
            }
          });

          // Wait after LLM call
          await new Promise(resolve => setTimeout(resolve, 3000));

          if (verificationResult.game_status === "completed" && verificationResult.was_correct !== undefined) {
            // Create accuracy record
            await createAccuracyRecord.mutateAsync({
              prediction_type: "match",
              sport: match.sport,
              predicted_outcome: `${match.home_win_probability > match.away_win_probability ? match.home_team : match.away_team} to win (${Math.max(match.home_win_probability, match.away_win_probability).toFixed(1)}% probability)`,
              actual_outcome: verificationResult.actual_outcome || `${verificationResult.winner} won ${verificationResult.final_score}`,
              was_correct: verificationResult.was_correct,
              confidence_level: match.confidence_level || "medium",
              prediction_date: match.match_date || match.created_date,
              match_id: match.id
            });

            processed++;
            console.log(`✅ Processed: ${match.home_team} vs ${match.away_team} - ${verificationResult.was_correct ? 'CORRECT' : 'INCORRECT'}`);
          } else {
            console.log(`⏭️ Skipping: ${match.home_team} vs ${match.away_team} - Status: ${verificationResult.game_status}`);
          }

        } catch (error) {
          console.error(`❌ Error verifying ${match.home_team} vs ${match.away_team}:`, error);
          
          // Check if it's a rate limit error
          if (error.message?.includes('Rate limit') || error.message?.includes('rate limit') || error.message?.includes('429')) {
            console.error("🚫 Rate limit hit - stopping all processing");
            setErrorMessage("Rate limit reached. Accuracy checks paused for 24 hours.");
            // Don't save lastCheck time if we hit rate limit - will try again on next page load
            setIsProcessing(false);
            return; // Exit immediately without saving check time
          } else {
            setErrorMessage(error.message);
          }
        }
      }

      setProcessedCount(processed);
      setLastCheck(new Date().toISOString());
      localStorage.setItem('lastAccuracyCheck', Date.now().toString());
      
      console.log(`✅ Accuracy check complete. Processed ${processed} game(s). Next check in 24 hours.`);

    } catch (error) {
      console.error("❌ Error in accuracy tracking:", error);
      if (error.message?.includes('Rate limit') || error.message?.includes('rate limit') || error.message?.includes('429')) {
        setErrorMessage("Rate limit reached. Accuracy checks paused for 24 hours.");
      } else {
        setErrorMessage(error.message);
      }
    }

    setIsProcessing(false);
  };

  // DISABLED: Auto-check on mount to prevent rate limit issues
  // Only run if explicitly triggered or after 24 hours
  useEffect(() => {
    // Do NOT auto-run on mount - too aggressive
    // User can manually trigger from Accuracy page if needed
    console.log("⏸️ Auto accuracy check disabled to prevent rate limits. Check manually from Accuracy page.");
  }, [currentUser]);

  if (!isProcessing && processedCount === 0 && !errorMessage) return null;

  return (
    <Alert className={errorMessage ? "bg-red-500/10 border-red-500/30 mb-6" : "bg-blue-500/10 border-blue-500/30 mb-6"}>
      {isProcessing ? (
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400 animate-spin" />
          <AlertDescription className="text-blue-200">
            Checking finished games and updating accuracy data...
            <div className="text-xs text-blue-300 mt-1 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              ⏳ Processing very slowly with 10-15 second delays to avoid rate limits (1 game per day maximum)
            </div>
          </AlertDescription>
        </div>
      ) : errorMessage ? (
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <AlertDescription className="text-red-200">
            ⚠️ {errorMessage}
            {lastCheck && (
              <div className="text-xs text-red-300 mt-1">
                Last successful check: {new Date(lastCheck).toLocaleString()}
              </div>
            )}
          </AlertDescription>
        </div>
      ) : processedCount > 0 ? (
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <AlertDescription className="text-green-200">
            ✅ Updated accuracy data with {processedCount} finished {processedCount === 1 ? 'game' : 'games'}
            {lastCheck && (
              <Badge className="ml-3 bg-green-500/20 text-green-300">
                Last checked: {new Date(lastCheck).toLocaleTimeString()}
              </Badge>
            )}
            <div className="text-xs text-green-300 mt-1">
              Next auto-check in 24 hours
            </div>
          </AlertDescription>
        </div>
      ) : null}
    </Alert>
  );
}