import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";
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

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier, isLoading } = useFreeLookupTracker();

  const handleSearch = async (query, retryCount = 0) => {
    // Wait for lookup tracker to load before checking
    if (isLoading) {
      setError("Please wait, loading your account status...");
      return;
    }
    
    if (!canLookup()) {
      setShowLimitModal(true);
      setError(null); // Clear any previous error
      return;
    }

    setIsSearching(true);
    setError(null);
    if (retryCount === 0) {
      setCurrentPlayer(null);
    }

    const maxRetries = 2;

    try {
      const response = await base44.functions.invoke('getPlayerStats', { query });
      const result = response.data;

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
        <Alert variant="destructive" className="bg-red-900/50 border border-red-500/50 backdrop-blur-sm">
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {isSearching && (
        <div className="space-y-6 animate-fade-in">
          {/* Skeleton loader while searching */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-purple-500/30 overflow-hidden shadow-xl">
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
                  <div key={i} className="bg-slate-700/50 rounded-lg p-2 sm:p-3 space-y-2">
                    <div className="h-6 sm:h-8 bg-slate-600 rounded animate-pulse" />
                    <div className="h-3 sm:h-4 bg-slate-700 rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-32 sm:h-48 bg-slate-700/50 rounded-lg animate-pulse" />
            </div>
          </div>
          
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20 animate-ping" />
                <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-purple-500/30">
                  <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
              </div>
              <p className="text-slate-300 font-medium">Analyzing player data...</p>
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
            <Alert className="mt-6 bg-emerald-900/30 border border-emerald-500/50 backdrop-blur-sm">
              <AlertDescription className="text-emerald-200">
                ✅ Player analysis saved! View in <a href="/MyAccount?tab=saved" className="underline font-bold text-emerald-300 hover:text-emerald-100">Saved Results</a>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}