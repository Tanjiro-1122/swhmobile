import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, TrendingUp } from "lucide-react";
import TeamSearchBar from "../team/TeamSearchBar";
import TeamStatsDisplay from "../team/TeamStatsDisplay";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../auth/FreeLookupTracker";
import { motion, AnimatePresence } from "framer-motion";

export default function TeamStatsContent() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [currentTeam, setCurrentTeam] = useState(null);
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
      setCurrentTeam(null);
    }

    const maxRetries = 2;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for team: "${query}"
Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Return: team name, sport, league, current record, season averages, last 5 games with scores, next game prediction, key players, injuries, strengths, weaknesses.

If no next game scheduled, say TBD.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            team_name: { type: "string" },
            sport: { type: "string" },
            league: { type: "string" },
            current_record: { type: "object" },
            season_averages: { type: "object" },
            last_five_games: { type: "array", items: { type: "object" } },
            form: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            key_players: { type: "array", items: { type: "string" } },
            injuries: { type: "array", items: { type: "object" } },
            next_game: {
              type: "object",
              properties: {
                opponent: { type: "string" },
                date: { type: "string" },
                location: { type: "string" },
                predicted_outcome: { type: "string" },
                predicted_score: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              }
            }
          },
          required: ["team_name", "sport"]
        }
      });

      if (!result || !result.team_name) {
        throw new Error("Invalid response - team not found");
      }

      // Ensure next_game has defaults if missing
      if (!result.next_game) {
        result.next_game = {
          opponent: "TBD",
          date: "TBD",
          predicted_outcome: "TBD",
          confidence: "N/A",
          reasoning: "Next game has not been announced yet."
        };
      }

      await base44.entities.TeamStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setCurrentTeam(result);
      setIsSearching(false);
      
    } catch (err) {
      console.error("Team analysis error:", err);
      
      // Auto-retry on failure
      if (retryCount < maxRetries) {
        console.log(`Retrying... attempt ${retryCount + 2}/${maxRetries + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return handleSearch(query, retryCount + 1);
      }
      
      setError("Failed to analyze team. Please try again.");
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <Card className="p-6 border-2 border-blue-200 bg-white shadow-xl">
        <TeamSearchBar onSearch={handleSearch} isSearching={isSearching} />
      </Card>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-2 border-red-200">
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      {isSearching && (
        <div className="space-y-6 animate-fade-in">
          {/* Skeleton loader while searching */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-blue-200 overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-white/20 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                  <div className="h-6 sm:h-8 bg-white/20 rounded-lg w-2/3 animate-pulse" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-5 sm:h-6 bg-white/20 rounded-full w-16 sm:w-20 animate-pulse" />
                    <div className="h-5 sm:h-6 bg-white/20 rounded-full w-20 sm:w-24 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-blue-50 rounded-lg p-2 sm:p-3 space-y-2">
                    <div className="h-6 sm:h-8 bg-blue-200 rounded animate-pulse" />
                    <div className="h-3 sm:h-4 bg-blue-100 rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 sm:h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-20 animate-ping" />
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              </div>
              <p className="text-gray-600 font-medium">Analyzing team data...</p>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {currentTeam && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TeamStatsDisplay team={currentTeam} />
            <Alert className="mt-6 bg-blue-50 border-2 border-blue-200">
              <AlertDescription className="text-blue-900">
                ✅ Team analysis saved! View in <a href="/MyAccount?tab=saved" className="underline font-bold">Saved Results</a>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}