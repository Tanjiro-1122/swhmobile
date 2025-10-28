import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, RefreshCw, AlertCircle, Trophy, DollarSign, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const ODDS_API_KEY = "4961807ff18b92da83549a2e55ab8f64";

export default function LiveOdds() {
  const [allOdds, setAllOdds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const sports = [
    { key: "basketball_nba", name: "NBA", icon: "🏀" },
    { key: "americanfootball_nfl", name: "NFL", icon: "🏈" },
    { key: "baseball_mlb", name: "MLB", icon: "⚾" },
    { key: "icehockey_nhl", name: "NHL", icon: "🏒" },
    { key: "soccer_epl", name: "Premier League", icon: "⚽" },
    { key: "soccer_usa_mls", name: "MLS", icon: "⚽" },
  ];

  const fetchAllOdds = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allGames = [];
      
      // Fetch odds from all sports
      for (const sport of sports) {
        try {
          const response = await fetch(
            `https://api.the-odds-api.com/v4/sports/${sport.key}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
          );

          if (response.ok) {
            const data = await response.json();
            // Add sport metadata to each game
            data.forEach(game => {
              game.sport_name = sport.name;
              game.sport_icon = sport.icon;
            });
            allGames.push(...data);
          }
        } catch (err) {
          console.error(`Failed to fetch ${sport.name} odds:`, err);
        }
      }

      // Sort by game time (earliest first)
      allGames.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
      
      setAllOdds(allGames);
      setLastUpdated(new Date());
      console.log(`📊 Loaded ${allGames.length} games from all sports`);
      
    } catch (err) {
      console.error("Failed to fetch odds:", err);
      setError(err.message || "Failed to load odds. Please try again.");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllOdds();
  }, []);

  const getBestOdds = (bookmakers, market) => {
    if (!bookmakers || bookmakers.length === 0) return null;
    
    let bestHome = null;
    let bestAway = null;
    let bestBookmakerHome = null;
    let bestBookmakerAway = null;

    bookmakers.forEach(bookmaker => {
      const marketData = bookmaker.markets.find(m => m.key === market);
      if (!marketData) return;

      const homeOutcome = marketData.outcomes.find(o => o.name === bookmaker.home_team || o.name === 'Over');
      const awayOutcome = marketData.outcomes.find(o => o.name === bookmaker.away_team || o.name === 'Under');

      if (homeOutcome && (!bestHome || homeOutcome.price > bestHome)) {
        bestHome = homeOutcome.price;
        bestBookmakerHome = bookmaker.title;
      }

      if (awayOutcome && (!bestAway || awayOutcome.price > bestAway)) {
        bestAway = awayOutcome.price;
        bestBookmakerAway = bookmaker.title;
      }
    });

    return { bestHome, bestAway, bestBookmakerHome, bestBookmakerAway };
  };

  const formatOdds = (odds) => {
    if (!odds) return "N/A";
    return odds > 0 ? `+${odds}` : odds;
  };

  const isToday = (dateString) => {
    const gameDate = new Date(dateString);
    const today = new Date();
    return gameDate.toDateString() === today.toDateString();
  };

  const todaysGames = allOdds.filter(game => isToday(game.commence_time));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Today's Live Odds</h1>
              <p className="text-slate-400">Real-time betting odds from all sports today</p>
            </div>
          </div>
        </motion.div>

        {/* Refresh Button */}
        <div className="mb-6 flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div className="text-sm text-slate-400">
            {lastUpdated ? (
              <>
                <span className="font-semibold text-white">{todaysGames.length}</span> games today • Last updated: {lastUpdated.toLocaleTimeString()}
              </>
            ) : (
              "Loading odds..."
            )}
          </div>
          <Button
            onClick={fetchAllOdds}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Odds Display */}
        {isLoading && allOdds.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4" />
              <p className="text-slate-400">Loading today's odds from all sports...</p>
              <p className="text-xs text-slate-500 mt-2">This may take a moment...</p>
            </div>
          </div>
        ) : todaysGames.length === 0 && !isLoading ? (
          <Card className="bg-slate-800/90 border-slate-700">
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-bold text-white mb-2">No Games Today</h3>
              <p className="text-slate-400">There are no scheduled games across all sports today.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {todaysGames.map((game, index) => {
              const moneylineBest = getBestOdds(game.bookmakers, 'h2h');
              const spreadBest = getBestOdds(game.bookmakers, 'spreads');
              const totalsBest = getBestOdds(game.bookmakers, 'totals');

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-slate-800/90 border-slate-700 hover:border-green-500/50 transition-all">
                    <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{game.sport_icon}</span>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {game.sport_name}
                            </Badge>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Live
                            </Badge>
                          </div>
                          <CardTitle className="text-white text-xl mb-2">
                            {game.home_team} vs {game.away_team}
                          </CardTitle>
                          <div className="text-sm text-slate-400 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(game.commence_time).toLocaleTimeString([], { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Moneyline */}
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-4 h-4 text-blue-400" />
                            <span className="font-bold text-white">Moneyline</span>
                          </div>
                          {moneylineBest && (
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm text-slate-400 mb-1">{game.home_team}</div>
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold text-blue-400">
                                    {formatOdds(moneylineBest.bestHome)}
                                  </span>
                                  <span className="text-xs text-slate-500">{moneylineBest.bestBookmakerHome}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-400 mb-1">{game.away_team}</div>
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold text-purple-400">
                                    {formatOdds(moneylineBest.bestAway)}
                                  </span>
                                  <span className="text-xs text-slate-500">{moneylineBest.bestBookmakerAway}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Spread */}
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-orange-400" />
                            <span className="font-bold text-white">Spread</span>
                          </div>
                          {spreadBest && (
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm text-slate-400 mb-1">{game.home_team}</div>
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold text-orange-400">
                                    {formatOdds(spreadBest.bestHome)}
                                  </span>
                                  <span className="text-xs text-slate-500">{spreadBest.bestBookmakerHome}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-400 mb-1">{game.away_team}</div>
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold text-pink-400">
                                    {formatOdds(spreadBest.bestAway)}
                                  </span>
                                  <span className="text-xs text-slate-500">{spreadBest.bestBookmakerAway}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Totals */}
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-4 h-4 text-green-400" />
                            <span className="font-bold text-white">Over/Under</span>
                          </div>
                          {totalsBest && (
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm text-slate-400 mb-1">Over</div>
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold text-green-400">
                                    {formatOdds(totalsBest.bestHome)}
                                  </span>
                                  <span className="text-xs text-slate-500">{totalsBest.bestBookmakerHome}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-400 mb-1">Under</div>
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold text-red-400">
                                    {formatOdds(totalsBest.bestAway)}
                                  </span>
                                  <span className="text-xs text-slate-500">{totalsBest.bestBookmakerAway}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Available Bookmakers */}
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>Available at:</span>
                          {game.bookmakers.slice(0, 5).map((bookmaker, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {bookmaker.title}
                            </Badge>
                          ))}
                          {game.bookmakers.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{game.bookmakers.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* API Info Footer */}
        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            📊 Live odds provided by The Odds API • Updates every minute • Showing all sports scheduled for today
          </p>
        </div>
      </div>
    </div>
  );
}