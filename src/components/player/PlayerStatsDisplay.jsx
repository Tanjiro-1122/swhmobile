
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Added Alert and AlertDescription
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
  Flame,
  DollarSign
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
      hits: Target,
      runs: Activity,
      rbis: TrendingUp,
      "home runs": Target,
      "stolen bases": Activity,
      "batting average": Target,
      "pass yds": Target,
      "pass tds": Target,
      "rush yds": Activity,
      "rush tds": Target,
      "rec yds": Activity,
      "rec tds": Target,
      carries: Activity,
      receptions: Activity,
      interceptions: AlertCircle,
      "comp %": Target,
      "3p%": Target,
      "fg%": Target,
      steals: Zap,
      blocks: TrendingUp,
      minutes: Calendar,
      combined: TrendingUp
    };

    for (const key in icons) {
      if (label.toLowerCase().includes(key)) {
        return icons[key];
      }
    }
    return Activity;
  };

  const getSimplifiedPrediction = () => {
    const sport = player.sport?.toLowerCase() || '';
    const position = player.position?.toLowerCase() || '';
    const averages = player.season_averages;

    if (!averages) return null;

    // BASEBALL PREDICTIONS
    if (sport.includes('baseball') || sport.includes('mlb')) {
      const predictions = [];
      if (averages.hits_per_game) predictions.push(`${averages.hits_per_game.toFixed(1)} hits`);
      if (averages.runs_per_game) predictions.push(`${averages.runs_per_game.toFixed(1)} runs`);
      if (averages.rbis_per_game) predictions.push(`${averages.rbis_per_game.toFixed(1)} RBIs`);
      if (averages.home_runs_per_game && averages.home_runs_per_game > 0.1) {
        predictions.push(`${averages.home_runs_per_game.toFixed(1)} home runs`);
      }

      if (predictions.length > 0) {
        return `This player per historical data will score ${predictions.join(', ')} per game`;
      }
    }

    // BASKETBALL PREDICTIONS
    if (sport.includes('basketball') || sport.includes('nba')) {
      const predictions = [];
      if (averages.points_per_game) predictions.push(`${averages.points_per_game.toFixed(1)} points`);
      if (averages.rebounds_per_game) predictions.push(`${averages.rebounds_per_game.toFixed(1)} rebounds`);
      if (averages.assists_per_game) predictions.push(`${averages.assists_per_game.toFixed(1)} assists`);

      if (predictions.length > 0) {
        return `This player per historical data will score ${predictions.join(', ')} per game`;
      }
    }

    // FOOTBALL PREDICTIONS - QUARTERBACK
    if ((sport.includes('football') || sport.includes('nfl')) && (position.includes('qb') || position.includes('quarterback'))) {
      const predictions = [];
      if (averages.passing_yards_per_game) predictions.push(`${averages.passing_yards_per_game.toFixed(0)} passing yards`);
      if (averages.passing_touchdowns_per_game) predictions.push(`${averages.passing_touchdowns_per_game.toFixed(1)} passing touchdowns`);
      if (averages.interceptions_per_game) predictions.push(`${averages.interceptions_per_game.toFixed(1)} interceptions`);

      if (predictions.length > 0) {
        return `This quarterback per historical data will throw for ${predictions.join(', ')} per game`;
      }
    }

    // FOOTBALL PREDICTIONS - RUNNING BACK
    if ((sport.includes('football') || sport.includes('nfl')) && (position.includes('rb') || position.includes('running'))) {
      const predictions = [];
      if (averages.rushing_yards_per_game) predictions.push(`${averages.rushing_yards_per_game.toFixed(0)} rushing yards`);
      if (averages.rushing_touchdowns_per_game) predictions.push(`${averages.rushing_touchdowns_per_game.toFixed(1)} rushing touchdowns`);
      if (averages.receptions_per_game) predictions.push(`${averages.receptions_per_game.toFixed(1)} receptions`);

      if (predictions.length > 0) {
        return `This running back per historical data will rush for ${predictions.join(', ')} per game`;
      }
    }

    // FOOTBALL PREDICTIONS - WIDE RECEIVER / TIGHT END
    if ((sport.includes('football') || sport.includes('nfl')) && (position.includes('wr') || position.includes('te') || position.includes('receiver') || position.includes('tight'))) {
      const predictions = [];
      if (averages.receptions_per_game) predictions.push(`${averages.receptions_per_game.toFixed(1)} receptions`);
      if (averages.receiving_yards_per_game) predictions.push(`${averages.receiving_yards_per_game.toFixed(0)} receiving yards`);
      if (averages.receiving_touchdowns_per_game) predictions.push(`${averages.receiving_touchdowns_per_game.toFixed(1)} touchdowns`);

      if (predictions.length > 0) {
        return `This receiver per historical data will catch ${predictions.join(', ')} per game`;
      }
    }

    // SOCCER PREDICTIONS
    if (sport.includes('soccer') || (sport.includes('football') && !sport.includes('american'))) {
      const predictions = [];
      if (averages.goals_per_game) predictions.push(`${averages.goals_per_game.toFixed(1)} goals`);
      if (averages.assists_per_game) predictions.push(`${averages.assists_per_game.toFixed(1)} assists`);
      if (averages.shots_per_game) predictions.push(`${averages.shots_per_game.toFixed(1)} shots`);

      if (predictions.length > 0) {
        return `This player per historical data will score ${predictions.join(', ')} per game`;
      }
    }

    return null;
  };

  const renderSeasonAverages = () => {
    if (!player.season_averages) return null;

    const stats = [];
    const averages = player.season_averages;
    const sport = player.sport?.toLowerCase() || '';
    const position = player.position?.toLowerCase() || '';

    // BASEBALL STATS
    if (sport.includes('baseball') || sport.includes('mlb')) {
      if (averages.batting_average) stats.push({ label: "Batting Avg", value: averages.batting_average.toFixed(3), key: "batting_average", highlight: true });
      if (averages.hits_per_game) stats.push({ label: "Hits/G", value: averages.hits_per_game.toFixed(2), key: "hits", highlight: true });
      if (averages.runs_per_game) stats.push({ label: "Runs/G", value: averages.runs_per_game.toFixed(2), key: "runs" });
      if (averages.rbis_per_game) stats.push({ label: "RBIs/G", value: averages.rbis_per_game.toFixed(2), key: "rbis", highlight: true });
      if (averages.home_runs_per_game) stats.push({ label: "HRs/G", value: averages.home_runs_per_game.toFixed(2), key: "home_runs" });
      if (averages.stolen_bases_per_game) stats.push({ label: "SBs/G", value: averages.stolen_bases_per_game.toFixed(2), key: "stolen_bases" });
      if (averages.on_base_percentage) stats.push({ label: "OBP", value: averages.on_base_percentage.toFixed(3), key: "obp" });
      if (averages.slugging_percentage) stats.push({ label: "SLG", value: averages.slugging_percentage.toFixed(3), key: "slg" });
      return stats;
    }

    // FOOTBALL STATS
    if (sport.includes('football') || sport.includes('nfl')) {
      // Quarterback Stats
      if (position.includes('qb') || position.includes('quarterback')) {
        if (averages.passing_yards_per_game) stats.push({ label: "Pass Yds/G", value: averages.passing_yards_per_game.toFixed(1), key: "pass_yds", highlight: true });
        if (averages.passing_touchdowns_per_game) stats.push({ label: "Pass TDs/G", value: averages.passing_touchdowns_per_game.toFixed(1), key: "pass_tds" });
        if (averages.interceptions_per_game) stats.push({ label: "INTs/G", value: averages.interceptions_per_game.toFixed(1), key: "ints" });
        if (averages.completion_percentage) stats.push({ label: "Comp %", value: `${averages.completion_percentage.toFixed(1)}%`, key: "comp" });
        if (averages.rushing_yards_per_game) stats.push({ label: "Rush Yds/G", value: averages.rushing_yards_per_game.toFixed(1), key: "rush_yds" });
      }
      // Running Back Stats
      else if (position.includes('rb') || position.includes('running')) {
        if (averages.rushing_yards_per_game) stats.push({ label: "Rush Yds/G", value: averages.rushing_yards_per_game.toFixed(1), key: "rush_yds", highlight: true });
        if (averages.rushing_touchdowns_per_game) stats.push({ label: "Rush TDs/G", value: averages.rushing_touchdowns_per_game.toFixed(1), key: "rush_tds" });
        if (averages.carries_per_game) stats.push({ label: "Carries/G", value: averages.carries_per_game.toFixed(1), key: "carries" });
        if (averages.yards_per_carry) stats.push({ label: "Yds/Carry", value: averages.yards_per_carry.toFixed(1), key: "ypc" });
        if (averages.receptions_per_game) stats.push({ label: "Rec/G", value: averages.receptions_per_game.toFixed(1), key: "rec" });
        if (averages.receiving_yards_per_game) stats.push({ label: "Rec Yds/G", value: averages.receiving_yards_per_game.toFixed(1), key: "rec_yds" });
      }
      // Wide Receiver / Tight End Stats
      else if (position.includes('wr') || position.includes('te') || position.includes('receiver') || position.includes('tight')) {
        if (averages.receptions_per_game) stats.push({ label: "Rec/G", value: averages.receptions_per_game.toFixed(1), key: "rec" });
        if (averages.receiving_yards_per_game) stats.push({ label: "Rec Yds/G", value: averages.receiving_yards_per_game.toFixed(1), key: "rec_yds", highlight: true });
        if (averages.receiving_touchdowns_per_game) stats.push({ label: "Rec TDs/G", value: averages.receiving_touchdowns_per_game.toFixed(1), key: "rec_tds" });
        if (averages.targets_per_game) stats.push({ label: "Targets/G", value: averages.targets_per_game.toFixed(1), key: "targets" });
        if (averages.yards_per_reception) stats.push({ label: "Yds/Rec", value: averages.yards_per_reception.toFixed(1), key: "ypr" });
      }
      return stats;
    }

    // BASKETBALL STATS
    if (sport.includes('basketball') || sport.includes('nba')) {
      const points = averages.points_per_game || 0;
      const rebounds = averages.rebounds_per_game || 0;
      const assists = averages.assists_per_game || 0;
      const combinedStat = points + rebounds + assists;

      if (averages.points_per_game) stats.push({ label: "Points/G", value: averages.points_per_game.toFixed(1), key: "points" });
      if (averages.assists_per_game) stats.push({ label: "Assists/G", value: averages.assists_per_game.toFixed(1), key: "assists" });
      if (averages.rebounds_per_game) stats.push({ label: "Rebounds/G", value: averages.rebounds_per_game.toFixed(1), key: "rebounds" });
      if (combinedStat) stats.push({ label: "PTS+REB+AST", value: combinedStat.toFixed(1), key: "combined", highlight: true });
      if (averages.steals_per_game) stats.push({ label: "Steals/G", value: averages.steals_per_game.toFixed(1), key: "steals" });
      if (averages.blocks_per_game) stats.push({ label: "Blocks/G", value: averages.blocks_per_game.toFixed(1), key: "blocks" });
      if (averages.field_goal_percentage) stats.push({ label: "FG%", value: `${averages.field_goal_percentage.toFixed(1)}%`, key: "fg" });
      if (averages.three_point_percentage) stats.push({ label: "3P%", value: `${averages.three_point_percentage.toFixed(1)}%`, key: "3p" });
      if (averages.minutes_per_game) stats.push({ label: "Minutes/G", value: averages.minutes_per_game.toFixed(1), key: "minutes" });
      return stats;
    }

    // SOCCER STATS
    if (sport.includes('soccer') || (sport.includes('football') && !sport.includes('american'))) {
      if (averages.goals_per_game) stats.push({ label: "Goals/G", value: averages.goals_per_game.toFixed(2), key: "goals", highlight: true });
      if (averages.shots_per_game) stats.push({ label: "Shots/G", value: averages.shots_per_game.toFixed(1), key: "shots" });
      if (averages.passes_per_game) stats.push({ label: "Passes/G", value: averages.passes_per_game.toFixed(1), key: "passes" });
      if (averages.tackles_per_game) stats.push({ label: "Tackles/G", value: averages.tackles_per_game.toFixed(1), key: "tackles" });
      return stats;
    }

    return stats;
  };

  const seasonStats = renderSeasonAverages();
  const sport = player.sport?.toLowerCase() || '';
  const simplifiedPrediction = getSimplifiedPrediction();

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
                {/* Starting Status Badge */}
                {player.is_starting !== undefined && (
                  <Badge className={`${
                    player.is_starting
                      ? 'bg-green-500 text-white border-green-400'
                      : 'bg-yellow-500 text-black border-yellow-400'
                  } font-bold`}>
                    {player.is_starting ? '⭐ STARTER' : '🔄 BACKUP'}
                  </Badge>
                )}
                {/* Depth Chart Position */}
                {player.depth_chart_position && (
                  <Badge className="bg-blue-500/30 text-white border-blue-400/50">
                    {player.depth_chart_position}
                  </Badge>
                )}
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
          {/* Starting Status Alert */}
          {player.is_starting === false && (
            <Alert className="bg-yellow-50 border-2 border-yellow-300">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 font-semibold">
                ⚠️ <strong>Not a Starter</strong> - This player is a backup/bench player. Playing time and stats may be limited.
              </AlertDescription>
            </Alert>
          )}

          {/* Simplified Prediction Summary */}
          {simplifiedPrediction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-100 mb-2">📊 SIMPLE PREDICTION</div>
                  <div className="text-xl font-bold leading-relaxed">
                    {simplifiedPrediction}
                  </div>
                  <div className="text-sm text-blue-100 mt-2">
                    ⚡ Based on {new Date().getFullYear()} season averages
                    {player.is_starting === false && " (As backup player)"}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
                Season Averages (2024-2025)
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
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Betting Insights & Props
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Baseball Betting Lines */}
                {sport.includes('baseball') || sport.includes('mlb') ? (
                  <>
                    {player.betting_insights.over_under_hits !== undefined && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700 font-semibold">Hits Over/Under:</span>
                          <span className="text-2xl font-bold text-green-600">
                            {player.betting_insights.over_under_hits}
                          </span>
                        </div>
                        {player.betting_insights.over_probability && (
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-gray-600">Over: <strong>{player.betting_insights.over_probability}%</strong></span>
                            <span className="text-gray-600">Under: <strong>{100 - player.betting_insights.over_probability}%</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                    {player.betting_insights.over_under_rbis !== undefined && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-semibold">RBIs Over/Under:</span>
                          <span className="text-xl font-bold text-green-600">
                            {player.betting_insights.over_under_rbis}
                          </span>
                        </div>
                      </div>
                    )}
                    {player.betting_insights.over_under_home_runs !== undefined && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-semibold">Home Runs Over/Under:</span>
                          <span className="text-xl font-bold text-green-600">
                            {player.betting_insights.over_under_home_runs}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}

                {/* Basketball Betting Lines */}
                {sport.includes('basketball') || sport.includes('nba') ? (
                  <>
                    {player.betting_insights.over_under_points && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700 font-semibold">Points Over/Under:</span>
                          <span className="text-2xl font-bold text-green-600">
                            {player.betting_insights.over_under_points}
                          </span>
                        </div>
                        {player.betting_insights.over_probability && (
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-gray-600">Over: <strong>{player.betting_insights.over_probability}%</strong></span>
                            <span className="text-gray-600">Under: <strong>{100 - player.betting_insights.over_probability}%</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : null}

                {/* Football Betting Lines */}
                {sport.includes('football') || sport.includes('nfl') ? (
                  <>
                    {player.betting_insights.over_under_yards && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700 font-semibold">Yards Over/Under:</span>
                          <span className="text-2xl font-bold text-green-600">
                            {player.betting_insights.over_under_yards}
                          </span>
                        </div>
                        {player.betting_insights.over_probability && (
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-gray-600">Over: <strong>{player.betting_insights.over_probability}%</strong></span>
                            <span className="text-gray-600">Under: <strong>{100 - player.betting_insights.over_probability}%</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                    {player.betting_insights.probability_to_score !== undefined && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-semibold">Probability to Score TD:</span>
                          <span className="text-2xl font-bold text-green-600">
                            {player.betting_insights.probability_to_score}%
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}

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

          {player.recent_form && player.recent_form.length > 0 && (
            <PlayerRecentGames recentForm={player.recent_form} sport={player.sport} />
          )}

          {player.next_game && (
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Next Game Prediction
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
