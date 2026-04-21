import { useState } from "react";
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

  const handleSearch = async (query) => {
    if (isLoading) { setError("Loading your account status..."); return; }
    if (!canLookup()) { setShowLimitModal(true); setError(null); return; }

    setIsSearching(true);
    setError(null);
    setCurrentPlayer(null);

    try {
      // ✅ Vercel API route — NOT base44.functions.invoke (broken)
      const resp = await fetch('/api/getPlayerStats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Player not found. Try using the full name.');
      if (!result?.player_name) throw new Error('Player not found. Try the full name.');

      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setCurrentPlayer(result);
    } catch (err) {
      console.error('[PlayerStatsContent]', err.message);
      if (err?.message?.includes('free_limit_reached') || err?.status === 429) {
        setShowLimitModal(true);
      } else {
        setError(err.message || 'Failed to analyze player. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal show={showLimitModal} onClose={() => setShowLimitModal(false)} lookupsRemaining={lookupsRemaining} />

      <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />

      {error && (
        <Alert variant="destructive" className="bg-red-900/50 border border-red-500/50 backdrop-blur-sm">
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {isSearching && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20 animate-ping" />
              <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-purple-500/30">
                <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            </div>
            <p className="text-slate-300 font-medium">Analyzing player data...</p>
            <p className="text-slate-500 text-sm mt-1">This can take 10–15 seconds</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {currentPlayer && !isSearching && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <PlayerStatsDisplay player={currentPlayer} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
