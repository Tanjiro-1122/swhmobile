
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Target, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function PlayerStatsCard({ players, sport }) {
  if (!players || players.length === 0) return null;

  const getStatIcon = (stat) => {
    const icons = {
      points: Target,
      goals: Target,
      assists: Activity,
      rebounds: TrendingUp
    };
    return icons[stat] || Target;
  };

  const getPlayerStats = (player) => {
    const stats = [];
    
    // Calculate combined stat for basketball
    let combinedStat = null;
    const points = player.predicted_points || 0;
    const rebounds = player.predicted_rebounds || 0;
    const assists = player.predicted_assists || 0;
    
    // Only add combined stat if at least one component exists and it's for basketball
    // The current implementation applies this if any component exists, regardless of 'sport' prop.
    // If 'sport' prop is to be explicitly checked, it would be added here: `if (sport === 'basketball' && (points || rebounds || assists))`
    if (points || rebounds || assists) {
      combinedStat = points + rebounds + assists;
    }
    
    if (player.predicted_points) {
      stats.push({ label: "Points", value: player.predicted_points, icon: "points" });
    }
    if (player.predicted_goals) {
      stats.push({ label: "Goals", value: player.predicted_goals, icon: "goals" });
    }
    if (player.predicted_assists) {
      stats.push({ label: "Assists", value: player.predicted_assists, icon: "assists" });
    }
    if (player.predicted_rebounds) {
      stats.push({ label: "Rebounds", value: player.predicted_rebounds, icon: "rebounds" });
    }
    if (combinedStat !== null) { // Check against null to handle cases where sum might be 0 but still relevant
      stats.push({ label: "PTS+REB+AST", value: combinedStat.toFixed(1), icon: "points", highlight: true });
    }
    if (player.probability_to_score) {
      stats.push({ label: "Score Chance", value: `${player.probability_to_score}%`, icon: "points" });
    }
    
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
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {player.team}
                    </Badge>
                    {player.position && (
                      <Badge variant="outline" className="text-xs">
                        {player.position}
                      </Badge>
                    )}
                  </div>
                </div>
                {player.recent_form && (
                  <Badge 
                    className={`
                      ${player.recent_form.toLowerCase().includes('excellent') || player.recent_form.toLowerCase().includes('hot') 
                        ? 'bg-green-100 text-green-800' 
                        : player.recent_form.toLowerCase().includes('good') 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'}
                    `}
                  >
                    {player.recent_form}
                  </Badge>
                )}
              </div>

              {player.injury_status && player.injury_status !== "Healthy" && (
                <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  ⚠️ {player.injury_status}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, idx) => {
                  const Icon = getStatIcon(stat.icon);
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2 rounded p-2 ${
                        stat.highlight 
                          ? 'bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 col-span-2' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${stat.highlight ? 'text-orange-600' : 'text-purple-600'}`} />
                      <div>
                        <div className={`text-xs ${stat.highlight ? 'font-bold text-orange-900' : 'text-gray-600'}`}>
                          {stat.label}
                        </div>
                        <div className={`font-bold ${stat.highlight ? 'text-xl text-orange-600' : 'text-gray-900'}`}>
                          {stat.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
