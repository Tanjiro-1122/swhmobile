import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function PlayerRecentGames({ recentForm }) {
  if (!recentForm || recentForm.length === 0) return null;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, "MMM d");
    } catch (error) {
      return null;
    }
  };

  const getPerformanceColor = (rating) => {
    const r = rating?.toLowerCase() || '';
    if (r.includes('excellent') || r.includes('hot') || r.includes('great')) {
      return "bg-green-100 text-green-800 border-green-300";
    } else if (r.includes('good') || r.includes('solid')) {
      return "bg-blue-100 text-blue-800 border-blue-300";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Determine sport from available stats
  const getSportFromGame = (game) => {
    if (game.passing_yards || game.rushing_yards || game.receiving_yards) return 'football';
    if (game.points && game.rebounds) return 'basketball';
    if (game.goals !== undefined) return 'soccer';
    return 'unknown';
  };

  const sport = recentForm.length > 0 ? getSportFromGame(recentForm[0]) : 'unknown';

  return (
    <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Recent Games ({recentForm.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentForm.map((game, idx) => {
          const formattedDate = formatDate(game.date);
          const gameSport = getSportFromGame(game);
          
          return (
            <div key={idx} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg">vs {game.opponent}</div>
                  {formattedDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formattedDate}
                    </div>
                  )}
                </div>
                {game.performance_rating && (
                  <Badge className={getPerformanceColor(game.performance_rating)}>
                    {game.performance_rating}
                  </Badge>
                )}
              </div>

              {/* Football Stats */}
              {gameSport === 'football' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-200">
                  {game.passing_yards && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Pass Yds</div>
                      <div className="font-semibold text-indigo-900">{game.passing_yards}</div>
                    </div>
                  )}
                  {game.passing_touchdowns !== undefined && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Pass TDs</div>
                      <div className="font-semibold text-indigo-900">{game.passing_touchdowns}</div>
                    </div>
                  )}
                  {game.interceptions !== undefined && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">INTs</div>
                      <div className="font-semibold text-red-600">{game.interceptions}</div>
                    </div>
                  )}
                  {game.rushing_yards && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Rush Yds</div>
                      <div className="font-semibold text-indigo-900">{game.rushing_yards}</div>
                    </div>
                  )}
                  {game.rushing_touchdowns !== undefined && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Rush TDs</div>
                      <div className="font-semibold text-indigo-900">{game.rushing_touchdowns}</div>
                    </div>
                  )}
                  {game.receptions && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Rec</div>
                      <div className="font-semibold text-indigo-900">{game.receptions}</div>
                    </div>
                  )}
                  {game.receiving_yards && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Rec Yds</div>
                      <div className="font-semibold text-indigo-900">{game.receiving_yards}</div>
                    </div>
                  )}
                  {game.receiving_touchdowns !== undefined && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Rec TDs</div>
                      <div className="font-semibold text-indigo-900">{game.receiving_touchdowns}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Basketball Stats */}
              {gameSport === 'basketball' && (
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200">
                  {game.points !== undefined && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Points</div>
                      <div className="font-semibold text-indigo-900">{game.points}</div>
                    </div>
                  )}
                  {game.rebounds !== undefined && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Rebounds</div>
                      <div className="font-semibold text-indigo-900">{game.rebounds}</div>
                    </div>
                  )}
                  {game.assists !== undefined && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Assists</div>
                      <div className="font-semibold text-indigo-900">{game.assists}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Soccer Stats */}
              {gameSport === 'soccer' && (
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                  {game.goals !== undefined && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Goals</div>
                      <div className="font-semibold text-indigo-900">{game.goals}</div>
                    </div>
                  )}
                  {game.assists !== undefined && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Assists</div>
                      <div className="font-semibold text-indigo-900">{game.assists}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}