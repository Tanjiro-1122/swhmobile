import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, RefreshCw, AlertCircle, Trophy, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const ODDS_API_KEY = "4961807ff18b92da83549a2e55ab8f64";

export default function LiveOdds() {
  const [selectedSport, setSelectedSport] = useState("basketball_nba");
  const [odds, setOdds] = useState([]);
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

  const fetchOdds = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${selectedSport}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setOdds(data);
      setLastUpdated(new Date());
      
      const remaining = response.headers.get('x-requests-remaining');
      const used = response.headers.get('x-requests-used');
      console.log(`📊 API Usage: ${used} used, ${remaining} remaining`);
      
    } catch (err) {
      console.error("Failed to fetch odds:", err);
      setError(err.message || "Failed to load odds. Please try again.");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchOdds();
  }, [selectedSport]);

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
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Live Odds</h1>
              <p className="text-slate-400">Real-time betting odds from top sportsbooks</p>
            </div>
          </div>
        </motion.div>

        {/* Sport Selector */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {sports.map((sport) => (
            <Button
              key={sport.key}
              onClick={() => setSelectedSport(sport.key)}
              variant={selectedSport === sport.key ? "default" : "outline"}
              className={selectedSport === sport.key 
                ? "bg-gradient-to-r from-blue-500 to-purple-600" 
                : "border-slate-600 text-slate-300 hover:bg-slate-800"
              }
            >
              <span className="mr-2">{sport.icon}</span>
              {sport.name}
            </Button>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mb-6 flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div className="text-sm text-slate-400">
            {lastUpdated ? (
              <>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </>
            ) : (
              "Click refresh to load odds"
            )}
          </div>
          <Button
            onClick={fetchOdds}
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
                Refresh Odds
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-5 h-5" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && odds.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-green-200" />
                <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
              </div>
              <p className="text-slate-400">Loading live odds...</p>
            </div>
          </div>
        ) : odds.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-bold text-white mb-2">No Games Available</h3>
              <p className="text-slate-400 mb-6">
                There are no upcoming games for this sport right now.
              </p>
              <Button onClick={fetchOdds} className="bg-gradient-to-r from-blue-500 to-purple-600">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {odds.map((game, index) => {
              const moneylineOdds = getBestOdds(game.bookmakers, 'h2h');
              const spreadOdds = getBestOdds(game.bookmakers, 'spreads');
              const totalsOdds = getBestOdds(game.bookmakers, 'totals');

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-slate-800/90 border-slate-700 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white text-xl mb-2">
                            {game.away_team} @ {game.home_team}
                          </CardTitle>
                          <p className="text-blue-100 text-sm">
                            {new Date(game.commence_time).toLocaleString()}
                          </p>
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30">
                          {game.bookmakers.length} Bookmakers
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Moneyline */}
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            <h4 className="font-bold text-white">Moneyline</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-slate-400 mb-1">{game.away_team}</div>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-white">
                                  {formatOdds(moneylineOdds?.bestAway)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {moneylineOdds?.bestBookmakerAway}
                                </span>
                              </div>
                            </div>
                            <div className="border-t border-slate-700 pt-3">
                              <div className="text-sm text-slate-400 mb-1">{game.home_team}</div>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-white">
                                  {formatOdds(moneylineOdds?.bestHome)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {moneylineOdds?.bestBookmakerHome}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Spread */}
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                            <h4 className="font-bold text-white">Spread</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-slate-400 mb-1">{game.away_team}</div>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-white">
                                  {formatOdds(spreadOdds?.bestAway)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {spreadOdds?.bestBookmakerAway}
                                </span>
                              </div>
                            </div>
                            <div className="border-t border-slate-700 pt-3">
                              <div className="text-sm text-slate-400 mb-1">{game.home_team}</div>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-white">
                                  {formatOdds(spreadOdds?.bestHome)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {spreadOdds?.bestBookmakerHome}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Totals */}
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-purple-400" />
                            <h4 className="font-bold text-white">Over/Under</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-slate-400 mb-1">Over</div>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-white">
                                  {formatOdds(totalsOdds?.bestHome)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {totalsOdds?.bestBookmakerHome}
                                </span>
                              </div>
                            </div>
                            <div className="border-t border-slate-700 pt-3">
                              <div className="text-sm text-slate-400 mb-1">Under</div>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-white">
                                  {formatOdds(totalsOdds?.bestAway)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {totalsOdds?.bestBookmakerAway}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}