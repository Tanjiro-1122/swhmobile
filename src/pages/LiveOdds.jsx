import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, RefreshCw, DollarSign, Home, Plane, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [selectedBookmaker, setSelectedBookmaker] = useState("all");

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier } = useFreeLookupTracker();

  // Sport mapping for The Odds API
  const sportKeys = {
    "NBA": "basketball_nba",
    "NFL": "americanfootball_nfl",
    "MLB": "baseball_mlb",
    "NHL": "icehockey_nhl",
    "Soccer": "soccer_epl"
  };

  const fetchLiveOdds = async (sportKey) => {
    // Check if user can lookup before fetching
    if (!canLookup() && !hasLoadedOnce) {
      setShowLimitModal(true);
      return null;
    }

    setIsRefreshing(true);
    try {
      // Fetch from The Odds API
      const apiKey = '4961807ff18b92da83549a2e55ab8f64';
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch odds');
      }

      const data = await response.json();

      // Record lookup only on first load
      if (!hasLoadedOnce) {
        recordLookup();
        setHasLoadedOnce(true);
      }

      // Transform data for display
      const games = data.map(game => {
        const draftkings = game.bookmakers.find(b => b.key === 'draftkings');
        const fanduel = game.bookmakers.find(b => b.key === 'fanduel');
        const betmgm = game.bookmakers.find(b => b.key === 'betmgm');

        return {
          game_id: game.id,
          home_team: game.home_team,
          away_team: game.away_team,
          start_time: game.commence_time,
          sport_title: game.sport_title,
          odds: {
            draftkings: draftkings ? {
              moneyline_home: draftkings.markets.find(m => m.key === 'h2h')?.outcomes.find(o => o.name === game.home_team)?.price,
              moneyline_away: draftkings.markets.find(m => m.key === 'h2h')?.outcomes.find(o => o.name === game.away_team)?.price,
              spread_home: draftkings.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.home_team)?.point,
              spread_odds_home: draftkings.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.home_team)?.price,
              spread_away: draftkings.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.away_team)?.point,
              spread_odds_away: draftkings.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.away_team)?.price,
              total: draftkings.markets.find(m => m.key === 'totals')?.outcomes[0]?.point,
              over: draftkings.markets.find(m => m.key === 'totals')?.outcomes.find(o => o.name === 'Over')?.price,
              under: draftkings.markets.find(m => m.key === 'totals')?.outcomes.find(o => o.name === 'Under')?.price,
            } : null,
            fanduel: fanduel ? {
              moneyline_home: fanduel.markets.find(m => m.key === 'h2h')?.outcomes.find(o => o.name === game.home_team)?.price,
              moneyline_away: fanduel.markets.find(m => m.key === 'h2h')?.outcomes.find(o => o.name === game.away_team)?.price,
              spread_home: fanduel.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.home_team)?.point,
              spread_odds_home: fanduel.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.home_team)?.price,
              spread_away: fanduel.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.away_team)?.point,
              spread_odds_away: fanduel.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.away_team)?.price,
              total: fanduel.markets.find(m => m.key === 'totals')?.outcomes[0]?.point,
              over: fanduel.markets.find(m => m.key === 'totals')?.outcomes.find(o => o.name === 'Over')?.price,
              under: fanduel.markets.find(m => m.key === 'totals')?.outcomes.find(o => o.name === 'Under')?.price,
            } : null,
            betmgm: betmgm ? {
              moneyline_home: betmgm.markets.find(m => m.key === 'h2h')?.outcomes.find(o => o.name === game.home_team)?.price,
              moneyline_away: betmgm.markets.find(m => m.key === 'h2h')?.outcomes.find(o => o.name === game.away_team)?.price,
              spread_home: betmgm.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.home_team)?.point,
              spread_odds_home: betmgm.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.home_team)?.price,
              spread_away: betmgm.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.away_team)?.point,
              spread_odds_away: betmgm.markets.find(m => m.key === 'spreads')?.outcomes.find(o => o.name === game.away_team)?.price,
              total: betmgm.markets.find(m => m.key === 'totals')?.outcomes[0]?.point,
              over: betmgm.markets.find(m => m.key === 'totals')?.outcomes.find(o => o.name === 'Over')?.price,
              under: betmgm.markets.find(m => m.key === 'totals')?.outcomes.find(o => o.name === 'Under')?.price,
            } : null
          }
        };
      });

      return {
        sport: sportKey,
        last_updated: new Date().toISOString(),
        games: games
      };
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
    refetchInterval: 60000, // Refresh every minute
    staleTime: 60000,
    enabled: canLookup() || hasLoadedOnce,
  });

  const handleRefresh = () => {
    if (!canLookup() && hasLoadedOnce) {
      setShowLimitModal(true);
      return;
    }
    refetch();
  };

  // Render single bookmaker for mobile
  const renderMobileBookmaker = (game, bookmaker, name, color) => {
    if (!bookmaker) return null;

    return (
      <div className={`bg-${color}-50 rounded-lg p-3 border-2 border-${color}-200`}>
        <div className={`font-bold text-${color}-800 mb-3 flex items-center gap-2 text-sm`}>
          <DollarSign className="w-4 h-4" />
          {name}
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Moneyline:</span>
            <div className="text-right">
              <div className="font-bold">
                {bookmaker.moneyline_home > 0 ? '+' : ''}{bookmaker.moneyline_home}
              </div>
              <div className="font-bold">
                {bookmaker.moneyline_away > 0 ? '+' : ''}{bookmaker.moneyline_away}
              </div>
            </div>
          </div>
          {bookmaker.spread_home && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Spread:</span>
              <div className="text-right">
                <div className="font-bold">
                  {bookmaker.spread_home > 0 ? '+' : ''}{bookmaker.spread_home} ({bookmaker.spread_odds_home > 0 ? '+' : ''}{bookmaker.spread_odds_home})
                </div>
                <div className="font-bold">
                  {bookmaker.spread_away > 0 ? '+' : ''}{bookmaker.spread_away} ({bookmaker.spread_odds_away > 0 ? '+' : ''}{bookmaker.spread_odds_away})
                </div>
              </div>
            </div>
          )}
          {bookmaker.total && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold">
                {bookmaker.total} (O: {bookmaker.over > 0 ? '+' : ''}{bookmaker.over}, U: {bookmaker.under > 0 ? '+' : ''}{bookmaker.under})
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Live Odds</h1>
                <p className="text-sm sm:text-base text-gray-600">Real-time odds from top sportsbooks</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || (!canLookup() && hasLoadedOnce)}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Odds
            </Button>
          </div>

          {oddsData?.last_updated && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="text-xs sm:text-sm text-gray-500">
                Live • Last updated: {new Date(oddsData.last_updated).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        {/* Sport Tabs - Mobile Optimized */}
        <Tabs value={selectedSport} onValueChange={setSelectedSport} className="mb-6 sm:mb-8">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="basketball_nba" className="text-xs sm:text-sm py-2">🏀 NBA</TabsTrigger>
            <TabsTrigger value="americanfootball_nfl" className="text-xs sm:text-sm py-2">🏈 NFL</TabsTrigger>
            <TabsTrigger value="baseball_mlb" className="text-xs sm:text-sm py-2">⚾ MLB</TabsTrigger>
            <TabsTrigger value="icehockey_nhl" className="text-xs sm:text-sm py-2">🏒 NHL</TabsTrigger>
            <TabsTrigger value="soccer_epl" className="text-xs sm:text-sm py-2">⚽ EPL</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isRefreshing && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
            <p className="text-gray-600 text-sm sm:text-base">Fetching live odds...</p>
          </div>
        )}

        {/* Odds Display - Mobile Optimized */}
        {!isRefreshing && oddsData?.games && oddsData.games.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            {oddsData.games.map((game, index) => (
              <motion.div
                key={game.game_id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 border-green-200">
                  <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 sm:p-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                          <span className="text-base sm:text-2xl font-bold text-gray-900 truncate">{game.home_team}</span>
                        </div>
                        <span className="text-gray-400 font-bold text-sm sm:text-base self-start sm:self-center">vs</span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-base sm:text-2xl font-bold text-gray-900 truncate">{game.away_team}</span>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {new Date(game.start_time).toLocaleString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {/* Desktop View - 3 columns */}
                    <div className="hidden md:grid md:grid-cols-3 gap-4">
                      {game.odds.draftkings && renderMobileBookmaker(game, game.odds.draftkings, "DraftKings", "orange")}
                      {game.odds.fanduel && renderMobileBookmaker(game, game.odds.fanduel, "FanDuel", "blue")}
                      {game.odds.betmgm && renderMobileBookmaker(game, game.odds.betmgm, "BetMGM", "yellow")}
                    </div>

                    {/* Mobile View - Swipeable/Tabs */}
                    <div className="md:hidden">
                      <Tabs defaultValue="draftkings" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                          {game.odds.draftkings && (
                            <TabsTrigger value="draftkings" className="text-xs">DK</TabsTrigger>
                          )}
                          {game.odds.fanduel && (
                            <TabsTrigger value="fanduel" className="text-xs">FD</TabsTrigger>
                          )}
                          {game.odds.betmgm && (
                            <TabsTrigger value="betmgm" className="text-xs">MGM</TabsTrigger>
                          )}
                        </TabsList>
                        
                        {game.odds.draftkings && (
                          <TabsContent value="draftkings">
                            {renderMobileBookmaker(game, game.odds.draftkings, "DraftKings", "orange")}
                          </TabsContent>
                        )}
                        {game.odds.fanduel && (
                          <TabsContent value="fanduel">
                            {renderMobileBookmaker(game, game.odds.fanduel, "FanDuel", "blue")}
                          </TabsContent>
                        )}
                        {game.odds.betmgm && (
                          <TabsContent value="betmgm">
                            {renderMobileBookmaker(game, game.odds.betmgm, "BetMGM", "yellow")}
                          </TabsContent>
                        )}
                      </Tabs>
                    </div>
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
              <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No Live Games</h3>
              <p className="text-sm sm:text-base text-gray-600">
                No upcoming {selectedSport} games found. Try refreshing or select another sport.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Banner */}
        <Card className="mt-6 sm:mt-8 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl sm:text-3xl">ℹ️</div>
              <div>
                <h4 className="font-bold text-blue-900 mb-2 text-sm sm:text-base">Live Data Powered by The Odds API</h4>
                <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                  <li>• Real-time odds from DraftKings, FanDuel, and BetMGM</li>
                  <li>• Data updates every minute automatically</li>
                  <li>• Compare odds across sportsbooks to find best value</li>
                  <li>• Always verify odds on sportsbook before placing bets</li>
                  <li>• 💡 This page counts as 1 of your free lookups</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
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