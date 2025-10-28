import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, RefreshCw, AlertCircle, BarChart3, Trophy, Clock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function LiveOdds() {
  const [selectedSport, setSelectedSport] = useState("basketball_nba");

  const sports = [
    { id: "basketball_nba", name: "NBA", icon: "🏀" },
    { id: "americanfootball_nfl", name: "NFL", icon: "🏈" },
    { id: "soccer_epl", name: "Premier League", icon: "⚽" },
    { id: "baseball_mlb", name: "MLB", icon: "⚾" },
    { id: "icehockey_nhl", name: "NHL", icon: "🏒" },
  ];

  const { data: oddsData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['liveOdds', selectedSport],
    queryFn: async () => {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a sports odds data collector. Fetch LIVE, REAL-TIME betting odds for upcoming ${sports.find(s => s.id === selectedSport)?.name} games.

TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

CRITICAL DATA SOURCES:
1. DraftKings Sportsbook (draftkings.com/sportsbook)
2. FanDuel Sportsbook (fanduel.com/sportsbook)
3. BetMGM (betmgm.com)
4. Caesars Sportsbook (caesars.com/sportsbook)
5. OddsChecker (oddschecker.com) - for comparison

SEARCH QUERY:
"${sports.find(s => s.id === selectedSport)?.name} betting odds today ${new Date().toLocaleDateString()}"

REQUIRED: Find at least 5-10 upcoming games with odds from multiple bookmakers.

For each game, provide:

1. MATCH DETAILS:
   - home_team: Full official team name
   - away_team: Full official team name
   - commence_time: Game start time in ISO format
   - sport_key: "${selectedSport}"

2. BETTING MARKETS (from EACH bookmaker when available):
   
   a) MONEYLINE (who will win):
      - home_ml: e.g., "-150" (negative = favorite)
      - away_ml: e.g., "+130" (positive = underdog)
   
   b) SPREAD (point spread):
      - home_spread: e.g., "-7.5"
      - home_spread_price: e.g., "-110"
      - away_spread: e.g., "+7.5"
      - away_spread_price: e.g., "-110"
   
   c) TOTALS (over/under):
      - total_line: e.g., "225.5"
      - over_price: e.g., "-110"
      - under_price: e.g., "-110"

3. BOOKMAKERS (provide odds from AT LEAST 3 bookmakers):
   Each bookmaker should have: name, moneyline, spread, totals

VALIDATION:
✓ All games must be UPCOMING (not completed)
✓ Start times must be in the future
✓ Odds must be current (search for "today" or "this week")
✓ Team names must match official league names
✓ At least 3 bookmakers per game

IMPORTANT: If no games are scheduled today for ${sports.find(s => s.id === selectedSport)?.name}, return games for the NEXT available game day and specify the date clearly.

Return structured data with ALL fields populated.`,
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
                    id: { type: "string" },
                    home_team: { type: "string" },
                    away_team: { type: "string" },
                    commence_time: { type: "string" },
                    sport_key: { type: "string" },
                    bookmakers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          moneyline: {
                            type: "object",
                            properties: {
                              home: { type: "string" },
                              away: { type: "string" }
                            }
                          },
                          spread: {
                            type: "object",
                            properties: {
                              home_line: { type: "string" },
                              home_price: { type: "string" },
                              away_line: { type: "string" },
                              away_price: { type: "string" }
                            }
                          },
                          totals: {
                            type: "object",
                            properties: {
                              line: { type: "string" },
                              over_price: { type: "string" },
                              under_price: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });

        console.log("✅ Live Odds Data:", result);
        return result;
      } catch (err) {
        console.error("❌ Failed to fetch odds:", err);
        throw new Error("Failed to load live odds. Please try again.");
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const formatOdds = (odds) => {
    if (!odds) return "N/A";
    const numOdds = parseInt(odds);
    return numOdds > 0 ? `+${odds}` : odds;
  };

  const getOddsColor = (odds) => {
    if (!odds) return "text-slate-400";
    const numOdds = parseInt(odds);
    if (numOdds < 0) return "text-green-400"; // Favorite
    return "text-blue-400"; // Underdog
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Live Odds</h1>
                <p className="text-slate-400 text-sm sm:text-base">Compare real-time betting lines</p>
              </div>
            </div>
            
            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 w-full sm:w-auto"
            >
              {isFetching ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Odds
                </>
              )}
            </Button>
          </div>

          {/* Sport Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {sports.map((sport) => (
              <motion.button
                key={sport.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedSport(sport.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedSport === sport.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="text-xl">{sport.icon}</span>
                {sport.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 border-4 border-green-500 border-t-transparent rounded-full"
              />
              <p className="text-white text-lg font-semibold">Loading live odds...</p>
              <p className="text-slate-400 text-sm mt-2">Fetching data from multiple sportsbooks</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-red-300">
              {error.message || "Failed to load odds. Please try again."}
            </AlertDescription>
          </Alert>
        )}

        {/* Games Display */}
        {!isLoading && !error && oddsData?.games && oddsData.games.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-slate-400 text-sm">
                <Clock className="w-4 h-4 inline mr-1" />
                Last updated: {oddsData.last_updated ? format(new Date(oddsData.last_updated), 'MMM d, HH:mm') : 'Just now'}
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {oddsData.games.length} Games
              </Badge>
            </div>

            {oddsData.games.map((game, index) => (
              <motion.div
                key={game.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/90 border-slate-700 hover:border-green-500/50 transition-all">
                  <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-5 h-5 text-green-400" />
                          <CardTitle className="text-white text-lg">{game.away_team} @ {game.home_team}</CardTitle>
                        </div>
                        {game.commence_time && (
                          <div className="text-sm text-slate-400">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {format(new Date(game.commence_time), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6">
                    {game.bookmakers && game.bookmakers.length > 0 ? (
                      <Tabs defaultValue={game.bookmakers[0].name} className="w-full">
                        <TabsList className="w-full grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 bg-slate-900/50 p-1">
                          {game.bookmakers.map((bookmaker) => (
                            <TabsTrigger
                              key={bookmaker.name}
                              value={bookmaker.name}
                              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs sm:text-sm"
                            >
                              {bookmaker.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {game.bookmakers.map((bookmaker) => (
                          <TabsContent key={bookmaker.name} value={bookmaker.name} className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Moneyline */}
                              {bookmaker.moneyline && (
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                  <div className="flex items-center gap-2 mb-3">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                    <h4 className="font-bold text-white">Moneyline</h4>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-300 text-sm">{game.away_team}</span>
                                      <span className={`font-bold text-lg ${getOddsColor(bookmaker.moneyline.away)}`}>
                                        {formatOdds(bookmaker.moneyline.away)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-300 text-sm">{game.home_team}</span>
                                      <span className={`font-bold text-lg ${getOddsColor(bookmaker.moneyline.home)}`}>
                                        {formatOdds(bookmaker.moneyline.home)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Spread */}
                              {bookmaker.spread && (
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                  <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-4 h-4 text-blue-400" />
                                    <h4 className="font-bold text-white">Spread</h4>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-300 text-sm">{game.away_team}</span>
                                      <div className="text-right">
                                        <div className="font-bold text-blue-400">{bookmaker.spread.away_line}</div>
                                        <div className="text-xs text-slate-400">{formatOdds(bookmaker.spread.away_price)}</div>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-300 text-sm">{game.home_team}</span>
                                      <div className="text-right">
                                        <div className="font-bold text-blue-400">{bookmaker.spread.home_line}</div>
                                        <div className="text-xs text-slate-400">{formatOdds(bookmaker.spread.home_price)}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Totals */}
                              {bookmaker.totals && (
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                  <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 className="w-4 h-4 text-purple-400" />
                                    <h4 className="font-bold text-white">Total</h4>
                                  </div>
                                  <div className="text-center mb-3">
                                    <div className="text-2xl font-bold text-purple-400">{bookmaker.totals.line}</div>
                                    <div className="text-xs text-slate-400">Points</div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-2 bg-slate-800 rounded">
                                      <div className="text-xs text-slate-400 mb-1">Over</div>
                                      <div className="font-bold text-purple-400">{formatOdds(bookmaker.totals.over_price)}</div>
                                    </div>
                                    <div className="text-center p-2 bg-slate-800 rounded">
                                      <div className="text-xs text-slate-400 mb-1">Under</div>
                                      <div className="font-bold text-purple-400">{formatOdds(bookmaker.totals.under_price)}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        No odds available for this game yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!oddsData || !oddsData.games || oddsData.games.length === 0) && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-bold text-white mb-2">No Live Odds Available</h3>
              <p className="text-slate-400 mb-6">
                No upcoming games found for {sports.find(s => s.id === selectedSport)?.name}. Try another sport or check back later.
              </p>
              <Button onClick={() => refetch()} className="bg-green-600 hover:bg-green-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <AlertDescription className="text-amber-300 text-sm">
              <strong>Important:</strong> Odds can change rapidly. Always verify odds directly with your sportsbook before placing any bets. We are not responsible for any discrepancies.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </div>
  );
}