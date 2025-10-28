import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, Calendar, MapPin, Trophy, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import PlayerRecentGames from "./PlayerRecentGames";

export default function PlayerStatsDisplay({ player, onDelete, index }) {
  const [expanded, setExpanded] = useState(false);

  const getInjuryColor = (status) => {
    const colors = {
      'Healthy': 'bg-green-500/20 text-green-300 border-green-500/50',
      'Questionable': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      'Out': 'bg-red-500/20 text-red-300 border-red-500/50',
      'Day-to-Day': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      'Probable': 'bg-blue-500/20 text-blue-300 border-blue-500/50'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  const getRoleColor = (role) => {
    const colors = {
      'Starter': 'bg-purple-500/20 text-purple-200 border-purple-500/50',
      'Bench': 'bg-gray-500/20 text-gray-200 border-gray-500/50',
      'Sixth Man': 'bg-blue-500/20 text-blue-200 border-blue-500/50',
      'Rotation': 'bg-green-500/20 text-green-200 border-green-500/50'
    };
    return colors[role] || 'bg-gray-500/20 text-gray-200 border-gray-500/50';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50 shadow-xl overflow-hidden">
        {/* Header Section */}
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white pb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white border-white/30">{player.sport}</Badge>
                {player.league && (
                  <Badge className="bg-white/10 text-white border-white/20">{player.league}</Badge>
                )}
                {player.role && (
                  <Badge className={`${getRoleColor(player.role)} border font-bold`}>
                    {player.role}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-4xl font-black text-white drop-shadow-lg">
                {player.player_name}
              </CardTitle>
              <div className="flex items-center gap-4 text-white/90">
                <span className="font-semibold">{player.team}</span>
                <span>•</span>
                <span>{player.position}</span>
                {player.jersey_number && (
                  <>
                    <span>•</span>
                    <span>#{player.jersey_number}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {player.injury_status && (
                <Badge className={`${getInjuryColor(player.injury_status)} border font-bold text-base px-3 py-1`}>
                  {player.injury_status}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(player.id)}
                className="hover:bg-red-500/20 hover:text-red-300 text-white/80"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Season Averages */}
          {player.season_averages && Object.keys(player.season_averages).some(key => player.season_averages[key] !== null && player.season_averages[key] !== 0) && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-purple-600" />
                Season Averages
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {player.season_averages.points_per_game && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                    <div className="text-sm font-semibold text-blue-900 mb-1">PPG</div>
                    <div className="text-3xl font-black text-blue-600">{player.season_averages.points_per_game.toFixed(1)}</div>
                  </div>
                )}
                {player.season_averages.assists_per_game && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-900 mb-1">APG</div>
                    <div className="text-3xl font-black text-green-600">{player.season_averages.assists_per_game.toFixed(1)}</div>
                  </div>
                )}
                {player.season_averages.rebounds_per_game && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
                    <div className="text-sm font-semibold text-orange-900 mb-1">RPG</div>
                    <div className="text-3xl font-black text-orange-600">{player.season_averages.rebounds_per_game.toFixed(1)}</div>
                  </div>
                )}
                {player.season_averages.field_goal_percentage && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                    <div className="text-sm font-semibold text-purple-900 mb-1">FG%</div>
                    <div className="text-3xl font-black text-purple-600">{player.season_averages.field_goal_percentage.toFixed(1)}%</div>
                  </div>
                )}
                {player.season_averages.three_point_percentage && (
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border-2 border-indigo-200">
                    <div className="text-sm font-semibold text-indigo-900 mb-1">3P%</div>
                    <div className="text-3xl font-black text-indigo-600">{player.season_averages.three_point_percentage.toFixed(1)}%</div>
                  </div>
                )}
                {player.season_averages.free_throw_percentage && (
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border-2 border-pink-200">
                    <div className="text-sm font-semibold text-pink-900 mb-1">FT%</div>
                    <div className="text-3xl font-black text-pink-600">{player.season_averages.free_throw_percentage.toFixed(1)}%</div>
                  </div>
                )}
                {player.season_averages.minutes_per_game && (
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border-2 border-teal-200">
                    <div className="text-sm font-semibold text-teal-900 mb-1">MPG</div>
                    <div className="text-3xl font-black text-teal-600">{player.season_averages.minutes_per_game.toFixed(1)}</div>
                  </div>
                )}
                {player.season_averages.passing_yards_per_game && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                    <div className="text-sm font-semibold text-blue-900 mb-1">Pass YPG</div>
                    <div className="text-3xl font-black text-blue-600">{player.season_averages.passing_yards_per_game.toFixed(1)}</div>
                  </div>
                )}
                {player.season_averages.rushing_yards_per_game && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-900 mb-1">Rush YPG</div>
                    <div className="text-3xl font-black text-green-600">{player.season_averages.rushing_yards_per_game.toFixed(1)}</div>
                  </div>
                )}
                {player.season_averages.goals_per_game && (
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200">
                    <div className="text-sm font-semibold text-red-900 mb-1">Goals/Game</div>
                    <div className="text-3xl font-black text-red-600">{player.season_averages.goals_per_game.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Game Prediction */}
          {player.next_game && (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-6 h-6" />
                <h3 className="text-2xl font-black">Next Game Prediction</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div>
                    <div className="text-white/80 text-sm mb-1">Opponent</div>
                    <div className="text-2xl font-bold">{player.next_game.opponent}</div>
                  </div>
                  {player.next_game.location && (
                    <div className="text-right">
                      <div className="text-white/80 text-sm mb-1">Location</div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-4 h-4" />
                        {player.next_game.location}
                      </div>
                    </div>
                  )}
                </div>

                {player.next_game.date && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-white/80 text-sm mb-1">Game Date</div>
                    <div className="text-lg font-semibold">{player.next_game.date}</div>
                  </div>
                )}

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-white/80 text-sm mb-2">Predicted Performance</div>
                  <div className="text-2xl font-black mb-3">{player.next_game.predicted_performance}</div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/20 text-white border-white/30">
                      {player.next_game.confidence} Confidence
                    </Badge>
                  </div>
                </div>

                {player.next_game.reasoning && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-white/90 text-sm leading-relaxed">{player.next_game.reasoning}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Betting Insights */}
          {player.betting_insights && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-6 border-2 border-orange-200">
              <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Betting Insights
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {player.betting_insights.over_under_points !== null && player.betting_insights.over_under_points !== undefined && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-1">O/U Points</div>
                    <div className="text-2xl font-black text-orange-600">{player.betting_insights.over_under_points.toFixed(1)}</div>
                  </div>
                )}
                {player.betting_insights.probability_to_score !== null && player.betting_insights.probability_to_score !== undefined && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-1">Score Prob</div>
                    <div className="text-2xl font-black text-green-600">{player.betting_insights.probability_to_score.toFixed(0)}%</div>
                  </div>
                )}
                {player.betting_insights.hot_streak !== null && player.betting_insights.hot_streak !== undefined && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-1">Hot Streak</div>
                    <div className="text-2xl font-black text-red-600">{player.betting_insights.hot_streak ? '🔥 YES' : '❄️ NO'}</div>
                  </div>
                )}
                {player.betting_insights.consistency_rating && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-1">Consistency</div>
                    <div className="text-2xl font-black text-blue-600">{player.betting_insights.consistency_rating}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expandable Section Toggle */}
          <Button
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-5 h-5" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                Show Recent Games, Strengths & Weaknesses
              </>
            )}
          </Button>

          {/* Expandable Section */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 pt-4"
            >
              {/* Recent Form */}
              {player.recent_form && player.recent_form.length > 0 && (
                <PlayerRecentGames games={player.recent_form} sport={player.sport} />
              )}

              {/* Strengths */}
              {player.strengths && player.strengths.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">💪 Strengths</h3>
                  <div className="flex flex-wrap gap-2">
                    {player.strengths.map((strength, idx) => (
                      <Badge key={idx} className="bg-green-100 text-green-800 border-green-300 text-sm py-2 px-3">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {player.weaknesses && player.weaknesses.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">⚠️ Weaknesses</h3>
                  <div className="flex flex-wrap gap-2">
                    {player.weaknesses.map((weakness, idx) => (
                      <Badge key={idx} className="bg-red-100 text-red-800 border-red-300 text-sm py-2 px-3">
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Career Highlights */}
              {player.career_highlights && player.career_highlights.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">🏆 Career Highlights</h3>
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-4 border-2 border-yellow-200">
                    <ul className="space-y-2">
                      {player.career_highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-800">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span className="font-semibold">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}