
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Trash2, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import ProbabilityMeter from "./ProbabilityMeter";
import PlayerStatsCard from "./PlayerStatsCard";
import BettingMarketsCard from "./BettingMarketsCard";

const confidenceColors = {
  low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-green-500/20 text-green-400 border-green-500/30"
};

export default function MatchCard({ match, onDelete, index }) {
  const [expanded, setExpanded] = useState(false);

  const formatMatchDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, "MMM d, yyyy 'at' HH:mm");
    } catch (error) {
      return null;
    }
  };

  const formattedDate = formatMatchDate(match.match_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 border-2 border-slate-700 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl">
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgNi42MjctNS4zNzMgMTItMTIgMTJzLTEyLTUuMzczLTEyLTEyIDUuMzczLTEyIDEyLTEyIDEyIDUuMzczIDEyIDEyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          
          <div className="relative flex justify-between items-start mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {match.sport}
                </Badge>
                {match.league && (
                  <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
                    {match.league}
                  </Badge>
                )}
              </div>
              {formattedDate && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Calendar className="w-4 h-4" />
                  {formattedDate}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {match.confidence_level && (
                <Badge className={`${confidenceColors[match.confidence_level]} border backdrop-blur-sm flex items-center gap-1 font-bold`}>
                  <Shield className="w-3 h-3" />
                  {match.confidence_level.toUpperCase()}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(match.id)}
                className="hover:bg-red-500/20 hover:text-red-400 text-white/80 backdrop-blur-sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          <ProbabilityMeter
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            homeProb={match.home_win_probability || 0}
            awayProb={match.away_win_probability || 0}
            drawProb={match.draw_probability || 0}
          />

          {match.analysis_summary && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-white">AI Analysis</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{match.analysis_summary}</p>
            </div>
          )}

          {match.key_factors && match.key_factors.length > 0 && (
            <div>
              <div className="text-sm font-bold mb-3 text-slate-300">Key Factors:</div>
              <div className="flex flex-wrap gap-2">
                {match.key_factors.map((factor, idx) => (
                  <Badge key={idx} className="bg-slate-800 text-slate-300 border-slate-700 hover:border-blue-500/50 transition-colors">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(match.key_players?.length > 0 || match.betting_markets) && (
            <Button
              variant="outline"
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-4 flex items-center justify-center gap-2"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Detailed Stats
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Player Stats & More Markets
                </>
              )}
            </Button>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-4">
                  {match.key_players?.length > 0 && (
                    <PlayerStatsCard players={match.key_players} sport={match.sport} />
                  )}
                  {match.betting_markets && (
                    <BettingMarketsCard markets={match.betting_markets} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
