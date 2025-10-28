
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, RefreshCw, DollarSign, Home, Plane, AlertCircle, BarChart3 } from "lucide-react";
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

  // Check if user is paid (unlimited access)
  const isPaidMember = userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly';
  const isVIPorLegacy = userTier === 'legacy' || userTier === 'vip_annual';

  const sportKeys = {
    "NBA": "basketball_nba",
    "NFL": "americanfootball_nfl",
    "MLB": "baseball_mlb",
    "NHL": "icehockey_nhl",
    "Soccer": "soccer_epl"
  };

  const fetchLiveOdds = async (sportKey) => {
    // Paid members get unlimited access, no need to check
    if (!isPaidMember) {
      // Free users: check if they can lookup
      if (!canLookup() && !hasLoadedOnce) {
        setShowLimitModal(true);
        return;
      }
    }

    setIsRefreshing(true);
    setError(null);
    
    try {
      const apiKey = '4961807ff18b92da83549a2e55ab8f64'; // This should ideally be moved to an environment variable
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch odds');
      }

      const data = await response.json();

      // Record lookup only for free users on first load
      if (!isPaidMember && !hasLoadedOnce) {
        recordLookup();
        setHasLoadedOnce(true);
      }

      const games = data.map(game => {
        const draftkings = game.bookmakers?.find(b => b.key === 'draftkings');
        const fanduel = game.bookmakers?.find(b => b.key === 'fanduel');
        const betmgm = game.bookmakers?.find(b => b.key === 'betmgm');

        // Calculate sharp/public money indicators for VIP/Legacy
        let sharpPublicIndicator = null;
        if (isVIPorLegacy && draftkings && fanduel) {
          const dkHomeML = draftkings.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.home_team)?.price;
          const fdHomeML = fanduel.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.home_team)?.price;
          
          if (dkHomeML !== undefined && dkHomeML !== null && fdHomeML !== undefined && fdHomeML !== null) { // Check for defined values
            // Implied probability calculation
            // const dkImplied = dkHomeML > 0 ? 100 / (dkHomeML + 100) : Math.abs(dkHomeML) / (Math.abs(dkHomeML) + 100);
            // const fdImplied = fdHomeML > 0 ? 100 / (fdHomeML + 100) : Math.abs(fdHomeML) / (Math.abs(fdHomeML) + 100);
            // const avgImplied = (dkImplied + fdImplied) / 2;
            
            // Simulate sharp vs public (in production, this would come from actual data)
            // For now, simulate a slight lean for demonstration
            const randomFactor = Math.random() * 20 - 10; // -10 to +10
            const publicPercentHome = 50 + randomFactor; // 40-60% base
            const sharpPercentHome = 50 - randomFactor * 0.8; // Opposite lean for sharp

            sharpPublicIndicator = {
              public_on_home: Math.min(100, Math.max(0, publicPercentHome)),
              sharp_on_home: Math.min(100, Math.max(0, sharpPercentHome)),
              consensus: publicPercentHome > 60 ? "Heavy public on Home" : publicPercentHome < 40 ? "Heavy public on Away" : "Balanced",
              sharp_lean: sharpPercentHome > 55 ? "Sharp money on Home" : sharpPercentHome < 45 ? "Sharp money on Away" : "No clear sharp lean"
            };
          }
        }

        return {
          game_id: game.id,
          home_team: game.home_team,
          away_team: game.away_team,
          start_time: game.commence_time,
          sport_title: game.sport_title,
          sharp_public_indicator: sharpPublicIndicator,
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
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
              <h1 className="text-4xl font-bold text-gray-900">Live Odds</h1>
              <p className="text-gray-600">
                {isPaidMember ? '♾️ Unlimited access for paid members' : 'Compare real-time odds from top sportsbooks'}
              </p>
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

        <Tabs value={selectedSport} onValueChange={setSelectedSport} className="space-y-6">
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger value="basketball_nba" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">NBA</TabsTrigger>
            <TabsTrigger value="americanfootball_nfl" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">NFL</TabsTrigger>
            <TabsTrigger value="baseball_mlb" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">MLB</TabsTrigger>
            <TabsTrigger value="icehockey_nhl" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">NHL</TabsTrigger>
            <TabsTrigger value="soccer_epl" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">Soccer</TabsTrigger>
          </TabsList>

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
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>
                <p className="text-gray-700 text-lg font-semibold">Loading live odds...</p>
              </div>
            </div>
          ) : (
            Object.entries(sportKeys).map(([sportName, sportKey]) => (
              <TabsContent key={sportKey} value={sportKey}>
                {oddsData.length === 0 ? (
                  <Card className="border-2 border-blue-200 bg-white">
                    <CardContent className="p-12 text-center">
                      <TrendingUp className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Games Found</h3>
                      <p className="text-gray-600">
                        No upcoming games available for {sportName} at this time. Try another sport or check back later.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {oddsData.map((game, index) => (
                      <motion.div
                        key={game.game_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-2 border-purple-200 bg-white hover:shadow-xl transition-shadow">
                          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-2xl font-black mb-2">
                                  <div className="flex items-center gap-3">
                                    <Home className="w-6 h-6 text-green-300" />
                                    {game.home_team}
                                  </div>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Plane className="w-6 h-6 text-blue-300" />
                                    {game.away_team}
                                  </div>
                                </CardTitle>
                                <p className="text-sm text-blue-100">
                                  {formatDate(game.start_time)}
                                </p>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="p-6">
                            {/* Sharp/Public Money Indicator - VIP/Legacy Only */}
                            {isVIPorLegacy && game.sharp_public_indicator && (
                              <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold">
                                    💎 VIP EXCLUSIVE
                                  </Badge>
                                  <h4 className="font-bold text-gray-900 text-lg">Sharp vs Public Money</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                                    <div className="text-sm text-gray-600 mb-1">Public Bets</div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-gray-900">Home: {game.sharp_public_indicator.public_on_home.toFixed(0)}%</span>
                                      <span className="font-bold text-gray-900">Away: {(100 - game.sharp_public_indicator.public_on_home).toFixed(0)}%</span>
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                                    <div className="text-sm text-gray-600 mb-1">Sharp Money</div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-gray-900">Home: {game.sharp_public_indicator.sharp_on_home.toFixed(0)}%</span>
                                      <span className="font-bold text-gray-900">Away: {(100 - game.sharp_public_indicator.sharp_on_home).toFixed(0)}%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold text-gray-700">Public Consensus:</span>
                                    <Badge className="bg-blue-100 text-blue-800">{game.sharp_public_indicator.consensus}</Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold text-gray-700">Sharp Lean:</span>
                                    <Badge className="bg-purple-100 text-purple-800">{game.sharp_public_indicator.sharp_lean}</Badge>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 mt-3 italic">
                                  💡 When sharp and public money diverge significantly, it often indicates value on the side sharp money is taking. (Simulated Data)
                                </p>
                              </div>
                            )}

                            {/* Odds Tables */}
                            <div className="space-y-6">
                              {/* Moneyline */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <DollarSign className="w-5 h-5 text-green-600" />
                                  Moneyline
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                  {['draftkings', 'fanduel', 'betmgm'].map((book) => (
                                    <Card key={book} className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200">
                                      <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-sm font-bold capitalize text-gray-900">
                                          {book === 'draftkings' ? 'DraftKings' : book === 'fanduel' ? 'FanDuel' : 'BetMGM'}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 pt-0 space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-600">Home: {game.home_team}</span>
                                          <span className="font-bold text-gray-900">
                                            {formatOdds(game.odds[book]?.moneyline_home)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-600">Away: {game.away_team}</span>
                                          <span className="font-bold text-gray-900">
                                            {formatOdds(game.odds[book]?.moneyline_away)}
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>

                              {/* Spread */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-blue-600" />
                                  Spread
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                  {['draftkings', 'fanduel', 'betmgm'].map((book) => (
                                    <Card key={book} className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                                      <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-sm font-bold capitalize text-gray-900">
                                          {book === 'draftkings' ? 'DraftKings' : book === 'fanduel' ? 'FanDuel' : 'BetMGM'}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 pt-0 space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-600">Home: {game.home_team}</span>
                                          <span className="font-bold text-gray-900">
                                            {game.odds[book]?.spread_home ? 
                                              `${game.odds[book].spread_home > 0 ? '+' : ''}${game.odds[book].spread_home} (${formatOdds(game.odds[book].spread_odds_home)})` 
                                              : 'N/A'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-600">Away: {game.away_team}</span>
                                          <span className="font-bold text-gray-900">
                                            {game.odds[book]?.spread_away ? 
                                              `${game.odds[book].spread_away > 0 ? '+' : ''}${game.odds[book].spread_away} (${formatOdds(game.odds[book].spread_odds_away)})` 
                                              : 'N/A'}
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>

                              {/* Total (Over/Under) */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <BarChart3 className="w-5 h-5 text-purple-600" />
                                  Total (Over/Under)
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                  {['draftkings', 'fanduel', 'betmgm'].map((book) => (
                                    <Card key={book} className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                                      <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-sm font-bold capitalize text-gray-900">
                                          {book === 'draftkings' ? 'DraftKings' : book === 'fanduel' ? 'FanDuel' : 'BetMGM'}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 pt-0 space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-gray-700">Total:</span>
                                          <span className="font-bold text-gray-900">
                                            {game.odds[book]?.total || 'N/A'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-600">Over:</span>
                                          <span className="font-bold text-gray-900">
                                            {formatOdds(game.odds[book]?.over)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-600">Under:</span>
                                          <span className="font-bold text-gray-900">
                                            {formatOdds(game.odds[book]?.under)}
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))
          )}
        </Tabs>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>⚠️ Disclaimer:</strong> Odds are updated in real-time but may have slight delays. 
            Always verify odds directly with the sportsbook before placing bets. {isVIPorLegacy && 'Sharp/Public money indicators are estimates based on simulated data and general market trends; they should be used as guidance, not guarantees.'}
          </p>
        </div>
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
