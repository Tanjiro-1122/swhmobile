import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Activity } from "lucide-react";

export default function AutoAccuracyTracker() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [processedCount, setProcessedCount] = useState(0);
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
    if (!currentUser || isProcessing) return;
    
    setIsProcessing(true);
    console.log("🔍 Checking for finished games...");

    try {
      // Get all matches
      const allMatches = await base44.entities.Match.list('-match_date', 100);
      
      // Filter matches that have finished (date is in the past and more than 3 hours ago to ensure game is complete)
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      
      const finishedMatches = allMatches.filter(match => {
        if (!match.match_date) return false;
        const matchDate = new Date(match.match_date);
        return matchDate < threeHoursAgo;
      });

      console.log(`Found ${finishedMatches.length} finished matches`);

      // Get existing accuracy records to avoid duplicates
      const existingRecords = await base44.entities.PredictionAccuracy.list();
      const existingMatchIds = new Set(existingRecords.map(r => r.match_id).filter(Boolean));

      let processed = 0;

      for (const match of finishedMatches) {
        // Skip if already processed
        if (existingMatchIds.has(match.id)) {
          console.log(`⏭️ Already processed: ${match.home_team} vs ${match.away_team}`);
          continue;
        }

        console.log(`📊 Verifying result for: ${match.home_team} vs ${match.away_team}`);

        try {
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

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ Error verifying ${match.home_team} vs ${match.away_team}:`, error);
        }
      }

      setProcessedCount(processed);
      setLastCheck(new Date().toISOString());
      console.log(`✅ Accuracy check complete. Processed ${processed} new games.`);

    } catch (error) {
      console.error("❌ Error in accuracy tracking:", error);
    }

    setIsProcessing(false);
  };

  // Check for finished games when component mounts and every 6 hours
  useEffect(() => {
    if (currentUser) {
      // Check immediately on mount
      checkFinishedGames();

      // Then check every 6 hours
      const interval = setInterval(() => {
        checkFinishedGames();
      }, 6 * 60 * 60 * 1000); // 6 hours

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  if (!isProcessing && processedCount === 0) return null;

  return (
    <Alert className="bg-blue-500/10 border-blue-500/30 mb-6">
      {isProcessing ? (
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400 animate-spin" />
          <AlertDescription className="text-blue-200">
            Checking finished games and updating accuracy data...
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
          </AlertDescription>
        </div>
      ) : null}
    </Alert>
  );
}