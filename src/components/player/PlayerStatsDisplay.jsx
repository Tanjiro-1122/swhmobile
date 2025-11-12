import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, TrendingUp, TrendingDown, AlertCircle, Activity, 
  Target, Award, Calendar, Trash2, CheckCircle, XCircle 
} from "lucide-react";
import { motion } from "framer-motion";

export default function PlayerStatsDisplay({ player, onDelete }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPerformanceColor = (rating) => {
    const lowerRating = rating?.toLowerCase() || '';
    if (lowerRating.includes('excellent')) return 'text-green-600 bg-green-50';
    if (lowerRating.includes('good')) return 'text-blue-600 bg-blue-50';
    if (lowerRating.includes('poor')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const isBasketball = player.sport?.toLowerCase().includes('basketball') || player.sport?.toLowerCase().includes('nba');
  const isBaseball = player.sport?.toLowerCase().includes('baseball') || player.sport?.toLowerCase().includes('mlb');
  const isSoccer = player.sport?.toLowerCase().includes('soccer') || player.sport?.toLowerCase().includes('football') && !player.sport?.toLowerCase().includes('american');
  const isFootball = player.sport?.toLowerCase().includes('nfl') || (player.sport?.toLowerCase().includes('football') && player.sport?.toLowerCase().includes('american'));

  const renderBasketballStats = (game, index) => (
    <tr key={index} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-gray-700">{formatDate(game.date)}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{game.opponent}</td>
      <td className="py-3 px-4">
        <Badge variant={game.result?.includes('W') ? 'default' : 'destructive'} className="text-xs">
          {game.result}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm font-bold text-purple-600">{game.points || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{game.rebounds || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{game.assists || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{game.steals || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{game.blocks || '-'}</td>
      <td className="py-3 px-4 text-sm font-semibold text-blue-600">{game.three_pointers_made || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {game.field_goals_made && game.field_goals_attempted 
          ? `${game.field_goals_made}/${game.field_goals_attempted}` 
          : '-'}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {game.free_throws_made && game.free_throws_attempted 
          ? `${game.free_throws_made}/${game.free_throws_attempted}` 
          : '-'}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">{game.minutes_played || '-'}</td>
    </tr>
  );

  const renderBaseballBatterStats = (game, index) => (
    <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-gray-700">{formatDate(game.date)}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{game.opponent}</td>
      <td className="py-3 px-4">
        <Badge variant={game.result?.includes('W') ? 'default' : 'destructive'} className="text-xs">
          {game.result}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm font-bold text-blue-600">{game.hits || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{game.at_bats || '-'}</td>
      <td className="py-3 px-4 text-sm font-bold text-orange-600">{game.home_runs || '-'}</td>
      <td className="py-3 px-4 text-sm font-semibold text-green-600">{game.rbis || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{game.stolen_bases || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {game.hits && game.at_bats && game.at_bats > 0 
          ? (game.hits / game.at_bats).toFixed(3) 
          : '-'}
      </td>
    </tr>
  );

  const renderBaseballPitcherStats = (game, index) => (
    <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-gray-700">{formatDate(game.date)}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{game.opponent}</td>
      <td className="py-3 px-4">
        <Badge variant={game.result?.includes('W') ? 'default' : 'destructive'} className="text-xs">
          {game.result}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm font-bold text-blue-600">{game.innings_pitched || '-'}</td>
      <td className="py-3 px-4 text-sm font-semibold text-purple-600">{game.strikeouts || '-'}</td>
      <td className="py-3 px-4 text-sm text-red-600">{game.earned_runs || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{game.hits || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {game.innings_pitched && game.earned_runs 
          ? ((game.earned_runs / game.innings_pitched) * 9).toFixed(2) 
          : '-'}
      </td>
    </tr>
  );

  const renderSoccerStats = (game, index) => (
    <tr key={index} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-gray-700">{formatDate(game.date)}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{game.opponent}</td>
      <td className="py-3 px-4">
        <Badge variant={game.result?.includes('W') ? 'default' : 'destructive'} className="text-xs">
          {game.result}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm font-bold text-green-600">{game.goals || '-'}</td>
      <td className="py-3 px-4 text-sm font-semibold text-blue-600">{game.assists || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{game.shots_on_target || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{game.key_passes || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{game.tackles || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{game.minutes_played || '-'}</td>
    </tr>
  );

  const renderFootballQBStats = (game, index) => (
    <tr key={index} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-gray-700">{formatDate(game.date)}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{game.opponent}</td>
      <td className="py-3 px-4">
        <Badge variant={game.result?.includes('W') ? 'default' : 'destructive'} className="text-xs">
          {game.result}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm font-bold text-blue-600">{game.passing_yards || '-'}</td>
      <td className="py-3 px-4 text-sm font-semibold text-green-600">{game.passing_touchdowns || '-'}</td>
      <td className="py-3 px-4 text-sm text-red-600">{game.interceptions_thrown || '-'}</td>
      <td className="py-3 px-4 text-sm text-purple-600">{game.rushing_yards || '-'}</td>
    </tr>
  );

  const renderFootballSkillStats = (game, index) => (
    <tr key={index} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-gray-700">{formatDate(game.date)}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{game.opponent}</td>
      <td className="py-3 px-4">
        <Badge variant={game.result?.includes('W') ? 'default' : 'destructive'} className="text-xs">
          {game.result}
        </Badge>
      </td>
      {player.position?.toLowerCase().includes('rb') || player.position?.toLowerCase().includes('running') ? (
        <>
          <td className="py-3 px-4 text-sm font-bold text-orange-600">{game.rushing_yards || '-'}</td>
          <td className="py-3 px-4 text-sm font-semibold text-green-600">{game.rushing_touchdowns || '-'}</td>
          <td className="py-3 px-4 text-sm text-gray-700">{game.receptions || '-'}</td>
          <td className="py-3 px-4 text-sm text-blue-600">{game.receiving_yards || '-'}</td>
        </>
      ) : (
        <>
          <td className="py-3 px-4 text-sm font-bold text-blue-600">{game.receptions || '-'}</td>
          <td className="py-3 px-4 text-sm font-semibold text-purple-600">{game.receiving_yards || '-'}</td>
          <td className="py-3 px-4 text-sm text-green-600">{game.receiving_touchdowns || '-'}</td>
        </>
      )}
    </tr>
  );

  const renderStatsTable = () => {
    if (!player.recent_form || player.recent_form.length === 0) {
      return <p className="text-gray-500 text-center py-4">No recent game data available</p>;
    }

    if (isBasketball) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-100 border-b-2 border-purple-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">Date</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">Opponent</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">Result</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">PTS</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">REB</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">AST</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">STL</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">BLK</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">3PM</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">FG</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">FT</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-purple-900 uppercase">MIN</th>
              </tr>
            </thead>
            <tbody>
              {player.recent_form.map((game, index) => renderBasketballStats(game, index))}
            </tbody>
          </table>
        </div>
      );
    }

    if (isBaseball) {
      const isPitcher = player.position?.toLowerCase().includes('pitcher') || 
                       player.position?.toLowerCase() === 'p' ||
                       player.season_averages?.era !== undefined;
      
      if (isPitcher) {
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-100 border-b-2 border-blue-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">Opponent</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">Result</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">IP</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">K</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">ER</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">H</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">ERA</th>
                </tr>
              </thead>
              <tbody>
                {player.recent_form.map((game, index) => renderBaseballPitcherStats(game, index))}
              </tbody>
            </table>
          </div>
        );
      } else {
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-100 border-b-2 border-blue-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">Opponent</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">Result</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">H</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">AB</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">HR</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">RBI</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">SB</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-blue-900 uppercase">AVG</th>
                </tr>
              </thead>
              <tbody>
                {player.recent_form.map((game, index) => renderBaseballBatterStats(game, index))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    if (isSoccer) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-100 border-b-2 border-green-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-bold text-green-900 uppercase">Date</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-green-900 uppercase">Opponent</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-green-900 uppercase">Result</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-green-900 uppercase">Goals</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-green-900 uppercase">Assists</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-green-900 uppercase">Shots</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-green-900 uppercase">Passes</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-green-900 uppercase">Tackles</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-green-900 uppercase">MIN</th>
              </tr>
            </thead>
            <tbody>
              {player.recent_form.map((game, index) => renderSoccerStats(game, index))}
            </tbody>
          </table>
        </div>
      );
    }

    if (isFootball) {
      const isQB = player.position?.toLowerCase().includes('qb') || player.position?.toLowerCase().includes('quarterback');
      
      if (isQB) {
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-100 border-b-2 border-orange-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Opponent</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Result</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Pass YDS</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Pass TD</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">INT</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Rush YDS</th>
                </tr>
              </thead>
              <tbody>
                {player.recent_form.map((game, index) => renderFootballQBStats(game, index))}
              </tbody>
            </table>
          </div>
        );
      } else {
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-100 border-b-2 border-orange-300">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Opponent</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Result</th>
                  {player.position?.toLowerCase().includes('rb') || player.position?.toLowerCase().includes('running') ? (
                    <>
                      <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Rush YDS</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Rush TD</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">REC</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Rec YDS</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">REC</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Rec YDS</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-orange-900 uppercase">Rec TD</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {player.recent_form.map((game, index) => renderFootballSkillStats(game, index))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    return <p className="text-gray-500 text-center py-4">Sport not recognized for detailed stats</p>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8" />
                <div>
                  <CardTitle className="text-3xl font-black">{player.player_name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-white/20 text-white border-white/30">
                      {player.team}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {player.position}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {player.league}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(player.id)}
                className="text-white hover:bg-white/20"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Injury Status */}
          {player.injury_status && (
            <div className={`p-4 rounded-xl border-2 ${
              player.injury_status.toLowerCase() === 'healthy' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {player.injury_status.toLowerCase() === 'healthy' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-bold ${
                  player.injury_status.toLowerCase() === 'healthy' 
                    ? 'text-green-900' 
                    : 'text-red-900'
                }`}>
                  Injury Status: {player.injury_status}
                </span>
              </div>
            </div>
          )}

          {/* Season Averages */}
          {player.season_averages && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Season Averages
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {isBasketball && (
                  <>
                    {player.season_averages.points_per_game && (
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="text-2xl font-black text-purple-600">{player.season_averages.points_per_game}</div>
                        <div className="text-xs text-gray-600 font-semibold">PPG</div>
                      </div>
                    )}
                    {player.season_averages.rebounds_per_game && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-2xl font-black text-blue-600">{player.season_averages.rebounds_per_game}</div>
                        <div className="text-xs text-gray-600 font-semibold">RPG</div>
                      </div>
                    )}
                    {player.season_averages.assists_per_game && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-2xl font-black text-green-600">{player.season_averages.assists_per_game}</div>
                        <div className="text-xs text-gray-600 font-semibold">APG</div>
                      </div>
                    )}
                    {player.season_averages.three_pointers_made_per_game && (
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <div className="text-2xl font-black text-orange-600">{player.season_averages.three_pointers_made_per_game}</div>
                        <div className="text-xs text-gray-600 font-semibold">3PM/G</div>
                      </div>
                    )}
                    {player.season_averages.field_goal_percentage && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-2xl font-black text-gray-700">{(player.season_averages.field_goal_percentage * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-600 font-semibold">FG%</div>
                      </div>
                    )}
                    {player.season_averages.three_point_percentage && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-2xl font-black text-gray-700">{(player.season_averages.three_point_percentage * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-600 font-semibold">3P%</div>
                      </div>
                    )}
                  </>
                )}
                {/* Add similar sections for other sports */}
              </div>
            </div>
          )}

          {/* Last 5 Games - Detailed Stats Table */}
          {player.recent_form && player.recent_form.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Last {player.recent_form.length} Games (Detailed Stats)
              </h3>
              <Card className="border-2 border-gray-200">
                <CardContent className="p-0">
                  {renderStatsTable()}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Next Game Prediction */}
          {player.next_game && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-300">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Next Game Prediction
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-semibold">vs {player.next_game.opponent}</span>
                  <Badge className="bg-orange-600 text-white">{player.next_game.date}</Badge>
                </div>
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <div className="text-2xl font-black text-orange-600 mb-2">
                    {player.next_game.predicted_performance}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${
                      player.next_game.confidence?.toLowerCase().includes('high')
                        ? 'bg-green-100 text-green-800'
                        : player.next_game.confidence?.toLowerCase().includes('medium')
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {player.next_game.confidence} Confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{player.next_game.reasoning}</p>
                </div>
              </div>
            </div>
          )}

          {/* Betting Insights */}
          {player.betting_insights && (
            <div className="grid grid-cols-2 gap-4">
              {player.betting_insights.hot_streak !== undefined && (
                <div className={`p-4 rounded-xl border-2 ${
                  player.betting_insights.hot_streak 
                    ? 'bg-red-50 border-red-300' 
                    : 'bg-blue-50 border-blue-300'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {player.betting_insights.hot_streak ? (
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-blue-600" />
                    )}
                    <span className="font-bold text-gray-900">
                      {player.betting_insights.hot_streak ? '🔥 Hot Streak' : '❄️ Cold Streak'}
                    </span>
                  </div>
                </div>
              )}
              {player.betting_insights.consistency_rating && (
                <div className="p-4 rounded-xl border-2 bg-purple-50 border-purple-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-5 h-5 text-purple-600" />
                    <span className="font-bold text-gray-900">Consistency</span>
                  </div>
                  <div className="text-sm text-purple-700 font-semibold">
                    {player.betting_insights.consistency_rating}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-4">
            {player.strengths && player.strengths.length > 0 && (
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {player.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-800">• {strength}</li>
                  ))}
                </ul>
              </div>
            )}
            {player.weaknesses && player.weaknesses.length > 0 && (
              <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Weaknesses
                </h4>
                <ul className="space-y-1">
                  {player.weaknesses.map((weakness, idx) => (
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