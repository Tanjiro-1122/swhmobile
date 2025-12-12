import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Trophy } from "lucide-react";
import PlayerSearchBar from "../player/PlayerSearchBar";
import PlayerStatsDisplay from "../player/PlayerStatsDisplay";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../auth/FreeLookupTracker";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayerStatsContent() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const queryClient = useQueryClient();

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier } = useFreeLookupTracker();

  const handleSearch = async (query, retryCount = 0) => {
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsSearching(true);
    setError(null);
    if (retryCount === 0) {
      setCurrentPlayer(null);
    }

    const maxRetries = 2;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for athlete: "${query}"
Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Return player data: name, team, position, sport, league, season stats, last 5 games, health status, next game prediction, strengths, weaknesses.

IMPORTANT FIELDS:
- role: Must be one of "Starter", "Bench", "Sixth Man", "Rotation", or "Unknown" - indicate if player starts or comes off bench
- health_status: Must be one of "Healthy", "Day-to-Day", "Out 1-2 Weeks", "Out 2-4 Weeks", "Out 4-6 Weeks", "Out 6+ Weeks", or "Out for Season"
- injury_details: If not healthy, specify the injury (e.g., "Sprained ankle", "Hamstring strain")

Stats by sport:
- Basketball: PPG, RPG, APG, SPG, BPG, 3PM, FG%
- Football: passing/rushing/receiving yards, TDs
- Baseball: AVG, HR, RBI (batters) or ERA, K, W (pitchers)
- Hockey: G, A, PTS, +/-
- Soccer: goals, assists

If no next game scheduled, say TBD.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            role: { type: "string", enum: ["Starter", "Bench", "Sixth Man", "Rotation", "Unknown"] },
            league: { type: "string" },
            season_averages: { type: "object" },
            recent_form: { type: "array", items: { type: "object" } },
            health_status: { type: "string", enum: ["Healthy", "Day-to-Day", "Out 1-2 Weeks", "Out 2-4 Weeks", "Out 4-6 Weeks", "Out 6+ Weeks", "Out for Season"] },
            injury_details: { type: "string" },
            next_game: {
              type: "object",
              properties: {
                opponent: { type: "string" },
                date: { type: "string" },
                location: { type: "string" },
                predicted_performance: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              }
            },
            betting_insights: { type: "object" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } }
          },
          required: ["player_name", "sport", "team"]
        }
      });

      if (!result || !result.player_name) {
        throw new Error("Invalid response - player not found");
      }

      // Ensure next_game has defaults if missing
      if (!result.next_game) {
        result.next_game = {
          opponent: "TBD",
          date: "TBD",
          predicted_performance: "No upcoming game scheduled",
          confidence: "N/A",
          reasoning: "Player's next game has not been announced yet."
        };
      }

      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setCurrentPlayer(result);
      setIsSearching(false);
      
    } catch (err) {
      console.error("Player analysis error:", err);
      
      // Auto-retry on failure
      if (retryCount < maxRetries) {
        console.log(`Retrying... attempt ${retryCount + 2}/${maxRetries + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return handleSearch(query, retryCount + 1);
      }
      
      setError("Failed to analyze player. Please try again.");
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-2 border-red-200">
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      {isSearching && (
        <div className="space-y-6 animate-fade-in">
          {/* Skeleton loader while searching */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-purple-200 overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/20 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                  <div className="h-6 sm:h-8 bg-white/20 rounded-lg w-2/3 animate-pulse" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-5 sm:h-6 bg-white/20 rounded-full w-16 sm:w-20 animate-pulse" />
                    <div className="h-5 sm:h-6 bg-white/20 rounded-full w-14 sm:w-16 animate-pulse" />
                    <div className="h-5 sm:h-6 bg-white/20 rounded-full w-20 sm:w-24 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-purple-50 rounded-lg p-2 sm:p-3 space-y-2">
                    <div className="h-6 sm:h-8 bg-purple-200 rounded animate-pulse" />
                    <div className="h-3 sm:h-4 bg-purple-100 rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-32 sm:h-48 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
          
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20 animate-ping" />
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              </div>
              <p className="text-gray-600 font-medium">Analyzing player data...</p>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {currentPlayer && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PlayerStatsDisplay player={currentPlayer} />
            <Alert className="mt-6 bg-blue-50 border-2 border-blue-200">
              <AlertDescription className="text-blue-900">
                ✅ Player analysis saved! View in <a href="/MyAccount?tab=saved" className="underline font-bold">Saved Results</a>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}