import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Trash2, Shield, ChevronDown, ChevronUp, Trophy, Home, Plane } from "lucide-react";
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
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgNi42MjctNS4zNzMgMTItMTIgMTJzLTEyLTUuMzczLTEyLTEyIDUuMzczLTEyIDEyLTEyIDEyIDUuMzczIDEyLDEyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          
          <div className="relative flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
            <div className="space-y-2 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs sm:text-sm">
                  {match.sport}
                </Badge>
                {match.league && (
                  <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-xs sm:text-sm">
                    {match.league}
                  </Badge>
                )}
              </div>
              {formattedDate && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  {formattedDate}
                </div>
              )}
              {match.venue && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80">
                  <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{match.venue}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              {match.confidence_level && (
                <Badge className={`${confidenceColors[match.confidence_level]} border backdrop-blur-sm flex items-center gap-1 font-bold text-xs sm:text-sm`}>
                  <Shield className="w-3 h-3" />
                  {match.confidence_level.toUpperCase()}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(match.id)}
                className="hover:bg-red-500/20 hover:text-red-400 text-white/80 backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile-Optimized Home vs Away Display */}
          <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Home Team */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30 font-bold text-xs">
                    HOME
                  </Badge>
                </div>
                <div className="text-lg sm:text-2xl font-black text-white mb-1 truncate px-2">
                  {match.home_team}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-green-400">
                  {match.home_win_probability?.toFixed(0)}%
                </div>
              </div>

              {/* VS - Hidden on very small screens */}
              <div className="hidden sm:flex text-center items-center justify-center">
                <div className="text-2xl sm:text-4xl font-black text-white/50">VS</div>
              </div>
              
              {/* Mobile VS divider */}
              <div className="sm:hidden flex items-center justify-center">
                <div className="text-sm font-bold text-white/70">VS</div>
              </div>

              {/* Away Team */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 font-bold text-xs">
                    AWAY
                  </Badge>
                </div>
                <div className="text-lg sm:text-2xl font-black text-white mb-1 truncate px-2">
                  {match.away_team}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-400">
                  {match.away_win_probability?.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <ProbabilityMeter
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            homeProb={match.home_win_probability || 0}
            awayProb={match.away_win_probability || 0}
            drawProb={match.draw_probability || 0}
          />

          {match.prediction && (
            <div className="p-4 sm:p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl border-2 border-emerald-400 shadow-lg">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="font-black text-white text-lg sm:text-xl">AI Prediction</span>
                {match.prediction.confidence && (
                  <Badge className="bg-white/20 text-white border-white/30 ml-auto text-xs sm:text-sm">
                    {match.prediction.confidence} Confidence
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
                  <div className="text-white/80 text-xs sm:text-sm mb-1">Predicted Winner</div>
                  <div className="text-white font-black text-xl sm:text-2xl truncate">{match.prediction.winner}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-white/80 text-xs mb-1">Predicted Score</div>
                    <div className="text-white font-bold text-base sm:text-lg">{match.prediction.predicted_score}</div>
                  </div>
                  {match.prediction.win_margin && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="text-white/80 text-xs mb-1">Win Margin</div>
                      <div className="text-white font-bold text-base sm:text-lg">{match.prediction.win_margin}</div>
                    </div>
                  )}
                </div>

                {match.prediction.reasoning && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
                    <div className="text-white/90 text-xs sm:text-sm leading-relaxed">{match.prediction.reasoning}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile-Optimized Injury Report */}
          {match.injuries && match.injuries.length > 0 && (
            <div className="p-3 sm:p-4 bg-red-500/10 rounded-xl border border-red-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl sm:text-2xl">🏥</span>
                <span className="font-bold text-white text-sm sm:text-base">Injury Report</span>
              </div>
              <div className="space-y-2">
                {match.injuries.map((injury, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-slate-900/50 rounded p-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{injury.player_name} ({injury.team})</div>
                      <div className="text-xs text-slate-400 truncate">{injury.injury}</div>
                    </div>
                    <div className="flex items-center gap-2 justify-between sm:justify-end sm:text-right">
                      <Badge className={`text-xs ${
                        injury.status === 'Out' ? 'bg-red-500 text-white' :
                        injury.status === 'Questionable' ? 'bg-yellow-500 text-white' :
                        'bg-orange-500 text-white'
                      }`}>
                        {injury.status}
                      </Badge>
                      {injury.impact && (
                        <div className="text-xs text-slate-400">Impact: {injury.impact}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile-Optimized Weather Impact */}
          {match.weather_impact && match.weather_impact.conditions && (
            <div className="p-3 sm:p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xl sm:text-2xl">🌤️</span>
                <span className="font-bold text-white text-sm sm:text-base">Weather Impact</span>
                <Badge className={`ml-auto text-xs ${
                  match.weather_impact.impact_rating === 'High' ? 'bg-red-500' :
                  match.weather_impact.impact_rating === 'Medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}>
                  {match.weather_impact.impact_rating} Impact
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-xs text-slate-400">Conditions</div>
                  <div className="font-semibold text-white text-sm truncate">{match.weather_impact.conditions}</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-xs text-slate-400">Temperature</div>
                  <div className="font-semibold text-white text-sm truncate">{match.weather_impact.temperature}</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2 col-span-2 sm:col-span-1">
                  <div className="text-xs text-slate-400">Wind Speed</div>
                  <div className="font-semibold text-white text-sm truncate">{match.weather_impact.wind_speed}</div>
                </div>
              </div>
              {match.weather_impact.betting_impact && (
                <div className="text-xs sm:text-sm text-blue-300">
                  💡 <strong>Betting Impact:</strong> {match.weather_impact.betting_impact}
                </div>
              )}
            </div>
          )}

          {match.head_to_head && match.head_to_head.length > 0 && (
            <div className="p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="font-bold text-white text-sm sm:text-base">Head-to-Head History</span>
              </div>
              <div className="space-y-2">
                {match.head_to_head.map((game, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm bg-slate-900/50 rounded p-2">
                    <span className="text-slate-300">{game.date}</span>
                    <span className="font-semibold text-white truncate">{game.result}</span>
                    <span className="text-slate-400">{game.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {match.key_factors && match.key_factors.length > 0 && (
            <div>
              <div className="text-xs sm:text-sm font-bold mb-3 text-slate-300">Key Factors:</div>
              <div className="flex flex-wrap gap-2">
                {match.key_factors.map((factor, idx) => (
                  <Badge key={idx} className="bg-slate-800 text-slate-300 border-slate-700 hover:border-blue-500/50 transition-colors text-xs">
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
              className="w-full mt-4 flex items-center justify-center gap-2 text-sm sm:text-base"
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