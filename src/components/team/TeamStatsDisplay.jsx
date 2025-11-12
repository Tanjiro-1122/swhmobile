import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, TrendingUp, TrendingDown, AlertCircle, Activity, 
  Target, Award, Calendar, Trash2, Users, Shield 
} from "lucide-react";
import { motion } from "framer-motion";

export default function TeamStatsDisplay({ team, onDelete }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getResultBadge = (result) => {
    if (result?.includes('W')) return 'default';
    if (result?.includes('L')) return 'destructive';
    return 'secondary';
  };

  const getConfidenceColor = (confidence) => {
    const lowerConfidence = confidence?.toLowerCase() || '';
    if (lowerConfidence.includes('high')) return 'text-green-600 bg-green-50 border-green-200';
    if (lowerConfidence.includes('medium')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getOutcomeIcon = (outcome) => {
    const lowerOutcome = outcome?.toLowerCase() || '';
    if (lowerOutcome.includes('win')) return '✅';
    if (lowerOutcome.includes('loss')) return '❌';
    return '🤝';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8" />
                <div>
                  <CardTitle className="text-3xl font-black">{team.team_name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-white/20 text-white border-white/30">
                      {team.sport}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {team.league}
                    </Badge>
                    {team.form && (
                      <Badge className="bg-white/20 text-white border-white/30 font-mono">
                        {team.form}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(team.id)}
                className="text-white hover:bg-white/20"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Current Record */}
          {team.current_record && (
            <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Current Record
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-lg border border-blue-200 text-center">
                  <div className="text-2xl font-black text-green-600">{team.current_record.wins}</div>
                  <div className="text-xs text-gray-600 font-semibold">Wins</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200 text-center">
                  <div className="text-2xl font-black text-red-600">{team.current_record.losses}</div>
                  <div className="text-xs text-gray-600 font-semibold">Losses</div>
                </div>
                {team.current_record.draws !== undefined && team.current_record.draws > 0 && (
                  <div className="bg-white p-3 rounded-lg border border-blue-200 text-center">
                    <div className="text-2xl font-black text-gray-600">{team.current_record.draws}</div>
                    <div className="text-xs text-gray-600 font-semibold">Draws</div>
                  </div>
                )}
                {team.current_record.win_percentage !== undefined && (
                  <div className="bg-white p-3 rounded-lg border border-blue-200 text-center">
                    <div className="text-2xl font-black text-blue-600">
                      {(team.current_record.win_percentage * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 font-semibold">Win %</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Season Averages */}
          {team.season_averages && Object.keys(team.season_averages).length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Season Averages
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {team.season_averages.points_per_game && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-2xl font-black text-blue-600">{team.season_averages.points_per_game}</div>
                    <div className="text-xs text-gray-600 font-semibold">PPG</div>
                  </div>
                )}
                {team.season_averages.points_allowed_per_game && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="text-2xl font-black text-red-600">{team.season_averages.points_allowed_per_game}</div>
                    <div className="text-xs text-gray-600 font-semibold">PPG Allowed</div>
                  </div>
                )}
                {team.season_averages.goals_per_game && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="text-2xl font-black text-green-600">{team.season_averages.goals_per_game}</div>
                    <div className="text-xs text-gray-600 font-semibold">Goals/Game</div>
                  </div>
                )}
                {team.season_averages.field_goal_percentage && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div className="text-2xl font-black text-purple-600">
                      {(team.season_averages.field_goal_percentage * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 font-semibold">FG%</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last 5 Games */}
          {team.last_five_games && team.last_five_games.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Last {team.last_five_games.length} Games
              </h3>
              <div className="space-y-2">
                {team.last_five_games.map((game, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={getResultBadge(game.result)}>
                          {game.result}
                        </Badge>
                        <span className="text-sm text-gray-600">{formatDate(game.date)}</span>
                        <span className="text-sm font-semibold text-gray-900">vs {game.opponent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {game.score}
                        </Badge>
                        {game.home_away && (
                          <Badge variant="secondary" className="text-xs">
                            {game.home_away}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Game Prediction - ENHANCED */}
          {team.next_game && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-300">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Next Game Prediction
              </h3>
              <div className="space-y-4">
                {/* Game Details */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">vs</div>
                    <div className="text-xl font-bold text-gray-900">{team.next_game.opponent}</div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-orange-600 text-white mb-1">{team.next_game.date}</Badge>
                    {team.next_game.location && (
                      <div className="text-xs text-gray-600">{team.next_game.location}</div>
                    )}
                  </div>
                </div>

                {/* Prediction Box */}
                <div className="bg-white p-5 rounded-lg border-2 border-orange-300 shadow-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-4xl">{getOutcomeIcon(team.next_game.predicted_outcome)}</div>
                    <div>
                      <div className="text-2xl font-black text-orange-600">
                        {team.next_game.predicted_outcome || 'Win'}
                      </div>
                      {team.next_game.predicted_score && (
                        <div className="text-lg font-bold text-gray-700">
                          Predicted Score: {team.next_game.predicted_score}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confidence Badge */}
                  {team.next_game.confidence && (
                    <div className="mb-3">
                      <Badge className={`${getConfidenceColor(team.next_game.confidence)} border-2 px-3 py-1`}>
                        {team.next_game.confidence} Confidence
                      </Badge>
                    </div>
                  )}

                  {/* Reasoning */}
                  {team.next_game.reasoning && (
                    <div className="text-sm text-gray-700 leading-relaxed">
                      <div className="font-semibold text-gray-900 mb-1">Analysis:</div>
                      {team.next_game.reasoning}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Key Players */}
          {team.key_players && team.key_players.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Key Players
              </h3>
              <div className="flex flex-wrap gap-2">
                {team.key_players.map((player, idx) => (
                  <Badge key={idx} className="bg-purple-100 text-purple-800 border-purple-300 px-3 py-1">
                    {player}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Injuries */}
          {team.injuries && team.injuries.length > 0 && (
            <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
              <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Injury Report
              </h3>
              <div className="space-y-2">
                {team.injuries.map((injury, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900">{injury.player_name}</div>
                      <Badge variant="destructive">{injury.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{injury.injury}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-4">
            {team.strengths && team.strengths.length > 0 && (
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {team.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-800">• {strength}</li>
                  ))}
                </ul>
              </div>
            )}
            {team.weaknesses && team.weaknesses.length > 0 && (
              <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Weaknesses
                </h4>
                <ul className="space-y-1">
                  {team.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-red-800">• {weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}