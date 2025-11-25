import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, RefreshCw, DollarSign, Home, Plane, AlertCircle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../auth/FreeLookupTracker";

export default function LiveOddsContent() {
  const [selectedSport, setSelectedSport] = useState("basketball_nba");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [oddsData, setOddsData] = useState([]);
  const [error, setError] = useState(null);

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier } = useFreeLookupTracker();
  const isPaidMember = userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly';

  const sportKeys = {
    "NBA": "basketball_nba",
    "NFL": "americanfootball_nfl",
    "MLB": "baseball_mlb",
    "NHL": "icehockey_nhl",
    "Soccer": "soccer_epl"
  };

  const fetchLiveOdds = async (sportKey) => {
    if (!isPaidMember && !canLookup() && !hasLoadedOnce) {
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

      if (!response.ok) throw new Error('Failed to fetch odds');
      const data = await response.json();

      if (!isPaidMember && !hasLoadedOnce) {
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
              total: draftkings.markets?.find(m => m.key === 'totals')?.outcomes?.[0]?.point,
              over: draftkings.markets?.find(m => m.key === 'totals')?.outcomes?.find(o => o.name === 'Over')?.price,
              under: draftkings.markets?.find(m => m.key === 'totals')?.outcomes?.find(o => o.name === 'Under')?.price,
            } : null,
            fanduel: fanduel ? {
              moneyline_home: fanduel.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.home_team)?.price,
              moneyline_away: fanduel.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.away_team)?.price,
              total: fanduel.markets?.find(m => m.key === 'totals')?.outcomes?.[0]?.point,
              over: fanduel.markets?.find(m => m.key === 'totals')?.outcomes?.find(o => o.name === 'Over')?.price,
              under: fanduel.markets?.find(m => m.key === 'totals')?.outcomes?.find(o => o.name === 'Under')?.price,
            } : null,
            betmgm: betmgm ? {
              moneyline_home: betmgm.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.home_team)?.price,
              moneyline_away: betmgm.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.away_team)?.price,
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
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal show={showLimitModal} onClose={() => setShowLimitModal(false)} lookupsRemaining={lookupsRemaining} />

      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {isPaidMember ? '♾️ Unlimited access' : 'Compare real-time odds from top sportsbooks'}
        </p>
        <Button
          onClick={() => fetchLiveOdds(selectedSport)}
          disabled={isRefreshing}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Odds'}
        </Button>
      </div>

      <Tabs value={selectedSport} onValueChange={setSelectedSport}>
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="basketball_nba" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">NBA</TabsTrigger>
          <TabsTrigger value="americanfootball_nfl" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">NFL</TabsTrigger>
          <TabsTrigger value="baseball_mlb" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">MLB</TabsTrigger>
          <TabsTrigger value="icehockey_nhl" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">NHL</TabsTrigger>
          <TabsTrigger value="soccer_epl" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Soccer</TabsTrigger>
        </TabsList>

        {error && (
          <Card className="bg-red-50 border-2 border-red-200 mt-4">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {isRefreshing && oddsData.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-700 font-semibold">Loading live odds...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {oddsData.length === 0 ? (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Games Found</h3>
                  <p className="text-gray-600">No upcoming games available. Try another sport.</p>
                </CardContent>
              </Card>
            ) : (
              oddsData.map((game, index) => (
                <motion.div
                  key={game.game_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-2 border-gray-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-lg font-bold">
                            <Plane className="w-5 h-5" />
                            {game.away_team}
                          </div>
                          <div className="flex items-center gap-2 text-lg font-bold mt-1">
                            <Home className="w-5 h-5" />
                            {game.home_team}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {formatDate(game.start_time)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        {['draftkings', 'fanduel', 'betmgm'].map((book) => (
                          <div key={book} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="text-xs font-bold text-gray-600 mb-2 uppercase">
                              {book === 'draftkings' ? 'DraftKings' : book === 'fanduel' ? 'FanDuel' : 'BetMGM'}
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Home ML:</span>
                                <span className="font-bold">{formatOdds(game.odds[book]?.moneyline_home)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Away ML:</span>
                                <span className="font-bold">{formatOdds(game.odds[book]?.moneyline_away)}</span>
                              </div>
                              {game.odds[book]?.total && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total:</span>
                                  <span className="font-bold">{game.odds[book]?.total}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </Tabs>
    </div>
  );
}