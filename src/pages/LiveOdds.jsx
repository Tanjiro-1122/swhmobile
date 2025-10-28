import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, RefreshCw, AlertCircle, BarChart3, Trophy, Clock, DollarSign, Info, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function LiveOdds() {
  const [selectedSport, setSelectedSport] = useState("basketball_nba");
  const [apiKey, setApiKey] = useState(""); // User will need to input their API key temporarily

  const sports = [
    { id: "basketball_nba", name: "NBA", icon: "🏀" },
    { id: "americanfootball_nfl", name: "NFL", icon: "🏈" },
    { id: "soccer_epl", name: "Premier League", icon: "⚽" },
    { id: "baseball_mlb", name: "MLB", icon: "⚾" },
    { id: "icehockey_nhl", name: "NHL", icon: "🏒" },
  ];

  const currentSport = sports.find(s => s.id === selectedSport);

  const { data: oddsData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['liveOdds', selectedSport],
    queryFn: async () => {
      try {
        // Check if backend function is available
        if (base44.functions && base44.functions.getOddsData) {
          // Use backend function (preferred - keeps API key secure)
          const result = await base44.functions.getOddsData({
            sport: selectedSport
          });
          
          if (!result.success) {
            throw new Error(result.error);
          }
          
          return {
            games: result.data,
            quota: result.quota,
            source: "The Odds API"
          };
        } else {
          // Fallback: Direct API call (only if backend functions not available)
          // This requires the user to input their API key in settings
          const storedApiKey = localStorage.getItem('odds_api_key') || apiKey;
          
          if (!storedApiKey) {
            throw new Error("Please enter your Odds API key in settings");
          }
          
          const response = await fetch(
            `https://api.the-odds-api.com/v4/sports/${selectedSport}/odds/?apiKey=${storedApiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
          );
          
          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("Invalid API key. Please check your Odds API key.");
            }
            if (response.status === 429) {
              throw new Error("API quota exceeded. You've used all 500 free requests this month.");
            }
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          const remaining = response.headers.get('x-requests-remaining');
          const used = response.headers.get('x-requests-used');
          
          return {
            games: data,
            quota: {
              remaining: parseInt(remaining),
              used: parseInt(used)
            },
            source: "The Odds API (Direct)"
          };
        }
      } catch (err) {
        console.error("❌ Failed to fetch odds:", err);
        throw err;
      }
    },
    enabled: !!selectedSport,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
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
                <p className="text-slate-400 text-sm sm:text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  Powered by The Odds API
                </p>
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

          {/* API Quota Display */}
          {oddsData?.quota && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert className="mb-4 bg-blue-500/10 border-blue-500/30">
                <Info className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-300 text-sm">
                  API Quota: <strong>{oddsData.quota.remaining}</strong> requests remaining this month 
                  ({oddsData.quota.used} used)
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

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
              <p className="text-slate-400 text-sm">Real-time data from The Odds API</p>
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
                {error.message}
              </AlertDescription>
            </Alert>
            
            {error.message.includes("API key") && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-4">Setup Required:</h3>
                  <ol className="text-slate-300 space-y-2 text-sm list-decimal list-inside">
                    <li>Go to <a href="https://the-odds-api.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">the-odds-api.com</a></li>
                    <li>Sign up for a free account (500 requests/month)</li>
                    <li>Copy your API key</li>
                    <li>Go to Settings and paste your API key</li>
                  </ol>
                </CardContent>
              </Card>
            )}
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
                Live data from The Odds API
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
                      <Tabs defaultValue={game.bookmakers[0].key} className="w-full">
                        <TabsList className="w-full grid gap-2 bg-slate-900/50 p-1" style={{ gridTemplateColumns: `repeat(${Math.min(game.bookmakers.length, 6)}, minmax(0, 1fr))` }}>
                          {game.bookmakers.slice(0, 6).map((bookmaker) => (
                            <TabsTrigger
                              key={bookmaker.key}
                              value={bookmaker.key}
                              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs sm:text-sm"
                            >
                              {bookmaker.title}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {game.bookmakers.map((bookmaker) => {
                          // Find markets
                          const h2hMarket = bookmaker.markets?.find(m => m.key === 'h2h');
                          const spreadsMarket = bookmaker.markets?.find(m => m.key === 'spreads');
                          const totalsMarket = bookmaker.markets?.find(m => m.key === 'totals');

                          return (
                            <TabsContent key={bookmaker.key} value={bookmaker.key} className="mt-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Moneyline */}
                                {h2hMarket && h2hMarket.outcomes && (
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
                                      {h2hMarket.outcomes.map((outcome, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                          <span className="text-slate-300 text-sm truncate mr-2">{outcome.name}</span>
                                          <span className={`font-bold text-lg ${getOddsColor(outcome.price)}`}>
                                            {formatOdds(outcome.price)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}

                                {/* Spread */}
                                {spreadsMarket && spreadsMarket.outcomes && (
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
                                      {spreadsMarket.outcomes.map((outcome, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                          <span className="text-slate-300 text-sm truncate mr-2">{outcome.name}</span>
                                          <div className="text-right">
                                            <div className="font-bold text-blue-400">
                                              {outcome.point > 0 ? '+' : ''}{outcome.point}
                                            </div>
                                            <div className="text-xs text-slate-400">{formatOdds(outcome.price)}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}

                                {/* Totals */}
                                {totalsMarket && totalsMarket.outcomes && (
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
                                    {totalsMarket.outcomes[0] && (
                                      <div className="text-center mb-3">
                                        <div className="text-2xl font-bold text-purple-400">{totalsMarket.outcomes[0].point}</div>
                                        <div className="text-xs text-slate-400">Points</div>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                      {totalsMarket.outcomes.map((outcome, idx) => (
                                        <div key={idx} className="text-center p-2 bg-slate-800 rounded">
                                          <div className="text-xs text-slate-400 mb-1">{outcome.name}</div>
                                          <div className="font-bold text-purple-400">{formatOdds(outcome.price)}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </TabsContent>
                          );
                        })}
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
                  No upcoming games found for {currentSport?.name}. Try another sport or check back later.
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
              <strong>Important:</strong> Odds can change rapidly. Always verify odds directly with your sportsbook before placing any bets.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </div>
  );
}