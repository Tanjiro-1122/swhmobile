import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Target, Activity, Calendar, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function PlayerStatsCard({ players, sport }) {
  if (!players || players.length === 0) return null;

  const getStatIcon = (stat) => {
    const icons = {
      points: Target,
      goals: Target,
      assists: Activity,
      rebounds: TrendingUp,
      hits: Target,
      runs: Activity,
      rbis: TrendingUp
    };
    return icons[stat] || Target;
  };

  const getPlayerStats = (player) => {
    const stats = [];
    const playerSport = (player.sport || sport || '').toLowerCase();
    
    // BASEBALL STATS
    if (playerSport.includes('baseball') || playerSport.includes('mlb')) {
      if (player.predicted_hits !== undefined) {
        stats.push({ label: "Hits", value: player.predicted_hits.toFixed(1), icon: "hits", highlight: true });
      }
      if (player.predicted_runs !== undefined) {
        stats.push({ label: "Runs", value: player.predicted_runs.toFixed(1), icon: "runs" });
      }
      if (player.predicted_rbis !== undefined) {
        stats.push({ label: "RBIs", value: player.predicted_rbis.toFixed(1), icon: "rbis" });
      }
      if (player.predicted_home_runs !== undefined) {
        stats.push({ label: "Home Runs", value: player.predicted_home_runs.toFixed(1), icon: "points" });
      }
      return stats;
    }
    
    // BASKETBALL STATS
    if (playerSport.includes('basketball') || playerSport.includes('nba')) {
      const points = player.predicted_points || 0;
      const rebounds = player.predicted_rebounds || 0;
      const assists = player.predicted_assists || 0;
      const combinedStat = points + rebounds + assists;
      
      if (player.predicted_points !== undefined) {
        stats.push({ label: "Points", value: player.predicted_points.toFixed(1), icon: "points" });
      }
      if (player.predicted_assists !== undefined) {
        stats.push({ label: "Assists", value: player.predicted_assists.toFixed(1), icon: "assists" });
      }
      if (player.predicted_rebounds !== undefined) {
        stats.push({ label: "Rebounds", value: player.predicted_rebounds.toFixed(1), icon: "rebounds" });
      }
      if (combinedStat > 0) {
        stats.push({ label: "PTS+REB+AST", value: combinedStat.toFixed(1), icon: "points", highlight: true });
      }
      return stats;
    }
    
    // FOOTBALL STATS (NFL)
    if (playerSport.includes('football') || playerSport.includes('nfl')) {
      if (player.predicted_passing_yards !== undefined) {
        stats.push({ label: "Pass Yds", value: player.predicted_passing_yards.toFixed(0), icon: "points", highlight: true });
      }
      if (player.predicted_passing_touchdowns !== undefined) {
        stats.push({ label: "Pass TDs", value: player.predicted_passing_touchdowns.toFixed(1), icon: "points" });
      }
      if (player.predicted_rushing_yards !== undefined) {
        stats.push({ label: "Rush Yds", value: player.predicted_rushing_yards.toFixed(0), icon: "runs", highlight: true });
      }
      if (player.predicted_receiving_yards !== undefined) {
        stats.push({ label: "Rec Yds", value: player.predicted_receiving_yards.toFixed(0), icon: "runs", highlight: true });
      }
      if (player.predicted_receptions !== undefined) {
        stats.push({ label: "Receptions", value: player.predicted_receptions.toFixed(1), icon: "assists" });
      }
      return stats;
    }
    
    // SOCCER STATS
    if (playerSport.includes('soccer') || playerSport.includes('football')) {
      if (player.predicted_goals !== undefined) {
        stats.push({ label: "Goals", value: player.predicted_goals.toFixed(2), icon: "goals", highlight: true });
      }
      if (player.predicted_assists !== undefined) {
        stats.push({ label: "Assists", value: player.predicted_assists.toFixed(2), icon: "assists" });
      }
      return stats;
    }
    
    // FALLBACK
    if (player.predicted_points !== undefined) stats.push({ label: "Points", value: player.predicted_points.toFixed(1), icon: "points" });
    if (player.predicted_goals !== undefined) stats.push({ label: "Goals", value: player.predicted_goals.toFixed(2), icon: "goals" });
    if (player.predicted_assists !== undefined) stats.push({ label: "Assists", value: player.predicted_assists.toFixed(1), icon: "assists" });
    
    return stats;
  };

  return (
    <Card className="border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-purple-600" />
          Key Players & Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {players.map((player, index) => {
          const stats = getPlayerStats(player);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-900">{player.name}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {player.team}
                    </Badge>
                    {player.position && (
                      <Badge variant="outline" className="text-xs">
                        {player.position}
                      </Badge>
                    )}
                  </div>
                  {player.season_average && (
                    <p className="text-xs text-gray-600 mt-1">
                      Season: {player.season_average}
                    </p>
                  )}
                </div>
                {player.recent_form && (
                  <Badge 
                    className={`
                      ${player.recent_form === 'Hot' 
                        ? 'bg-red-100 text-red-800 border-red-300' 
                        : player.recent_form === 'Cold'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-gray-100 text-gray-800 border-gray-300'}
                    `}
                  >
                    {player.recent_form === 'Hot' && '🔥 '}
                    {player.recent_form === 'Cold' && '❄️ '}
                    {player.recent_form}
                  </Badge>
                )}
              </div>

              {/* Injury Status */}
              {player.injury_status && player.injury_status !== "Healthy" && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-red-900">{player.injury_status}</div>
                      {player.injury_details && (
                        <div className="text-xs text-red-800 mt-0.5">{player.injury_details}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Last 5 Games */}
              {player.last_five_games && player.last_five_games.length > 0 && (
                <div className="mb-3 bg-gray-50 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-gray-700">Last 5 Games</span>
                  </div>
                  <div className="space-y-1">
                    {player.last_five_games.slice(0, 5).map((game, idx) => (
                      <div key={idx} className="text-xs flex justify-between items-center">
                        <span className="text-gray-600">
                          {game.date} vs {game.opponent}
                        </span>
                        <span className="font-semibold text-gray-900">{game.stats}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Predicted Stats */}
              {stats.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-bold text-purple-900 mb-2">📊 Predicted Performance</div>
                  <div className="grid grid-cols-2 gap-2">
                    {stats.map((stat, idx) => {
                      const Icon = getStatIcon(stat.icon);
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-2 rounded p-2 ${
                            stat.highlight 
                              ? 'bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300' 
                              : 'bg-purple-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${stat.highlight ? 'text-orange-600' : 'text-purple-600'}`} />
                          <div>
                            <div className={`text-xs ${stat.highlight ? 'font-bold text-orange-900' : 'text-gray-600'}`}>
                              {stat.label}
                            </div>
                            <div className={`font-bold ${stat.highlight ? 'text-xl text-orange-600' : 'text-lg text-purple-900'}`}>
                              {stat.value}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Over/Under & Probabilities */}
              {(player.over_under_line || player.probability_to_score) && (
                <div className="bg-green-50 rounded p-3 border border-green-200">
                  <div className="text-xs font-bold text-green-900 mb-2">💰 Betting Lines</div>
                  <div className="space-y-1.5">
                    {player.over_under_line && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-700">Over/Under:</span>
                        <span className="font-bold text-green-900">{player.over_under_line}</span>
                      </div>
                    )}
                    {player.over_probability && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-700">Over Probability:</span>
                        <span className="font-bold text-green-900">{player.over_probability}%</span>
                      </div>
                    )}
                    {player.under_probability && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-700">Under Probability:</span>
                        <span className="font-bold text-green-900">{player.under_probability}%</span>
                      </div>
                    )}
                    {player.probability_to_score && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-700">Score Probability:</span>
                        <span className="font-bold text-green-900">{player.probability_to_score}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}