import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, RefreshCw, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function LiveOdds() {
  const [selectedSport, setSelectedSport] = useState("NBA");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveOdds = async (sport) => {
    setIsRefreshing(true);
    try {
      // Using AI to fetch odds from multiple sportsbooks
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Fetch CURRENT, LIVE betting odds for upcoming ${sport} games TODAY (${new Date().toLocaleDateString()}).

MANDATORY SOURCES - USE THESE EXACT WEBSITES:
1. DraftKings.com - Search: "${sport} odds today"
2. FanDuel.com - Search: "${sport} betting lines"  
3. BetMGM.com - Search: "${sport} spreads"
4. ESPN.com - Verify game schedules

REQUIREMENTS:
- Get odds for NEXT 5 UPCOMING GAMES only
- Must be games in the next 24-48 hours
- Include EXACT game start time
- Fetch from at least 2 different sportsbooks for comparison

For EACH game return:
- Home Team (official name)
- Away Team (official name)
- Game Start Time (exact date/time in EST)
- Venue

ODDS (from DraftKings, FanDuel, BetMGM):
- Moneyline: Home (-150) vs Away (+130)
- Spread: Home -5.5 (-110) vs Away +5.5 (-110)
- Over/Under: Total 225.5 (Over -110, Under -110)

BEST BETS ANALYSIS:
For each game, analyze:
- Which sportsbook has best value
- Line movement (if odds changed recently)
- Public betting percentage
- Sharp money indicators
- Recommended bet with reasoning

Return LIVE, VERIFIED odds from actual sportsbooks. Do NOT make up odds.
If you cannot find current odds, state: "No live odds available for [sport] today"`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sport: { type: "string" },
            last_updated: { type: "string" },
            games: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  game_id: { type: "string" },
                  home_team: { type: "string" },
                  away_team: { type: "string" },
                  start_time: { type: "string" },
                  venue: { type: "string" },
                  odds: {
                    type: "object",
                    properties: {
                      draftkings: {
                        type: "object",
                        properties: {
                          moneyline_home: { type: "string" },
                          moneyline_away: { type: "string" },
                          spread_home: { type: "string" },
                          spread_away: { type: "string" },
                          total: { type: "string" },
                          over: { type: "string" },
                          under: { type: "string" }
                        }
                      },
                      fanduel: {
                        type: "object",
                        properties: {
                          moneyline_home: { type: "string" },
                          moneyline_away: { type: "string" },
                          spread_home: { type: "string" },
                          spread_away: { type: "string" },
                          total: { type: "string" },
                          over: { type: "string" },
                          under: { type: "string" }
                        }
                      },
                      betmgm: {
                        type: "object",
                        properties: {
                          moneyline_home: { type: "string" },
                          moneyline_away: { type: "string" },
                          spread_home: { type: "string" },
                          spread_away: { type: "string" },
                          total: { type: "string" },
                          over: { type: "string" },
                          under: { type: "string" }
                        }
                      }
                    }
                  },
                  best_bets: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        bet_type: { type: "string" },
                        recommendation: { type: "string" },
                        sportsbook: { type: "string" },
                        odds: { type: "string" },
                        reasoning: { type: "string" },
                        confidence: { type: "string" }
                      }
                    }
                  }
                },
                required: ["home_team", "away_team", "start_time", "odds"]
              }
            }
          },
          required: ["sport", "last_updated", "games"]
        }
      });

      return result;
    } catch (error) {
      console.error("Error fetching odds:", error);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  const { data: oddsData, refetch } = useQuery({
    queryKey: ['liveOdds', selectedSport],
    queryFn: () => fetchLiveOdds(selectedSport),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Live Odds</h1>
                <p className="text-gray-600">Real-time odds from top sportsbooks</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Odds
            </Button>
          </div>

          {oddsData?.last_updated && (
            <div className="text-sm text-gray-500">
              Last updated: {new Date(oddsData.last_updated).toLocaleString()}
            </div>
          )}
        </div>

        {/* Sport Tabs */}
        <Tabs value={selectedSport} onValueChange={setSelectedSport} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="NBA">🏀 NBA</TabsTrigger>
            <TabsTrigger value="NFL">🏈 NFL</TabsTrigger>
            <TabsTrigger value="MLB">⚾ MLB</TabsTrigger>
            <TabsTrigger value="NHL">🏒 NHL</TabsTrigger>
            <TabsTrigger value="Soccer">⚽ Soccer</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isRefreshing && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Fetching live odds from sportsbooks...</p>
          </div>
        )}

        {/* Odds Display */}
        {!isRefreshing && oddsData?.games && oddsData.games.length > 0 && (
          <div className="space-y-6">
            {oddsData.games.map((game, index) => (
              <motion.div
                key={game.game_id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 border-green-200">
                  <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {game.away_team} @ {game.home_team}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(game.start_time).toLocaleString()} • {game.venue}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Odds Comparison */}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      {/* DraftKings */}
                      {game.odds.draftkings && (
                        <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                          <div className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            DraftKings
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Moneyline:</span>
                              <span className="font-bold">
                                {game.odds.draftkings.moneyline_home} / {game.odds.draftkings.moneyline_away}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Spread:</span>
                              <span className="font-bold">
                                {game.odds.draftkings.spread_home} / {game.odds.draftkings.spread_away}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-bold">
                                {game.odds.draftkings.total} (O: {game.odds.draftkings.over} U: {game.odds.draftkings.under})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FanDuel */}
                      {game.odds.fanduel && (
                        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                          <div className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            FanDuel
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Moneyline:</span>
                              <span className="font-bold">
                                {game.odds.fanduel.moneyline_home} / {game.odds.fanduel.moneyline_away}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Spread:</span>
                              <span className="font-bold">
                                {game.odds.fanduel.spread_home} / {game.odds.fanduel.spread_away}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-bold">
                                {game.odds.fanduel.total} (O: {game.odds.fanduel.over} U: {game.odds.fanduel.under})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* BetMGM */}
                      {game.odds.betmgm && (
                        <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                          <div className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            BetMGM
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Moneyline:</span>
                              <span className="font-bold">
                                {game.odds.betmgm.moneyline_home} / {game.odds.betmgm.moneyline_away}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Spread:</span>
                              <span className="font-bold">
                                {game.odds.betmgm.spread_home} / {game.odds.betmgm.spread_away}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-bold">
                                {game.odds.betmgm.total} (O: {game.odds.betmgm.over} U: {game.odds.betmgm.under})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Best Bets */}
                    {game.best_bets && game.best_bets.length > 0 && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                        <div className="font-bold text-green-800 mb-3 flex items-center gap-2">
                          💎 Best Bets
                        </div>
                        <div className="space-y-3">
                          {game.best_bets.map((bet, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3 border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <Badge className="bg-green-600 text-white">
                                  {bet.bet_type}
                                </Badge>
                                <Badge variant="outline" className="font-bold">
                                  {bet.sportsbook} {bet.odds}
                                </Badge>
                                <Badge className={
                                  bet.confidence === 'High' ? 'bg-green-100 text-green-800' :
                                  bet.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {bet.confidence} Confidence
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-700 mb-1 font-semibold">
                                {bet.recommendation}
                              </div>
                              <div className="text-xs text-gray-600">
                                {bet.reasoning}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Games State */}
        {!isRefreshing && (!oddsData?.games || oddsData.games.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Live Games</h3>
              <p className="text-gray-600">
                No upcoming {selectedSport} games found. Try refreshing or select another sport.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Banner */}
        <Card className="mt-8 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">ℹ️</div>
              <div>
                <h4 className="font-bold text-blue-900 mb-2">How This Works</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Odds are fetched in real-time from DraftKings, FanDuel, and BetMGM</li>
                  <li>• Data updates every 5 minutes automatically</li>
                  <li>• Compare odds across sportsbooks to find best value</li>
                  <li>• "Best Bets" analyzes line movement and sharp money</li>
                  <li>• Always verify odds on sportsbook before placing bets</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}