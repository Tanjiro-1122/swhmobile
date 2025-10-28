import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, RefreshCw, DollarSign, Home, Plane, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import RequireAuth from "../components/auth/RequireAuth";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";

function LiveOddsContent() {
  const [selectedSport, setSelectedSport] = useState("basketball_nba");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [oddsData, setOddsData] = useState([]);
  const [error, setError] = useState(null);

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier } = useFreeLookupTracker();

  const sportKeys = {
    "NBA": "basketball_nba",
    "NFL": "americanfootball_nfl",
    "MLB": "baseball_mlb",
    "NHL": "icehockey_nhl",
    "Soccer": "soccer_epl"
  };

  const fetchLiveOdds = async (sportKey) => {
    if (!canLookup() && !hasLoadedOnce) {
      setShowLimitModal(true);
      return;
    }

    setIsRefreshing(true);
    setError(null);
    
    try {
      const apiKey = '4961807ff18b92da83549a2e55ab8f64';
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch odds');
      }

      const data = await response.json();

      if (!hasLoadedOnce) {
        recordLookup();
        setHasLoadedOnce(true);
      }

      const games = data.map(game => {
        const draftkings = game.bookmakers?.find(b => b.key === 'draftkings');
        const fanduel = game.bookmakers?.find(b => b.key === 'fanduel');
        const betmgm = game.bookmakers?.find(b => b.key === 'betmgm');

        return {
          game_id: game.id,
          home_team: game.home_team,
          away_team: game.away_team,
          start_time: game.commence_time,
          sport_title: game.sport_title,
          odds: {
            draftkings: draftkings ? {
              moneyline_home: draftkings.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.home_team)?.price,
              moneyline_away: draftkings.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.away_team)?.price,
              spread_home: draftkings.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.home_team)?.point,
              spread_odds_home: draftkings.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.home_team)?.price,
              spread_away: draftkings.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.away_team)?.point,
              spread_odds_away: draftkings.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.away_team)?.price,
              total: draftkings.markets?.find(m => m.key === 'totals')?.outcomes?.[0]?.point,
              over: draftkings.markets?.find(m => m.key === 'totals')?.outcomes?.find(o => o.name === 'Over')?.price,
              under: draftkings.markets?.find(m => m.key === 'totals')?.outcomes?.find(o => o.name === 'Under')?.price,
            } : null,
            fanduel: fanduel ? {
              moneyline_home: fanduel.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.home_team)?.price,
              moneyline_away: fanduel.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.away_team)?.price,
              spread_home: fanduel.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.home_team)?.point,
              spread_odds_home: fanduel.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.home_team)?.price,
              spread_away: fanduel.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.away_team)?.point,
              spread_odds_away: fanduel.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.away_team)?.price,
              total: fanduel.markets?.find(m => m.key === 'totals')?.outcomes?.[0]?.point,
              over: fanduel.markets?.find(m => m.key === 'totals')?.outcomes?.find(o => o.name === 'Over')?.price,
              under: fanduel.markets?.find(m => m.key === 'totals')?.outcomes?.find(o => o.name === 'Under')?.price,
            } : null,
            betmgm: betmgm ? {
              moneyline_home: betmgm.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.home_team)?.price,
              moneyline_away: betmgm.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.away_team)?.price,
              spread_home: betmgm.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.home_team)?.point,
              spread_odds_home: betmgm.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.home_team)?.price,
              spread_away: betmgm.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.away_team)?.point,
              spread_odds_away: betmgm.markets?.find(m => m.key === 'spreads')?.outcomes?.find(o => o.name === game.away_team)?.price,
              total: betmgm.markets?.find(m => m.key === 'totals')?.outcomes?.[0]?.point,
              over: betmgm.markets?.find(m => m.key === 'totals')?.outcomes?.find(o => o.name === 'Over')?.price,
              under: betmgm.markets?.find(m => m.key === 'totals')?.outcomes?.find(o => o.name === 'Under')?.price,
            } : null,
          }
        };
      });

      setOddsData(games);
    } catch (err) {
      console.error('Error fetching odds:', err);
      setError('Failed to load live odds. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveOdds(selectedSport);
  }, [selectedSport]);

  const formatOdds = (odds) => {
    if (odds === null || odds === undefined) return 'N/A';
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const formatSpread = (point, odds) => {
    if (point === null || point === undefined) return 'N/A';
    const spreadStr = point > 0 ? `+${point}` : point.toString();
    const oddsStr = odds ? ` (${formatOdds(odds)})` : '';
    return `${spreadStr}${oddsStr}`;
  };

  const formatTotal = (total, over, under) => {
    if (total === null || total === undefined) return 'N/A';
    return `${total} (O: ${formatOdds(over)} / U: ${formatOdds(under)})`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Live Odds</h1>
              <p className="text-gray-400">Compare real-time odds from top sportsbooks</p>
            </div>
          </div>
          <Button
            onClick={() => fetchLiveOdds(selectedSport)}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Odds'}
          </Button>
        </div>

        <Tabs value={selectedSport} onValueChange={setSelectedSport} className="mb-8">
          <TabsList className="bg-slate-800 p-1">
            <TabsTrigger value="basketball_nba" className="data-[state=active]:bg-blue-600">NBA</TabsTrigger>
            <TabsTrigger value="americanfootball_nfl" className="data-[state=active]:bg-blue-600">NFL</TabsTrigger>
            <TabsTrigger value="baseball_mlb" className="data-[state=active]:bg-blue-600">MLB</TabsTrigger>
            <TabsTrigger value="icehockey_nhl" className="data-[state=active]:bg-blue-600">NHL</TabsTrigger>
            <TabsTrigger value="soccer_epl" className="data-[state=active]:bg-blue-600">Soccer</TabsTrigger>
          </TabsList>
        </Tabs>

        {error && (
          <Card className="bg-red-500/10 border-2 border-red-500 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-red-300 font-semibold">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isRefreshing && oddsData.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
              </div>
              <p className="text-white text-lg font-semibold">Loading live odds...</p>
            </div>
          </div>
        ) : oddsData.length === 0 ? (
          <Card className="bg-slate-800/50 border-2 border-slate-700">
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-2xl font-bold text-white mb-2">No Games Available</h3>
              <p className="text-gray-400">There are no upcoming games for this sport. Try another sport or check back later.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {oddsData.map((game, index) => (
              <motion.div
                key={game.game_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/90 border-2 border-slate-700">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Home className="w-5 h-5" />
                          <span className="text-2xl font-bold">{game.home_team}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Plane className="w-5 h-5" />
                          <span className="text-2xl font-bold">{game.away_team}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-white/20 text-white border-white/30 mb-2">
                          {new Date(game.start_time).toLocaleDateString()}
                        </Badge>
                        <div className="text-sm text-white/80">
                          {new Date(game.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* DraftKings */}
                      {game.odds.draftkings && (
                        <div className="bg-gradient-to-r from-green-900/20 to-black/20 rounded-lg p-4 border border-green-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            <span className="font-bold text-xl text-green-400">DraftKings</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Moneyline</div>
                              <div className="text-white font-bold">{formatOdds(game.odds.draftkings.moneyline_home)}</div>
                              <div className="text-white font-bold">{formatOdds(game.odds.draftkings.moneyline_away)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Spread</div>
                              <div className="text-white font-bold">{formatSpread(game.odds.draftkings.spread_home, game.odds.draftkings.spread_odds_home)}</div>
                              <div className="text-white font-bold">{formatSpread(game.odds.draftkings.spread_away, game.odds.draftkings.spread_odds_away)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Total</div>
                              <div className="text-white font-bold">
                                {formatTotal(game.odds.draftkings.total, game.odds.draftkings.over, game.odds.draftkings.under)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FanDuel */}
                      {game.odds.fanduel && (
                        <div className="bg-gradient-to-r from-blue-900/20 to-black/20 rounded-lg p-4 border border-blue-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-5 h-5 text-blue-400" />
                            <span className="font-bold text-xl text-blue-400">FanDuel</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Moneyline</div>
                              <div className="text-white font-bold">{formatOdds(game.odds.fanduel.moneyline_home)}</div>
                              <div className="text-white font-bold">{formatOdds(game.odds.fanduel.moneyline_away)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Spread</div>
                              <div className="text-white font-bold">{formatSpread(game.odds.fanduel.spread_home, game.odds.fanduel.spread_odds_home)}</div>
                              <div className="text-white font-bold">{formatSpread(game.odds.fanduel.spread_away, game.odds.fanduel.spread_odds_away)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Total</div>
                              <div className="text-white font-bold">
                                {formatTotal(game.odds.fanduel.total, game.odds.fanduel.over, game.odds.fanduel.under)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* BetMGM */}
                      {game.odds.betmgm && (
                        <div className="bg-gradient-to-r from-yellow-900/20 to-black/20 rounded-lg p-4 border border-yellow-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-5 h-5 text-yellow-400" />
                            <span className="font-bold text-xl text-yellow-400">BetMGM</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Moneyline</div>
                              <div className="text-white font-bold">{formatOdds(game.odds.betmgm.moneyline_home)}</div>
                              <div className="text-white font-bold">{formatOdds(game.odds.betmgm.moneyline_away)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Spread</div>
                              <div className="text-white font-bold">{formatSpread(game.odds.betmgm.spread_home, game.odds.betmgm.spread_odds_home)}</div>
                              <div className="text-white font-bold">{formatSpread(game.odds.betmgm.spread_away, game.odds.betmgm.spread_odds_away)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Total</div>
                              <div className="text-white font-bold">
                                {formatTotal(game.odds.betmgm.total, game.odds.betmgm.over, game.odds.betmgm.under)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveOdds() {
  return (
    <RequireAuth pageName="Live Odds">
      <LiveOddsContent />
    </RequireAuth>
  );
}