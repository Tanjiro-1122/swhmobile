import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

export default function PlayerRecentGames({ recentForm, sport }) {
  if (!recentForm || recentForm.length === 0) return null;

  const sportLower = sport?.toLowerCase() || '';

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "MMM d");
    } catch {
      return dateString;
    }
  };

  const getGameStats = (game) => {
    // BASEBALL STATS
    if (sportLower.includes('baseball') || sportLower.includes('mlb')) {
      const stats = [];
      if (game.hits !== undefined) stats.push(`${game.hits} H`);
      if (game.runs !== undefined) stats.push(`${game.runs} R`);
      if (game.rbis !== undefined) stats.push(`${game.rbis} RBI`);
      if (game.home_runs !== undefined && game.home_runs > 0) stats.push(`${game.home_runs} HR`);
      return stats.length > 0 ? stats.join(', ') : 'N/A';
    }

    // BASKETBALL STATS
    if (sportLower.includes('basketball') || sportLower.includes('nba')) {
      const stats = [];
      if (game.points !== undefined) stats.push(`${game.points} PTS`);
      if (game.rebounds !== undefined) stats.push(`${game.rebounds} REB`);
      if (game.assists !== undefined) stats.push(`${game.assists} AST`);
      return stats.length > 0 ? stats.join(', ') : 'N/A';
    }

    // FOOTBALL STATS
    if (sportLower.includes('football') || sportLower.includes('nfl')) {
      const stats = [];
      if (game.passing_yards !== undefined) stats.push(`${game.passing_yards} Pass Yds`);
      if (game.passing_touchdowns !== undefined) stats.push(`${game.passing_touchdowns} Pass TD`);
      if (game.rushing_yards !== undefined) stats.push(`${game.rushing_yards} Rush Yds`);
      if (game.rushing_touchdowns !== undefined) stats.push(`${game.rushing_touchdowns} Rush TD`);
      if (game.receiving_yards !== undefined) stats.push(`${game.receiving_yards} Rec Yds`);
      if (game.receiving_touchdowns !== undefined) stats.push(`${game.receiving_touchdowns} Rec TD`);
      if (game.receptions !== undefined) stats.push(`${game.receptions} Rec`);
      if (game.interceptions !== undefined) stats.push(`${game.interceptions} INT`);
      return stats.length > 0 ? stats.join(', ') : 'N/A';
    }

    // SOCCER STATS
    if (sportLower.includes('soccer') || (sportLower.includes('football') && !sportLower.includes('american'))) {
      const stats = [];
      if (game.goals !== undefined) stats.push(`${game.goals} Goals`);
      if (game.assists !== undefined) stats.push(`${game.assists} Assists`);
      return stats.length > 0 ? stats.join(', ') : 'N/A';
    }

    return 'N/A';
  };

  const getPerformanceColor = (rating) => {
    if (!rating) return 'text-gray-600';
    const r = rating.toLowerCase();
    if (r.includes('excellent') || r.includes('hot') || r.includes('great')) return 'text-green-600';
    if (r.includes('good') || r.includes('solid') || r.includes('above')) return 'text-blue-600';
    if (r.includes('poor') || r.includes('cold') || r.includes('below')) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPerformanceIcon = (rating) => {
    if (!rating) return null;
    const r = rating.toLowerCase();
    if (r.includes('excellent') || r.includes('hot') || r.includes('great') || r.includes('above')) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    if (r.includes('poor') || r.includes('cold') || r.includes('below')) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  return (
    <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-purple-600" />
          Recent Games ({recentForm.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentForm.map((game, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-purple-200 hover:border-purple-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-bold text-gray-900">vs {game.opponent}</div>
                <div className="text-sm text-gray-600">{formatDate(game.date)}</div>
              </div>
              {game.performance_rating && (
                <div className="flex items-center gap-1">
                  {getPerformanceIcon(game.performance_rating)}
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPerformanceColor(game.performance_rating)}`}
                  >
                    {game.performance_rating}
                  </Badge>
                </div>
              )}
            </div>
            <div className="text-sm font-semibold text-purple-900">
              {getGameStats(game)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}