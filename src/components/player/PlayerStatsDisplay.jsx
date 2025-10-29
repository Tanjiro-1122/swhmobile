import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, Target, Calendar, AlertCircle, Trophy, Zap, Star } from "lucide-react";
import { motion } from "framer-motion";
import PlayerRecentGames from "./PlayerRecentGames";

export default function PlayerStatsDisplay({ player, onDelete }) {
  const getStatsBySport = () => {
    const sport = player.sport?.toLowerCase() || '';
    const stats = [];

    // Basketball Stats
    if (sport.includes('basketball') || sport.includes('nba')) {
      if (player.season_averages?.points_per_game) {
        stats.push({ label: "PPG", value: player.season_averages.points_per_game.toFixed(1), icon: Target, color: "text-blue-600" });
      }
      if (player.season_averages?.rebounds_per_game) {
        stats.push({ label: "RPG", value: player.season_averages.rebounds_per_game.toFixed(1), icon: TrendingUp, color: "text-green-600" });
      }
      if (player.season_averages?.assists_per_game) {
        stats.push({ label: "APG", value: player.season_averages.assists_per_game.toFixed(1), icon: Zap, color: "text-purple-600" });
      }
      
      // Combined stat (PTS+REB+AST)
      const pts = player.season_averages?.points_per_game || 0;
      const reb = player.season_averages?.rebounds_per_game || 0;
      const ast = player.season_averages?.assists_per_game || 0;
      if (pts || reb || ast) {
        stats.push({ 
          label: "PTS+REB+AST", 
          value: (pts + reb + ast).toFixed(1), 
          icon: Trophy, 
          color: "text-orange-600",
          highlight: true 
        });
      }

      if (player.season_averages?.field_goal_percentage) {
        stats.push({ label: "FG%", value: `${(player.season_averages.field_goal_percentage * 100).toFixed(1)}%`, color: "text-gray-600" });
      }
      if (player.season_averages?.three_point_percentage) {
        stats.push({ label: "3P%", value: `${(player.season_averages.three_point_percentage * 100).toFixed(1)}%`, color: "text-indigo-600" });
      }
    }
    
    // Baseball Stats - Batters
    else if ((sport.includes('baseball') || sport.includes('mlb')) && player.season_averages?.batting_average) {
      if (player.season_averages.batting_average) {
        stats.push({ label: "AVG", value: player.season_averages.batting_average.toFixed(3), icon: Target, color: "text-blue-600" });
      }
      if (player.season_averages.home_runs) {
        stats.push({ label: "Home Runs", value: player.season_averages.home_runs, icon: Trophy, color: "text-orange-600", highlight: true });
      }
      if (player.season_averages.rbis) {
        stats.push({ label: "RBIs", value: player.season_averages.rbis, icon: TrendingUp, color: "text-green-600" });
      }
      if (player.season_averages.stolen_bases) {
        stats.push({ label: "Stolen Bases", value: player.season_averages.stolen_bases, icon: Zap, color: "text-purple-600" });
      }
    }
    
    // Baseball Stats - Pitchers
    else if ((sport.includes('baseball') || sport.includes('mlb')) && player.season_averages?.era) {
      if (player.season_averages.era) {
        stats.push({ label: "ERA", value: player.season_averages.era.toFixed(2), icon: Target, color: "text-blue-600", highlight: true });
      }
      if (player.season_averages.strikeouts) {
        stats.push({ label: "Strikeouts", value: player.season_averages.strikeouts, icon: Zap, color: "text-orange-600" });
      }
      if (player.season_averages.wins) {
        stats.push({ label: "Wins", value: player.season_averages.wins, icon: Trophy, color: "text-green-600" });
      }
      if (player.season_averages.saves) {
        stats.push({ label: "Saves", value: player.season_averages.saves, icon: Star, color: "text-purple-600" });
      }
    }
    
    // Soccer Stats
    else if (sport.includes('soccer') || (sport.includes('football') && !sport.includes('american'))) {
      if (player.season_averages?.goals_per_game) {
        stats.push({ label: "Goals/Game", value: player.season_averages.goals_per_game.toFixed(2), icon: Trophy, color: "text-orange-600", highlight: true });
      }
      if (player.season_averages?.assists_per_game) {
        stats.push({ label: "Assists/Game", value: player.season_averages.assists_per_game.toFixed(2), icon: Zap, color: "text-purple-600" });
      }
      if (player.season_averages?.shots_per_game) {
        stats.push({ label: "Shots/Game", value: player.season_averages.shots_per_game.toFixed(1), icon: Target, color: "text-blue-600" });
      }
      if (player.season_averages?.tackles_per_game) {
        stats.push({ label: "Tackles/Game", value: player.season_averages.tackles_per_game.toFixed(1), color: "text-green-600" });
      }
    }
    
    // American Football Stats
    else if (sport.includes('nfl') || sport.includes('american football')) {
      // QB Stats
      if (player.season_averages?.passing_yards_per_game) {
        stats.push({ label: "Pass Yds/G", value: player.season_averages.passing_yards_per_game.toFixed(1), icon: Target, color: "text-blue-600", highlight: true });
      }
      // RB Stats
      if (player.season_averages?.rushing_yards_per_game) {
        stats.push({ label: "Rush Yds/G", value: player.season_averages.rushing_yards_per_game.toFixed(1), icon: TrendingUp, color: "text-green-600", highlight: true });
      }
      // WR/TE Stats
      if (player.season_averages?.receptions_per_game) {
        stats.push({ label: "Rec/Game", value: player.season_averages.receptions_per_game.toFixed(1), icon: Zap, color: "text-purple-600" });
      }
    }

    return stats;
  };

  const stats = getStatsBySport();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-2 border-purple-200 bg-white hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-black mb-2">{player.player_name}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  {player.team}
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20">
                  {player.position}
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20">
                  {player.sport}
                </Badge>
                {player.league && (
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                    {player.league}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(player.id)}
              className="hover:bg-red-500/20 hover:text-red-200 text-white/80"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Injury Status */}
          {player.injury_status && player.injury_status !== "Healthy" && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <div className="font-bold text-amber-900">Injury Status</div>
                <div className="text-sm text-amber-800">{player.injury_status}</div>
              </div>
            </div>
          )}

          {/* Season Averages */}
          {stats.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                {new Date().getFullYear()} Season Averages
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stats.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div 
                      key={idx}
                      className={`rounded-lg p-4 ${
                        stat.highlight 
                          ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {Icon && <Icon className={`w-4 h-4 ${stat.color || 'text-gray-600'}`} />}
                        <div className={`text-xs font-semibold ${stat.highlight ? 'text-orange-900' : 'text-gray-600'}`}>
                          {stat.label}
                        </div>
                      </div>
                      <div className={`text-2xl font-black ${stat.highlight ? 'text-orange-600' : stat.color || 'text-gray-900'}`}>
                        {stat.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Form */}
          {player.recent_form && player.recent_form.length > 0 && (
            <PlayerRecentGames games={player.recent_form} sport={player.sport} />
          )}

          {/* Next Game Prediction */}
          {player.next_game && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-emerald-900">Next Game Prediction</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-700">Opponent:</span>
                  <span className="font-bold text-emerald-900">{player.next_game.opponent}</span>
                </div>
                
                {player.next_game.date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-700">Date:</span>
                    <span className="font-semibold text-emerald-900">{player.next_game.date}</span>
                  </div>
                )}

                {player.next_game.location && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-700">Location:</span>
                    <span className="font-semibold text-emerald-900">{player.next_game.location}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-emerald-200">
                  <div className="text-sm text-emerald-700 mb-2">Predicted Performance:</div>
                  <div className="text-xl font-black text-emerald-600 mb-3">
                    {player.next_game.predicted_performance}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={
                      player.next_game.confidence === 'High' ? 'bg-green-500' :
                      player.next_game.confidence === 'Medium' ? 'bg-yellow-500' :
                      'bg-orange-500'
                    }>
                      {player.next_game.confidence} Confidence
                    </Badge>
                  </div>

                  {player.next_game.reasoning && (
                    <div className="text-sm text-emerald-800 leading-relaxed">
                      {player.next_game.reasoning}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Betting Insights */}
          {player.betting_insights && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-900 mb-3">📊 Betting Insights</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {player.betting_insights.over_under_points && (
                  <div>
                    <span className="text-blue-600">O/U Line:</span>
                    <span className="ml-2 font-bold text-blue-900">{player.betting_insights.over_under_points}</span>
                  </div>
                )}
                {player.betting_insights.probability_to_score !== undefined && (
                  <div>
                    <span className="text-blue-600">Score Prob:</span>
                    <span className="ml-2 font-bold text-blue-900">{player.betting_insights.probability_to_score}%</span>
                  </div>
                )}
                {player.betting_insights.hot_streak !== undefined && (
                  <div>
                    <span className="text-blue-600">Hot Streak:</span>
                    <span className="ml-2 font-bold text-blue-900">{player.betting_insights.hot_streak ? '🔥 Yes' : 'No'}</span>
                  </div>
                )}
                {player.betting_insights.consistency_rating && (
                  <div>
                    <span className="text-blue-600">Consistency:</span>
                    <span className="ml-2 font-bold text-blue-900">{player.betting_insights.consistency_rating}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          {(player.strengths?.length > 0 || player.weaknesses?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {player.strengths?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-green-900 mb-2">✅ Strengths</h3>
                  <ul className="space-y-1">
                    {player.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                        <span>•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {player.weaknesses?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-red-900 mb-2">⚠️ Weaknesses</h3>
                  <ul className="space-y-1">
                    {player.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                        <span>•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}