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
  Users,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function TeamStatsDisplay({ team, onDelete, index }) {
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

  const getResultBadge = (result) => {
    if (result.toUpperCase().includes('W')) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">W</Badge>;
    } else if (result.toUpperCase().includes('L')) {
      return <Badge className="bg-red-100 text-red-800 border-red-300">L</Badge>;
    } else if (result.toUpperCase().includes('D')) {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-300">D</Badge>;
    }
    return <Badge variant="outline">{result}</Badge>;
  };

  const renderSeasonAverages = () => {
    if (!team.season_averages) return null;
    
    const stats = [];
    const averages = team.season_averages;
    
    if (averages.points_per_game) stats.push({ label: "PPG", value: averages.points_per_game.toFixed(1) });
    if (averages.points_allowed_per_game) stats.push({ label: "Opp PPG", value: averages.points_allowed_per_game.toFixed(1) });
    if (averages.goals_per_game) stats.push({ label: "Goals/Game", value: averages.goals_per_game.toFixed(1) });
    if (averages.goals_allowed_per_game) stats.push({ label: "Goals Allowed", value: averages.goals_allowed_per_game.toFixed(1) });
    if (averages.possession_percentage) stats.push({ label: "Possession %", value: `${averages.possession_percentage.toFixed(1)}%` });
    if (averages.shots_per_game) stats.push({ label: "Shots/Game", value: averages.shots_per_game.toFixed(1) });
    if (averages.field_goal_percentage) stats.push({ label: "FG%", value: `${averages.field_goal_percentage.toFixed(1)}%` });
    if (averages.three_point_percentage) stats.push({ label: "3P%", value: `${averages.three_point_percentage.toFixed(1)}%` });
    if (averages.assists_per_game) stats.push({ label: "Assists/Game", value: averages.assists_per_game.toFixed(1) });
    if (averages.rebounds_per_game) stats.push({ label: "Rebounds/Game", value: averages.rebounds_per_game.toFixed(1) });
    
    return stats;
  };

  const seasonStats = renderSeasonAverages();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-green-100">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">{team.team_name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/20 text-white border-white/30">
                  {team.sport}
                </Badge>
                {team.league && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {team.league}
                  </Badge>
                )}
                {team.form && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    Form: {team.form}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(team.id)}
              className="hover:bg-white/20 text-white"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
          {team.current_record && (
            <div className="flex items-center gap-4 text-white/90">
              <span className="text-lg">
                Record: {team.current_record.wins}W - {team.current_record.losses}L
                {team.current_record.draws ? ` - ${team.current_record.draws}D` : ''}
              </span>
              {team.current_record.win_percentage && (
                <span className="text-lg">
                  ({team.current_record.win_percentage.toFixed(1)}%)
                </span>
              )}
            </div>
          )}
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Season Averages */}
          {seasonStats && seasonStats.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Season Averages
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {seasonStats.map((stat, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                    <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
                    <div className="text-2xl font-bold text-green-900">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last 5 Games */}
          {team.last_five_games && team.last_five_games.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Last 5 Games
              </h3>
              <div className="space-y-3">
                {team.last_five_games.map((game, idx) => {
                  const formattedDate = formatDate(game.date, "MMM d, yyyy");
                  return (
                    <div key={idx} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          {getResultBadge(game.result)}
                          <div>
                            <div className="font-bold text-lg">{game.score}</div>
                            <div className="text-sm text-gray-600">
                              {game.home_away === 'home' ? 'vs' : '@'} {game.opponent}
                            </div>
                            {formattedDate && (
                              <div className="text-xs text-gray-500">{formattedDate}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      {game.key_stats && Object.keys(game.key_stats).length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-200">
                          {Object.entries(game.key_stats).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <div className="text-xs text-gray-500">{key}</div>
                              <div className="font-semibold">{value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Players */}
          {team.key_players && team.key_players.length > 0 && (
            <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                  Key Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {team.key_players.map((player, idx) => (
                    <Badge key={idx} className="bg-white text-purple-700 border-purple-200">
                      {player}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Injuries */}
          {team.injuries && team.injuries.length > 0 && (
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-amber-900">Injury Report</h3>
              </div>
              <div className="space-y-2">
                {team.injuries.map((injury, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white rounded p-2">
                    <span className="font-medium">{injury.player_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{injury.injury}</span>
                      <Badge variant="outline" className="text-xs">{injury.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Game */}
          {team.next_game && (
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
                    vs {team.next_game.opponent}
                  </div>
                  {team.next_game.date && formatDate(team.next_game.date, "EEEE, MMM d 'at' HH:mm") && (
                    <div className="text-sm text-gray-600">
                      {formatDate(team.next_game.date, "EEEE, MMM d 'at' HH:mm")}
                    </div>
                  )}
                  {team.next_game.location && (
                    <div className="text-sm text-gray-600">{team.next_game.location}</div>
                  )}
                  {team.next_game.prediction && (
                    <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                      <div className="text-sm font-semibold text-blue-900 mb-1">
                        <Zap className="w-4 h-4 inline mr-1" />
                        Prediction
                      </div>
                      <div className="text-sm text-gray-700">{team.next_game.prediction}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-4">
            {team.strengths && team.strengths.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  Strengths
                </h3>
                <div className="space-y-2">
                  {team.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                      <span className="text-sm text-gray-700">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {team.weaknesses && team.weaknesses.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <ThumbsDown className="w-5 h-5 text-red-600" />
                  Weaknesses
                </h3>
                <div className="space-y-2">
                  {team.weaknesses.map((weakness, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                      <span className="text-sm text-gray-700">{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}