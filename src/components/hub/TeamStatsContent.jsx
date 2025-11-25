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
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-20 animate-ping" />
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Team Data</h3>
            <p className="text-gray-700">Fetching stats from StatMuse & ESPN...</p>
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