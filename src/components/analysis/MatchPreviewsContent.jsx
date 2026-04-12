import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MatchPreviewSearch from "./MatchPreviewSearch";
import MatchOverviewCard from "./MatchOverviewCard";
import HeadToHeadCard from "./HeadToHeadCard";
import KeyMatchupsCard from "./KeyMatchupsCard";
import BettingMarketsCard from "./BettingMarketsCard";

export default function MatchPreviewsContent() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const handleSearch = async ({ home_team, away_team, sport }) => {
    setIsSearching(true);
    setError(null);
    setPreviewData(null);

    try {
      const response = await base44.functions.invoke('analyzeMatchPreview', {
        home_team, away_team, sport
      });
      setPreviewData(response.data);
    } catch (err) {
      console.error('Match preview error:', err);
      setError("Failed to generate match preview. Please try again.");
    }
    setIsSearching(false);
  };

  return (
    <div className="space-y-6">
      <MatchPreviewSearch onSearch={handleSearch} isSearching={isSearching} />

      {error && (
        <Alert variant="destructive" className="bg-red-900/50 border border-red-500/50 backdrop-blur-sm">
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {isSearching && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full opacity-20 animate-ping" />
              <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center border border-cyan-500/30">
                <Sparkles className="w-10 h-10 text-cyan-400 animate-spin" />
              </div>
            </div>
            <p className="text-lg font-bold text-white">Generating Deep Match Preview...</p>
            <p className="text-sm text-slate-400 mt-1">Analyzing stats, matchups, injuries & markets</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {previewData && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <MatchOverviewCard overview={previewData.overview} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HeadToHeadCard data={previewData.head_to_head} />
              <KeyMatchupsCard data={previewData.key_matchups} />
            </div>
            <BettingMarketsCard data={previewData.betting_markets} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}