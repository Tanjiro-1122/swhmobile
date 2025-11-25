import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
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

  const handleSearch = async (query) => {
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsSearching(true);
    setError(null);
    setCurrentPlayer(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports analyst with REAL-TIME INTERNET ACCESS. Search for player: "${query}"
TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

Get comprehensive stats including:
- Season averages (sport-specific stats)
- Last 5 games with detailed per-game stats
- Next game prediction with specific numbers
- Betting insights (over/under, hot streak, consistency)
- Injury status

Return complete JSON with all fields populated.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            role: { type: "string" },
            league: { type: "string" },
            season_averages: { type: "object" },
            recent_form: { type: "array", items: { type: "object" } },
            injury_status: { type: "string" },
            next_game: {
              type: "object",
              properties: {
                opponent: { type: "string" },
                date: { type: "string" },
                location: { type: "string" },
                predicted_performance: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              },
              required: ["opponent", "predicted_performance", "confidence", "reasoning"]
            },
            betting_insights: { type: "object" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } }
          },
          required: ["player_name", "sport", "team", "next_game"]
        }
      });

      if (!result || !result.player_name || !result.next_game) {
        throw new Error("Invalid response - player not found");
      }

      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setCurrentPlayer(result);
      
    } catch (err) {
      console.error("Player analysis error:", err);
      setError("Failed to analyze player. Please try again with full name.");
    }

    setIsSearching(false);
  };

  return (
    <div className="space-y-6">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <Card className="p-6 border-2 border-purple-200 bg-white shadow-xl">
        <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
      </Card>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-2 border-red-200">
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      {isSearching && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20 animate-ping" />
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-purple-500 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Player Data</h3>
            <p className="text-gray-700">Fetching stats from StatMuse & ESPN...</p>
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
                ✅ Player analysis saved! View in <a href="/MyAccount" className="underline font-bold">Saved Results</a>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}