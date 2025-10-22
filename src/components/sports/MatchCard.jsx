
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
  low: "bg-yellow-100 text-yellow-800 border-yellow-300",
  medium: "bg-blue-100 text-blue-800 border-blue-300",
  high: "bg-green-100 text-green-800 border-green-300"
};

export default function MatchCard({ match, onDelete, index }) {
  const [expanded, setExpanded] = useState(false);

  const formatMatchDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null; // Check for invalid date
      return format(date, "MMM d, yyyy 'at' HH:mm");
    } catch (error) {
      console.error("Error formatting date:", error);
      return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b">
          <div className="flex justify-between items-start mb-2">
            <div className="space-y-1">
              <Badge variant="secondary" className="bg-white/80">
                {match.sport}
              </Badge>
              {match.league && (
                <div className="text-sm text-gray-600">{match.league}</div>
              )}
            </div>
            <div className="flex gap-2">
              {match.confidence_level && (
                <Badge className={`${confidenceColors[match.confidence_level]} border flex items-center gap-1`}>
                  <Shield className="w-3 h-3" />
                  {match.confidence_level} confidence
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(match.id)}
                className="hover:bg-red-100 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {match.match_date && formatMatchDate(match.match_date) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              {formatMatchDate(match.match_date)}
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <ProbabilityMeter
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            homeProb={match.home_win_probability}
            awayProb={match.away_win_probability}
            drawProb={match.draw_probability || 0}
          />

          {match.analysis_summary && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm">Analysis</span>
              </div>
              <p className="text-sm text-gray-700">{match.analysis_summary}</p>
            </div>
          )}

          {match.key_factors && match.key_factors.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2 text-gray-700">Key Factors:</div>
              <div className="flex flex-wrap gap-2">
                {match.key_factors.map((factor, idx) => (
                  <Badge key={idx} variant="outline" className="bg-white">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Expand/Collapse Button */}
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

          {/* Expanded Content */}
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
