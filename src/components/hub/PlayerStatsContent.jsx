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
- Player headshot/photo URL (search ESPN, NBA.com, NFL.com, MLB.com etc for official player photo)
- Season averages (sport-specific stats)
- Last 5 games with detailed per-game stats
- Next game prediction with specific numbers
- Betting insights (over/under, hot streak, consistency)
- Injury status

IMPORTANT: For image_url, find the official player headshot from ESPN, NBA.com, NFL.com, MLB.com, NHL.com or similar sports sites. The URL should be a direct link to the player's photo.

Return complete JSON with all fields populated.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            image_url: { type: "string", description: "Direct URL to player headshot/photo from ESPN or official league site" },
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
      setCurrentPlayer(result);
      
    } catch (err) {
      console.error("Player analysis error:", err);
      const errorMessage = err?.message || "Unknown error";
      if (errorMessage.includes("rate") || errorMessage.includes("limit")) {
        setError("Service is busy. Please wait a moment and try again.");
      } else if (errorMessage.includes("timeout")) {
        setError("Request timed out. Please try again.");
      } else {
        setError("Failed to analyze player. Please try again with full name.");
      }
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
        <div className="space-y-6 animate-fade-in">
          {/* Skeleton loader while searching */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-purple-200 overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-white/20 rounded-lg w-2/3 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-white/20 rounded-full w-20 animate-pulse" />
                    <div className="h-6 bg-white/20 rounded-full w-16 animate-pulse" />
                    <div className="h-6 bg-white/20 rounded-full w-24 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-purple-50 rounded-lg p-3 space-y-2">
                    <div className="h-8 bg-purple-200 rounded animate-pulse" />
                    <div className="h-4 bg-purple-100 rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
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
                ✅ Player analysis saved! View in <a href="/MyAccount" className="underline font-bold">Saved Results</a>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}