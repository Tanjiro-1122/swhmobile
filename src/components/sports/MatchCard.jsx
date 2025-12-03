import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Trash2, Shield, ChevronDown, ChevronUp, Trophy, Home, Plane, Database, Info } from "lucide-react";
import { format } from "date-fns";
import ProbabilityMeter from "./ProbabilityMeter";
import PlayerStatsCard from "./PlayerStatsCard";
import BettingMarketsCard from "./BettingMarketsCard";
import OutcomeRecorder from "../calibration/OutcomeRecorder";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const confidenceColors = {
  low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-green-500/20 text-green-400 border-green-500/30"
};

export default function MatchCard({ match, onDelete, index }) {
  const [expanded, setExpanded] = useState(false);
  const [showDataSources, setShowDataSources] = useState(false);

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
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb2g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgNi42MjctNS4zNzMgMTItMTIgMTJzLTEyLTUuMzczLTEyLTEyIDUuMzczLTEyIDEyLTEyIDEyLDUuMzczIDEyLDEyIi8+PC9nPjwvZz48L3N2Z24=')] opacity-30" />
          
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
              {match.venue && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Home className="w-4 h-4" />
                  {match.venue}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {match.confidence_level && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={`${confidenceColors[match.confidence_level]} border backdrop-blur-sm flex items-center gap-1 font-bold cursor-help`}>
                        <Shield className="w-3 h-3" />
                        {match.confidence_level.toUpperCase()}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        {match.confidence_level === 'high' && 'High confidence: 80%+ prediction accuracy based on strong data signals'}
                        {match.confidence_level === 'medium' && 'Medium confidence: 65-79% prediction accuracy with good data support'}
                        {match.confidence_level === 'low' && 'Low confidence: <65% prediction accuracy, limited reliable data'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(match.id)}
                  className="hover:bg-red-500/20 hover:text-red-400 text-white/80 backdrop-blur-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Game Display - format varies by sport convention */}
          <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            {(() => {
              // North American sports use "Away @ Home" format
              const isNorthAmericanSport = ['NBA', 'NFL', 'MLB', 'NHL', 'Basketball', 'Football', 'Baseball', 'Hockey'].includes(match.sport);
              
              if (isNorthAmericanSport) {
                // Away @ Home (North American convention)
                return (
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Away Team (listed first) */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Plane className="w-5 h-5 text-blue-400" />
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 font-bold">
                          AWAY
                        </Badge>
                      </div>
                      <div className="text-2xl font-black text-white mb-1">
                        {match.away_team}
                      </div>
                      <div className="text-3xl font-black text-blue-400">
                        {match.away_win_probability?.toFixed(0)}%
                      </div>
                    </div>

                    {/* @ symbol */}
                    <div className="text-center">
                      <div className="text-4xl font-black text-white/50">@</div>
                    </div>

                    {/* Home Team (listed second) */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Home className="w-5 h-5 text-green-400" />
                        <Badge className="bg-green-500/20 text-green-300 border-green-400/30 font-bold">
                          HOME
                        </Badge>
                      </div>
                      <div className="text-2xl font-black text-white mb-1">
                        {match.home_team}
                      </div>
                      <div className="text-3xl font-black text-green-400">
                        {match.home_win_probability?.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Home vs Away (International convention - Soccer, etc.)
                return (
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Home Team (listed first) */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Home className="w-5 h-5 text-green-400" />
                        <Badge className="bg-green-500/20 text-green-300 border-green-400/30 font-bold">
                          HOME
                        </Badge>
                      </div>
                      <div className="text-2xl font-black text-white mb-1">
                        {match.home_team}
                      </div>
                      <div className="text-3xl font-black text-green-400">
                        {match.home_win_probability?.toFixed(0)}%
                      </div>
                    </div>

                    {/* vs symbol */}
                    <div className="text-center">
                      <div className="text-4xl font-black text-white/50">vs</div>
                    </div>

                    {/* Away Team (listed second) */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Plane className="w-5 h-5 text-blue-400" />
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 font-bold">
                          AWAY
                        </Badge>
                      </div>
                      <div className="text-2xl font-black text-white mb-1">
                        {match.away_team}
                      </div>
                      <div className="text-3xl font-black text-blue-400">
                        {match.away_win_probability?.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              }
            })()}
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

          {match.prediction && (
            <div className="space-y-3">
              <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl border-2 border-emerald-400 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-6 h-6 text-white" />
                  <span className="font-black text-white text-xl">AI Analysis</span>
                  {match.prediction.confidence && (
                    <Badge className="bg-white/20 text-white border-white/30 ml-auto">
                      {match.prediction.confidence} Confidence
                    </Badge>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white">
                          <Info className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm max-w-xs">
                          AI analyzes real-time data from StatMuse, ESPN, injury reports, weather, and historical matchups to generate this analysis.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-white/80 text-sm mb-1">Projected Winner</div>
                <div className="text-white font-black text-2xl">{match.prediction.winner}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="text-white/80 text-xs mb-1">Projected Score</div>
                  <div className="text-white font-bold text-lg">{match.prediction.predicted_score}</div>
                </div>
                  {match.prediction.win_margin && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="text-white/80 text-xs mb-1">Win Margin</div>
                      <div className="text-white font-bold text-lg">{match.prediction.win_margin}</div>
                    </div>
                  )}
                </div>

                {match.prediction.reasoning && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-white/90 text-sm leading-relaxed">{match.prediction.reasoning}</div>
                  </div>
                )}
              </div>
            </div>
            
            <OutcomeRecorder match={match} />
            </div>
          )}

          {/* Data Sources Transparency */}
          {match.data_sources && (
            <div className="border-t border-slate-700 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDataSources(!showDataSources)}
                className="text-slate-400 hover:text-white flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                {showDataSources ? 'Hide' : 'Show'} Data Sources
                <ChevronDown className={`w-4 h-4 transition-transform ${showDataSources ? 'rotate-180' : ''}`} />
              </Button>
              
              <AnimatePresence>
                {showDataSources && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm"
                  >
                    <div className="text-slate-300 font-semibold mb-2">🔍 AI analyzed data from:</div>
                    {match.data_sources.stats_source && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span className="text-slate-400">Statistics: {match.data_sources.stats_source}</span>
                      </div>
                    )}
                    {match.data_sources.schedule_source && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span className="text-slate-400">Schedule: {match.data_sources.schedule_source}</span>
                      </div>
                    )}
                    {match.data_sources.injury_source && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span className="text-slate-400">Injuries: {match.data_sources.injury_source}</span>
                      </div>
                    )}
                    {match.data_sources.weather_source && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span className="text-slate-400">Weather: {match.data_sources.weather_source}</span>
                      </div>
                    )}
                    {match.data_sources.head_to_head_source && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span className="text-slate-400">H2H History: {match.data_sources.head_to_head_source}</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {match.injuries && match.injuries.length > 0 && (
            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏥</span>
                <span className="font-bold text-white">Injury Report</span>
              </div>
              <div className="space-y-2">
                {match.injuries.map((injury, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/50 rounded p-2">
                    <div>
                      <div className="font-semibold text-white">{injury.player_name} ({injury.team})</div>
                      <div className="text-sm text-slate-400">{injury.injury}</div>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        injury.status === 'Out' ? 'bg-red-500 text-white' :
                        injury.status === 'Questionable' ? 'bg-yellow-500 text-white' :
                        'bg-orange-500 text-white'
                      }>
                        {injury.status}
                      </Badge>
                      {injury.impact && (
                        <div className="text-xs text-slate-400 mt-1">Impact: {injury.impact}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {match.weather_impact && match.weather_impact.conditions && (
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🌤️</span>
                <span className="font-bold text-white">Weather Impact</span>
                <Badge className={
                  match.weather_impact.impact_rating === 'High' ? 'bg-red-500 ml-auto' :
                  match.weather_impact.impact_rating === 'Medium' ? 'bg-yellow-500 ml-auto' :
                  'bg-green-500 ml-auto'
                }>
                  {match.weather_impact.impact_rating} Impact
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-xs text-slate-400">Conditions</div>
                  <div className="font-semibold text-white">{match.weather_impact.conditions}</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-xs text-slate-400">Temperature</div>
                  <div className="font-semibold text-white">{match.weather_impact.temperature}</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-xs text-slate-400">Wind Speed</div>
                  <div className="font-semibold text-white">{match.weather_impact.wind_speed}</div>
                </div>
              </div>
              {match.weather_impact.betting_impact && (
                <div className="text-sm text-blue-300">
                  💡 <strong>Betting Impact:</strong> {match.weather_impact.betting_impact}
                </div>
              )}
            </div>
          )}

          {match.head_to_head && match.head_to_head.length > 0 && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-white">Head-to-Head History</span>
              </div>
              <div className="space-y-2">
                {match.head_to_head.map((game, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-slate-900/50 rounded p-2">
                    <span className="text-slate-300">{game.date}</span>
                    <span className="font-semibold text-white">{game.result}</span>
                    <span className="text-slate-400">{game.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {match.betting_trends && (
            <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <span className="font-bold text-white">Betting Trends</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Public Bets</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white">{match.home_team}:</span>
                    <span className="font-bold text-blue-400">{match.betting_trends.public_bets_home}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white">{match.away_team}:</span>
                    <span className="font-bold text-purple-400">{match.betting_trends.public_bets_away}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Money %</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white">{match.home_team}:</span>
                    <span className="font-bold text-blue-400">{match.betting_trends.money_percent_home}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white">{match.away_team}:</span>
                    <span className="font-bold text-purple-400">{match.betting_trends.money_percent_away}%</span>
                  </div>
                </div>
              </div>
              {match.betting_trends.sharp_money && (
                <div className="mt-3 pt-3 border-t border-orange-500/30">
                  <div className="text-xs text-orange-300">
                    💡 <strong>Sharp Money:</strong> {match.betting_trends.sharp_money}
                  </div>
                </div>
              )}
            </div>
          )}

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