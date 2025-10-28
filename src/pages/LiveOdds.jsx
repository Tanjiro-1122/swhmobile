import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, RefreshCw, AlertCircle, BarChart3, Trophy, Clock, DollarSign, Info } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function LiveOdds() {
  const [selectedSport, setSelectedSport] = useState("basketball_nba");

  const sports = [
    { id: "basketball_nba", name: "NBA", icon: "🏀", search: "NBA" },
    { id: "americanfootball_nfl", name: "NFL", icon: "🏈", search: "NFL" },
    { id: "soccer_epl", name: "Premier League", icon: "⚽", search: "Premier League" },
    { id: "baseball_mlb", name: "MLB", icon: "⚾", search: "MLB" },
    { id: "icehockey_nhl", name: "NHL", icon: "🏒", search: "NHL" },
  ];

  const currentSport = sports.find(s => s.id === selectedSport);

  const { data: oddsData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['liveOdds', selectedSport],
    queryFn: async () => {
      try {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Search Google for: "${currentSport.search} odds today ${dateStr}"

Visit OddsChecker.com, ESPN.com, or DraftKings.com to find upcoming ${currentSport.name} games and their betting odds.

Find 5-10 games scheduled for TODAY or the NEXT FEW DAYS.

For EACH game, extract:
1. Home team name (official team name)
2. Away team name (official team name)  
3. Game date/time
4. Moneyline odds (e.g., "-150" for favorite, "+130" for underdog)
5. Spread (e.g., "-7.5" points)
6. Total over/under (e.g., "225.5" points)

Try to get odds from at least 2-3 different sportsbooks (DraftKings, FanDuel, BetMGM).

If you find NO games for today, search for games in the next 3-7 days.

Return the data in the specified JSON format.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              sport: { type: "string" },
              last_updated: { type: "string" },
              search_date: { type: "string" },
              games: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    home_team: { type: "string" },
                    away_team: { type: "string" },
                    commence_time: { type: "string" },
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
                        },
                        required: ["name"]
                      }
                    }
                  },
                  required: ["home_team", "away_team", "bookmakers"]
                }
              }
            },
            required: ["games"]
          }
        });

        console.log("✅ Live Odds Data:", result);
        
        if (!result || !result.games || result.games.length === 0) {
          throw new Error("No games found for this sport. Try another sport or check back later.");
        }
        
        return result;
      } catch (err) {
        console.error("❌ Failed to fetch odds:", err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });

  const formatOdds = (odds) => {
    if (!odds) return "N/A";
    const numOdds = parseInt(odds);
    if (isNaN(numOdds)) return odds;
    return numOdds > 0 ? `+${odds}` : odds;
  };

  const getOddsColor = (odds) => {
    if (!odds) return "text-slate-400";
    const numOdds = parseInt(odds);
    if (isNaN(numOdds)) return "text-slate-400";
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
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center"
              >
                <BarChart3 className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Live Odds</h1>
                <p className="text-slate-400 text-sm sm:text-base">Compare real-time betting lines</p>
              </div>
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
            </motion.div>
          </div>

          {/* Sport Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {sports.map((sport) => (
              <motion.button
                key={sport.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedSport(sport.id)}
                disabled={isLoading || isFetching}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedSport === sport.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                } ${(isLoading || isFetching) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-xl">{sport.icon}</span>
                {sport.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
            <Info className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300 text-sm">
              Odds are fetched from major sportsbooks (DraftKings, FanDuel, BetMGM). Data may take 10-15 seconds to load.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 border-4 border-green-500 border-t-transparent rounded-full"
              />
              <motion.h3 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xl font-semibold text-white mb-2"
              >
                Fetching Live Odds...
              </motion.h3>
              <p className="text-slate-400 text-sm">Searching {currentSport.name} games from multiple sportsbooks</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-emerald-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-teal-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 mb-6">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-red-300">
                {error.message || "Failed to load odds. Please try again or select a different sport."}
              </AlertDescription>
            </Alert>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-xl font-bold text-white mb-2">Unable to Load Odds</h3>
                <p className="text-slate-400 mb-6">
                  We couldn't fetch odds for {currentSport.name} at this time. This could be because:
                </p>
                <ul className="text-slate-400 text-sm text-left max-w-md mx-auto mb-6 space-y-2">
                  <li>• No games are scheduled today</li>
                  <li>• Sportsbooks haven't posted odds yet</li>
                  <li>• Temporary data source issue</li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => refetch()} className="bg-green-600 hover:bg-green-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const nextSportIndex = (sports.findIndex(s => s.id === selectedSport) + 1) % sports.length;
                      setSelectedSport(sports[nextSportIndex].id);
                    }}
                    className="border-slate-600 text-slate-300"
                  >
                    Try {sports[(sports.findIndex(s => s.id === selectedSport) + 1) % sports.length].name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Games Display */}
        {!isLoading && !error && oddsData?.games && oddsData.games.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-slate-400 text-sm">
                <Clock className="w-4 h-4 inline mr-1" />
                Last updated: {format(new Date(), 'MMM d, HH:mm')}
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {oddsData.games.length} Games
              </Badge>
            </div>

            {oddsData.games.map((game, index) => (
              <motion.div
                key={`${game.home_team}-${game.away_team}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/90 border-slate-700 hover:border-green-500/50 transition-all overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-5 h-5 text-green-400" />
                          <CardTitle className="text-white text-lg">
                            {game.away_team} @ {game.home_team}
                          </CardTitle>
                        </div>
                        {game.commence_time && (
                          <div className="text-sm text-slate-400">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {(() => {
                              try {
                                return format(new Date(game.commence_time), "MMM d, yyyy 'at' h:mm a");
                              } catch {
                                return game.commence_time;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6">
                    {game.bookmakers && game.bookmakers.length > 0 ? (
                      <Tabs defaultValue={game.bookmakers[0].name} className="w-full">
                        <TabsList className="w-full grid gap-2 bg-slate-900/50 p-1" style={{ gridTemplateColumns: `repeat(${Math.min(game.bookmakers.length, 6)}, minmax(0, 1fr))` }}>
                          {game.bookmakers.slice(0, 6).map((bookmaker) => (
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
                              {bookmaker.moneyline && (bookmaker.moneyline.home || bookmaker.moneyline.away) && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.3 }}
                                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                    <h4 className="font-bold text-white">Moneyline</h4>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-300 text-sm truncate mr-2">{game.away_team}</span>
                                      <span className={`font-bold text-lg ${getOddsColor(bookmaker.moneyline.away)}`}>
                                        {formatOdds(bookmaker.moneyline.away)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-300 text-sm truncate mr-2">{game.home_team}</span>
                                      <span className={`font-bold text-lg ${getOddsColor(bookmaker.moneyline.home)}`}>
                                        {formatOdds(bookmaker.moneyline.home)}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {/* Spread */}
                              {bookmaker.spread && (bookmaker.spread.home_line || bookmaker.spread.away_line) && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.3, delay: 0.1 }}
                                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-4 h-4 text-blue-400" />
                                    <h4 className="font-bold text-white">Spread</h4>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-300 text-sm truncate mr-2">{game.away_team}</span>
                                      <div className="text-right">
                                        <div className="font-bold text-blue-400">{bookmaker.spread.away_line || 'N/A'}</div>
                                        <div className="text-xs text-slate-400">{formatOdds(bookmaker.spread.away_price)}</div>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-300 text-sm truncate mr-2">{game.home_team}</span>
                                      <div className="text-right">
                                        <div className="font-bold text-blue-400">{bookmaker.spread.home_line || 'N/A'}</div>
                                        <div className="text-xs text-slate-400">{formatOdds(bookmaker.spread.home_price)}</div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {/* Totals */}
                              {bookmaker.totals && bookmaker.totals.line && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.3, delay: 0.2 }}
                                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                                >
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
                                </motion.div>
                              )}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        No odds available for this game yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!oddsData || !oddsData.games || oddsData.games.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold text-white mb-2">No Live Odds Available</h3>
                <p className="text-slate-400 mb-6">
                  No upcoming games found for {currentSport.name}. Try another sport or check back later.
                </p>
                <Button onClick={() => refetch()} className="bg-green-600 hover:bg-green-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          </motion.div>
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