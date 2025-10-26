
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Target, 
  Activity, 
  Award, 
  AlertCircle,
  Calendar,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Flame
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import PlayerRecentGames from "./PlayerRecentGames";

export default function PlayerStatsDisplay({ player, onDelete, index }) {
  const formatDate = (dateString, formatString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, formatString);
    } catch (error) {
      return null;
    }
  };

  const getStatIcon = (label) => {
    const icons = {
      points: Target,
      assists: Activity,
      rebounds: TrendingUp,
      goals: Target,
      shots: Target,
      passes: Activity,
      tackles: Activity,
      // For combined stat "PTS+REB+AST", it will match "points" and use Target, which is acceptable.
      // If a specific icon is desired for combined stats, it could be added here.
      combined: TrendingUp // Using TrendingUp for combined stats
    };
    
    for (const key in icons) {
      if (label.toLowerCase().includes(key)) {
        return icons[key];
      }
    }
    return Activity;
  };

  const renderSeasonAverages = () => {
    if (!player.season_averages) return null;
    
    const stats = [];
    const averages = player.season_averages;
    
    // Calculate combined stat for basketball
    let combinedStat = null;
    if (player.sport?.toLowerCase().includes('basketball') || player.sport?.toLowerCase().includes('nba')) {
      const points = averages.points_per_game || 0;
      const rebounds = averages.rebounds_per_game || 0;
      const assists = averages.assists_per_game || 0;
      if (points || rebounds || assists) {
        combinedStat = points + rebounds + assists;
      }
    }
    
    if (averages.points_per_game) stats.push({ label: "Points", value: averages.points_per_game.toFixed(1), key: "points" });
    if (averages.assists_per_game) stats.push({ label: "Assists", value: averages.assists_per_game.toFixed(1), key: "assists" });
    if (averages.rebounds_per_game) stats.push({ label: "Rebounds", value: averages.rebounds_per_game.toFixed(1), key: "rebounds" });
    if (combinedStat) stats.push({ label: "PTS+REB+AST", value: combinedStat.toFixed(1), key: "combined", highlight: true });
    if (averages.goals_per_game) stats.push({ label: "Goals", value: averages.goals_per_game.toFixed(2), key: "goals" });
    if (averages.steals_per_game) stats.push({ label: "Steals", value: averages.steals_per_game.toFixed(1), key: "steals" });
    if (averages.blocks_per_game) stats.push({ label: "Blocks", value: averages.blocks_per_game.toFixed(1), key: "blocks" });
    if (averages.field_goal_percentage) stats.push({ label: "FG%", value: `${averages.field_goal_percentage.toFixed(1)}%`, key: "fg" });
    if (averages.three_point_percentage) stats.push({ label: "3P%", value: `${averages.three_point_percentage.toFixed(1)}%`, key: "3p" });
    if (averages.shots_per_game) stats.push({ label: "Shots", value: averages.shots_per_game.toFixed(1), key: "shots" });
    if (averages.passes_per_game) stats.push({ label: "Passes", value: averages.passes_per_game.toFixed(1), key: "passes" });
    if (averages.tackles_per_game) stats.push({ label: "Tackles", value: averages.tackles_per_game.toFixed(1), key: "tackles" });
    if (averages.minutes_per_game) stats.push({ label: "Minutes", value: averages.minutes_per_game.toFixed(1), key: "minutes" });
    
    return stats;
  };

  const seasonStats = renderSeasonAverages();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-purple-100">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">{player.player_name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/20 text-white border-white/30">
                  {player.team}
                </Badge>
                {player.position && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {player.position}
                  </Badge>
                )}
                <Badge className="bg-white/20 text-white border-white/30">
                  {player.sport}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(player.id)}
              className="hover:bg-white/20 text-white"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
          {player.league && (
            <p className="text-purple-100">{player.league}</p>
          )}
        </div>

        <CardContent className="p-6 space-y-6">
          {player.injury_status && player.injury_status !== "Healthy" && (
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900">Injury Status</div>
                <div className="text-sm text-amber-800">{player.injury_status}</div>
              </div>
            </div>
          )}

          {seasonStats && seasonStats.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Season Averages
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {seasonStats.map((stat, idx) => {
                  const Icon = getStatIcon(stat.label);
                  return (
                    <div 
                      key={idx} 
                      className={`${
                        stat.highlight 
                          ? 'bg-gradient-to-br from-yellow-100 via-orange-100 to-yellow-100 border-2 border-orange-300 col-span-2 md:col-span-1' 
                          : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100'
                      } rounded-lg p-4`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${stat.highlight ? 'text-orange-600' : 'text-purple-600'}`} />
                        <span className={`text-sm ${stat.highlight ? 'font-bold text-orange-900' : 'text-gray-600'}`}>
                          {stat.label}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${stat.highlight ? 'text-orange-600' : 'text-purple-900'}`}>
                        {stat.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {player.betting_insights && (
            <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-green-600" />
                  Betting Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {player.betting_insights.over_under_points && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Over/Under Line:</span>
                    <span className="text-xl font-bold text-green-600">
                      {player.betting_insights.over_under_points}
                    </span>
                  </div>
                )}
                {player.betting_insights.probability_to_score && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Probability to Score:</span>
                    <span className="text-xl font-bold text-green-600">
                      {player.betting_insights.probability_to_score}%
                    </span>
                  </div>
                )}
                {player.betting_insights.hot_streak && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                    <Flame className="w-3 h-3 mr-1" />
                    On a Hot Streak!
                  </Badge>
                )}
                {player.betting_insights.consistency_rating && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Consistency:</span>
                    <Badge variant="outline">{player.betting_insights.consistency_rating}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Form - Enhanced */}
          {player.recent_form && player.recent_form.length > 0 && (
            <PlayerRecentGames recentForm={player.recent_form} />
          )}

          {player.next_game && (
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Next Game
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xl font-bold text-blue-900">
                    vs {player.next_game.opponent}
                  </div>
                  {player.next_game.date && formatDate(player.next_game.date, "EEEE, MMM d 'at' HH:mm") && (
                    <div className="text-sm text-gray-600">
                      {formatDate(player.next_game.date, "EEEE, MMM d 'at' HH:mm")}
                    </div>
                  )}
                  {player.next_game.location && (
                    <div className="text-sm text-gray-600">{player.next_game.location}</div>
                  )}
                  {player.next_game.predicted_performance && (
                    <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                      <div className="text-sm font-semibold text-blue-900 mb-1">
                        <Zap className="w-4 h-4 inline mr-1" />
                        Predicted Performance
                      </div>
                      <div className="text-sm text-gray-700">{player.next_game.predicted_performance}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {player.strengths && player.strengths.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  Strengths
                </h3>
                <div className="space-y-2">
                  {player.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                      <span className="text-sm text-gray-700">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {player.weaknesses && player.weaknesses.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <ThumbsDown className="w-5 h-5 text-red-600" />
                  Weaknesses
                </h3>
                <div className="space-y-2">
                  {player.weaknesses.map((weakness, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                      <span className="text-sm text-gray-700">{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {player.career_highlights && player.career_highlights.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Career Highlights
              </h3>
              <div className="flex flex-wrap gap-2">
                {player.career_highlights.map((highlight, idx) => (
                  <Badge key={idx} className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
