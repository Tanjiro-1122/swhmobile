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

  const handleSearch = async (query) => {
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsSearching(true);
    setError(null);
    setCurrentTeam(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports analyst with REAL-TIME INTERNET ACCESS. Search for team: "${query}"
TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

Get comprehensive team stats including:
- Team logo URL (search ESPN, official league sites for the team logo)
- Current record and standings
- Season averages
- Last 5 games with scores
- Next game prediction with specific score
- Strengths and weaknesses
- Injury report

IMPORTANT: For logo_url, find the official team logo from ESPN, NBA.com, NFL.com, MLB.com, NHL.com or similar sports sites. The URL should be a direct link to the team's logo image.

Return complete JSON with all fields populated.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            team_name: { type: "string" },
            logo_url: { type: "string", description: "Direct URL to team logo from ESPN or official league site" },
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
              },
              required: ["opponent", "predicted_outcome", "confidence", "reasoning"]
            }
          },
          required: ["team_name", "sport", "next_game"]
        }
      });

      if (!result || !result.team_name) {
        throw new Error("Invalid response - team not found");
      }

      await base44.entities.TeamStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setCurrentTeam(result);
      
    } catch (err) {
      console.error("Team analysis error:", err);
      setError("Failed to analyze team. Please try again with full team name.");
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-white/20 animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-white/20 rounded-lg w-2/3 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-white/20 rounded-full w-20 animate-pulse" />
                    <div className="h-6 bg-white/20 rounded-full w-24 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-blue-50 rounded-lg p-3 space-y-2">
                    <div className="h-8 bg-blue-200 rounded animate-pulse" />
                    <div className="h-4 bg-blue-100 rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
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
                ✅ Team analysis saved! View in <a href="/MyAccount" className="underline font-bold">Saved Results</a>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}