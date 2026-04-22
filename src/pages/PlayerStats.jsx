import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      // ✅ Use Vercel API route — NOT base44.functions.invoke (broken)
      const resp = await fetch('/api/getPlayerStats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'Player not found. Try using full name.');
      }
      const result = await resp.json();

      if (!result || !result.player_name) {
        throw new Error("Player not found. Please try using the full name.");
      }

      // Save to local Query entity for tracking (PlayerStats entity may not exist)
      try {
        await base44.entities.Query.create({ query_text: query, result_type: 'player', result_summary: result.player_name });
      } catch {
        // Silently ignore if save fails — results still display fine
      }

      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
      // Display results immediately on this page
      setCurrentPlayer(result);
      
    } catch (err) {
      console.error("Player analysis error:", err);
      // Handle IP rate limit (429) with friendly message
      if (err?.status === 429 || err?.message?.includes('free_limit_reached')) {
        setShowLimitModal(true);
      } else {
        setError(err.message || "Failed to analyze player. Please try again with full name or different spelling.");
      }
    }

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
        isAuthenticated={isAuthenticated}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <div className="mb-4">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline" className="min-h-[48px] px-5 py-3 text-base font-bold text-white border-gray-600 bg-gray-800 hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">Player Stats & Predictions</h1>
              <p className="text-gray-400">Analyze any player's performance and get AI-powered predictions</p>
            </div>
          </div>
        </div>

        <Card className="p-6 mb-8 border border-purple-500/30 bg-gray-900 shadow-xl">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/30 border border-red-500/50">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
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
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Player Data</h3>
              <p className="text-gray-300">Fetching complete game-by-game stats from Basketball-Reference & StatMuse...</p>
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
                  ✅ Player analysis complete! View all your saved results in <a href="/SavedResults" className="underline font-bold">Saved Results</a>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
