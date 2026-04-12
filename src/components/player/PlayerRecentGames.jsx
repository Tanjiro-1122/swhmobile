import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function PlayerRecentGames({ recentForm }) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, "MMM d, yyyy");
    } catch (_error) {
      return null;
    }
  };

  const getPerformanceBadge = (rating) => {
    if (!rating) return null;
    const ratingLower = rating.toLowerCase();
    if (ratingLower.includes("excellent")) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Excellent</Badge>;
    } else if (ratingLower.includes("good")) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Good</Badge>;
    } else if (ratingLower.includes("below")) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Below Avg</Badge>;
    }
    return <Badge variant="outline">{rating}</Badge>;
  };

  const getResultBadge = (score) => {
    if (!score) return null;
    const [teamScore, oppScore] = score.split('-').map(s => parseInt(s));
    if (teamScore > oppScore) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">W</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-300">L</Badge>;
    }
  };

  // Function to format stat labels nicely
  const formatStatLabel = (key) => {
    const labelMap = {
      'field_goal_percentage': 'FG%',
      'three_point_percentage': '3P%',
      'free_throw_percentage': 'FT%',
      'points': 'Points',
      'rebounds': 'Rebounds',
      'assists': 'Assists',
      'steals': 'Steals',
      'blocks': 'Blocks',
      'turnovers': 'Turnovers',
      'goals': 'Goals',
      'shots': 'Shots',
      'passes': 'Passes',
      'tackles': 'Tackles',
      'passing_yards': 'Pass Yds',
      'rushing_yards': 'Rush Yds',
      'receiving_yards': 'Rec Yds',
      'touchdowns': 'TDs',
      'interceptions': 'INTs',
      'receptions': 'Rec',
      'minutes': 'MIN',
      'field_goals_made': 'FGM',
      'field_goals_attempted': 'FGA',
      'three_pointers_made': '3PM',
      'three_pointers_attempted': '3PA'
    };

    // If we have a custom label, use it
    if (labelMap[key]) {
      return labelMap[key];
    }

    // Otherwise, convert snake_case to Title Case
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Extract main stats for display (points, rebounds, assists, goals, etc)
  const getMainStats = (game) => {
    const stats = [];
    if (game.points) stats.push({ label: 'PTS', value: game.points });
    if (game.rebounds) stats.push({ label: 'REB', value: game.rebounds });
    if (game.assists) stats.push({ label: 'AST', value: game.assists });
    if (game.goals) stats.push({ label: 'Goals', value: game.goals });
    if (game.passing_yards) stats.push({ label: 'Pass Yds', value: game.passing_yards });
    if (game.rushing_yards) stats.push({ label: 'Rush Yds', value: game.rushing_yards });
    return stats;
  };

  if (!recentForm || recentForm.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-blue-600" />
          Last {recentForm.length} Games
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentForm.map((game, idx) => {
          const mainStats = getMainStats(game);
          const formattedDate = formatDate(game.date);
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-lg p-4 border-2 border-blue-200 hover:border-blue-400 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg text-gray-900">
                    {game.score || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">
                    @ {game.opponent}
                  </div>
                  {formattedDate && (
                    <div className="text-xs text-gray-500">{formattedDate}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {game.score && getResultBadge(game.score)}
                  {game.performance_rating && getPerformanceBadge(game.performance_rating)}
                </div>
              </div>

              {/* Main Stats Row */}
              {mainStats.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {mainStats.map((stat, statIdx) => (
                    <div key={statIdx} className="text-center bg-blue-50 rounded p-2">
                      <div className="text-xs text-gray-600">{stat.label}</div>
                      <div className="text-lg font-bold text-blue-900">{stat.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional Stats (if any) */}
              {game.key_stats && Object.keys(game.key_stats).length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100">
                  {Object.entries(game.key_stats).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-xs text-gray-500">{formatStatLabel(key)}</div>
                      <div className="font-semibold text-gray-900">{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}