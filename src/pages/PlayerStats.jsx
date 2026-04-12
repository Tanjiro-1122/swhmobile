import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Trophy } from "lucide-react";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayerStats() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const queryClient = useQueryClient();

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier } = useFreeLookupTracker();

  useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const handleSearch = async (query) => {
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsSearching(true);
    setError(null);
    setCurrentPlayer(null);

    try {
      // Call the backend function instead of invoking LLM directly
      const response = await base44.functions.invoke('getPlayerStats', { query });

      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      const result = response.data;

      if (!result || !result.player_name || !result.next_game) {
        throw new Error("Invalid response from backend - player not found or missing data");
      }

      // Save to database for historical tracking
      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
      // Display results immediately on this page
      setCurrentPlayer(result);
      
    } catch (err) {
      console.error("Player analysis error:", err);
      setError(err.message || "Failed to analyze player. Please try again with full name or different spelling.");
    }

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
        isAuthenticated={isAuthenticated}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Player Stats & Predictions</h1>
              <p className="text-gray-600">Analyze any player's performance and get AI-powered predictions</p>
            </div>
          </div>
        </div>

        <Card className="p-6 mb-8 border-2 border-purple-200 bg-white shadow-xl">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-2 border-red-200">
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        )}

        {isSearching && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20 animate-ping" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-75 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-purple-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Player Data</h3>
              <p className="text-gray-700">Fetching complete game-by-game stats from Basketball-Reference & StatMuse...</p>
              <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds for detailed data extraction</p>
            </div>
          </div>
        )}

        {/* Display player results directly on this page */}
        <AnimatePresence>
          {currentPlayer && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <PlayerStatsDisplay player={currentPlayer} />
              
              <Alert className="mt-6 bg-blue-50 border-2 border-blue-200">
                <AlertDescription className="text-blue-900">
                  ✅ Player analysis saved! View all your saved results in <a href="/SavedResults" className="underline font-bold">Saved Results</a>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}