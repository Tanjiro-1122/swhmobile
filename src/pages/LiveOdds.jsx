import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, RefreshCw, DollarSign, Home, Plane, AlertCircle, BarChart3, Bookmark, BookmarkCheck, Sparkles, LineChart, Target, TrendingDown, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import { useNavigate } from 'react-router-dom';

function LiveOddsContent() {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState("basketball_nba");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [oddsData, setOddsData] = useState([]);
  const [error, setError] = useState(null);
  const [analyzingGame, setAnalyzingGame] = useState(null);
  const [_expandedGame, setExpandedGame] = useState(null);
  const queryClient = useQueryClient();

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier } = useFreeLookupTracker();

  const isPaidMember = userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly';
  const isVIPorLegacy = userTier === 'legacy' || userTier === 'vip_annual';

  // Fetch saved odds
  const { data: savedOdds = [] } = useQuery({
    queryKey: ['savedOdds'],
    queryFn: async () => {
      try {
        return await base44.entities.SavedOdds.filter({ is_active: true }, '-created_date');
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated
  });

  const sportKeys = {
    "NBA": "basketball_nba",
    "NFL": "americanfootball_nfl",
    "MLB": "baseball_mlb",
    "NHL": "icehockey_nhl",
    "Soccer": "soccer_epl"
  };

  // Save odds mutation
  const saveOddsMutation = useMutation({
    mutationFn: async (oddsData) => {
      return await base44.entities.SavedOdds.create(oddsData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedOdds'] });
    }
  });

  // Generate simulated odds history for visualization
  const generateOddsHistory = (currentOdds, openingOdds) => {
    const history = [];
    const now = new Date();
    const hoursBack = 24;
    
    for (let i = hoursBack; i >= 0; i -= 2) {
      const timestamp = new Date(now - i * 60 * 60 * 1000);
      const progress = (hoursBack - i) / hoursBack;
      const oddsValue = openingOdds + (currentOdds - openingOdds) * progress + (Math.random() * 10 - 5);
      
      history.push({
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        odds: Math.round(oddsValue)
      });
    }
    
    return history;
  };

  const analyzeOddsValue = async (game, betType, marketDescription, currentOdds, openingOdds) => {
    setAnalyzingGame(`${game.game_id}-${betType}`);
    
    try {
      const oddsHistory = generateOddsHistory(currentOdds, openingOdds);
      
      const response = await base44.functions.invoke('analyzeOddsValue', {
        match_description: `${game.away_team} @ ${game.home_team}`,
        sport: game.sport_title,
        league: selectedSport,
        bet_type: betType,
        market_description: marketDescription,
        current_odds: currentOdds,
        opening_odds: openingOdds,
        odds_history: oddsHistory
      });

      // Update the game with AI analysis
      setOddsData(prev => prev.map(g => {
        if (g.game_id === game.game_id) {
          return {
            ...g,
            ai_analysis: {
              ...g.ai_analysis,
              [betType]: response.data.analysis
            },
            odds_history: {
              ...g.odds_history,
              [betType]: oddsHistory
            }
          };
        }
        return g;
      }));

      // Auto-expand to show analysis
      setExpandedGame(`${game.game_id}-${betType}`);
      
    } catch (err) {
      console.error('Error analyzing odds:', err);
    } finally {
      setAnalyzingGame(null);
    }
  };

  const handleSaveOdds = async (game, betType, marketDescription, currentOdds, openingOdds) => {
    const oddsHistory = generateOddsHistory(currentOdds, openingOdds);
    const analysis = game.ai_analysis?.[betType];
    
    await saveOddsMutation.mutateAsync({
      match_description: `${game.away_team} @ ${game.home_team}`,
      sport: game.sport_title,
      league: selectedSport,
      match_date: game.start_time,
      bet_type: betType,
      market_description: marketDescription,
      odds_history: oddsHistory,
      current_odds: currentOdds,
      opening_odds: openingOdds,
      is_value_bet: analysis?.is_value_bet || false,
      value_score: analysis?.value_score || 0,
      ai_analysis: analysis ? {
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        expected_value: analysis.expected_value
      } : null
    });
  };

  const isOddsSaved = (game, betType) => {
    return savedOdds.some(saved => 
      saved.match_description === `${game.away_team} @ ${game.home_team}` &&
      saved.bet_type === betType
    );
  };

  const fetchLiveOdds = async (sportKey) => {
    if (!isPaidMember) {
      if (!canLookup() && !hasLoadedOnce) {
        setShowLimitModal(true);
        return;
      }
    }

    setIsRefreshing(true);
    setError(null);
    
    try {
      const resp = await fetch(`/api/getLiveOdds?sport=${encodeURIComponent(sportKey)}`, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const response = { data: await resp.json() };

      if (response.data.error) {
        throw new Error(response.data.error);
      }
      const data = response.data;

      if (!isPaidMember && !hasLoadedOnce) {
        recordLookup();
        setHasLoadedOnce(true);
      }

      const games = (data.games || data).map(game => {
        const draftkings = game.bookmakers?.find(b => b.key === 'draftkings');
        const fanduel = game.bookmakers?.find(b => b.key === 'fanduel');
        const betmgm = game.bookmakers?.find(b => b.key === 'betmgm');

        let sharpPublicIndicator = null;
        if (isVIPorLegacy && draftkings && fanduel) {
          const dkHomeML = draftkings.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.home_team)?.price;
          const fdHomeML = fanduel.markets?.find(m => m.key === 'h2h')?.outcomes?.find(o => o.name === game.home_team)?.price;
          
          if (dkHomeML !== undefined && dkHomeML !== null && fdHomeML !== undefined && fdHomeML !== null) {
            const randomFactor = Math.random() * 20 - 10;
            const publicPercentHome = 50 + randomFactor;
            const sharpPercentHome = 50 - randomFactor * 0.8;

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
          ai_analysis: {},
          odds_history: {},
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSport]);

  const formatOdds = (odds) => {
    if (odds === null || odds === undefined) return 'N/A';
    const rounded = Math.round(odds);
    return rounded > 0 ? `+${rounded}` : rounded.toString();
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

  const getRecommendationColor = (rec) => {
    const colors = {
      strong_buy: 'bg-green-100 text-green-800 border-green-300',
      buy: 'bg-blue-100 text-blue-800 border-blue-300',
      hold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      avoid: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[rec] || colors.hold;
  };

  const getRecommendationIcon = (rec) => {
    if (rec === 'strong_buy') return '🔥';
    if (rec === 'buy') return '✅';
    if (rec === 'hold') return '⚖️';
    return '❌';
  };

  const renderMarketAnalysis = (game, betType, marketDesc, currentOdds, openingOdds) => {
    const marketKey = `${game.game_id}-${betType}`;
    const analysis = game.ai_analysis?.[betType];
    const history = game.odds_history?.[betType];
    const isAnalyzing = analyzingGame === marketKey;
    const isSaved = isOddsSaved(game, betType);

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
      <button
        onClick={() => navigate(createPageUrl("Dashboard"))}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#888", fontSize: 14, padding: "12px 16px 4px",
          fontWeight: 500
        }}
      >
        ← Back
      </button>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h5 className="font-bold text-gray-900">{marketDesc}</h5>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{formatOdds(currentOdds)}</Badge>
              {openingOdds && openingOdds !== currentOdds && (
                <div className="flex items-center gap-1 text-xs">
                  {currentOdds > openingOdds ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className="text-gray-600">from {formatOdds(openingOdds)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysis && (
              <Badge className={`${getRecommendationColor(analysis.recommendation)} border-2 px-3 py-1`}>
                {getRecommendationIcon(analysis.recommendation)} {analysis.recommendation.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSaveOdds(game, betType, marketDesc, currentOdds, openingOdds)}
              disabled={isSaved}
              className={isSaved ? 'bg-green-50 border-green-300' : ''}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {!analysis && !isAnalyzing && (
          <Button
            size="sm"
            onClick={() => analyzeOddsValue(game, betType, marketDesc, currentOdds, openingOdds)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze Value
          </Button>
        )}

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-purple-600">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="text-sm font-semibold">Analyzing odds value...</span>
          </div>
        )}

        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4"
            >
              {/* AI Analysis */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h6 className="font-bold text-purple-900">AI Analysis</h6>
                  <Badge className="bg-purple-600 text-white">
                    {analysis.confidence}% Confidence
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-3">{analysis.reasoning}</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="text-xs text-gray-600">Expected Value</div>
                    <div className={`text-lg font-bold ${analysis.expected_value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.expected_value > 0 ? '+' : ''}{analysis.expected_value.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="text-xs text-gray-600">Value Score</div>
                    <div className="text-lg font-bold text-purple-600">
                      {analysis.value_score}/100
                    </div>
                  </div>
                </div>

                {analysis.key_factors && analysis.key_factors.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Key Factors:</div>
                    <div className="space-y-1">
                      {analysis.key_factors.map((factor, idx) => (
                        <div key={idx} className="text-xs text-gray-700">• {factor}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Odds Movement Chart */}
              {history && history.length > 0 && (
                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <LineChart className="w-5 h-5 text-blue-600" />
                    <h6 className="font-bold text-gray-900">24-Hour Odds Movement</h6>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsLineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="odds" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-600 mt-2 text-center italic">
                    Odds movement over the last 24 hours (simulated data)
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Back to Dashboard */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
      </div>
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
        isAuthenticated={isAuthenticated}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Live Odds</h1>
              <p className="text-gray-600">
                {isPaidMember ? '♾️ Unlimited access + AI-powered value analysis' : 'Compare real-time odds from top sportsbooks'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {savedOdds.length > 0 && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/SavedResults'}
                className="border-2 border-purple-300 hover:bg-purple-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Saved ({savedOdds.length})
              </Button>
            )}
            <Button
              onClick={() => fetchLiveOdds(selectedSport)}
              disabled={isRefreshing}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Odds'}
            </Button>
          </div>
        </div>

        {/* AI Value Bets Alert */}
        {isPaidMember && (
          <Alert className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <AlertDescription className="text-purple-900 font-semibold">
              🎯 <strong>AI-Powered Feature:</strong> Click "Analyze Value" on any market to get real-time odds analysis, 
              value scores, and expected value calculations. Track odds movement over 24 hours!
            </AlertDescription>
          </Alert>
        )}

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
                                    <Plane className="w-6 h-6 text-blue-300" />
                                    {game.away_team}
                                  </div>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Home className="w-6 h-6 text-green-300" />
                                    {game.home_team}
                                  </div>
                                </CardTitle>
                                <p className="text-sm text-blue-100">
                                  {formatDate(game.start_time)}
                                </p>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="p-6">
                            {/* Sharp/Public Money Indicator */}
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
                              </div>
                            )}

                            {/* AI-Enhanced Markets */}
                            {isPaidMember && (
                              <div className="space-y-4 mb-6">
                                <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                  <Target className="w-5 h-5 text-purple-600" />
                                  AI Value Analysis
                                </h4>
                                
                                {/* Moneyline Analysis */}
                                {game.odds.draftkings?.moneyline_home && (
                                  <div className="space-y-3">
                                    {renderMarketAnalysis(
                                      game,
                                      'moneyline_home',
                                      `${game.home_team} ML`,
                                      game.odds.draftkings.moneyline_home,
                                      game.odds.draftkings.moneyline_home + (Math.random() * 20 - 10)
                                    )}
                                    {renderMarketAnalysis(
                                      game,
                                      'moneyline_away',
                                      `${game.away_team} ML`,
                                      game.odds.draftkings.moneyline_away,
                                      game.odds.draftkings.moneyline_away + (Math.random() * 20 - 10)
                                    )}
                                  </div>
                                )}

                                {/* Spread Analysis */}
                                {game.odds.draftkings?.spread_home && (
                                  <div className="space-y-3">
                                    {renderMarketAnalysis(
                                      game,
                                      'spread_home',
                                      `${game.home_team} ${game.odds.draftkings.spread_home > 0 ? '+' : ''}${game.odds.draftkings.spread_home}`,
                                      game.odds.draftkings.spread_odds_home,
                                      game.odds.draftkings.spread_odds_home + (Math.random() * 20 - 10)
                                    )}
                                  </div>
                                )}

                                {/* Total Analysis */}
                                {game.odds.draftkings?.total && (
                                  <div className="space-y-3">
                                    {renderMarketAnalysis(
                                      game,
                                      'over',
                                      `Over ${game.odds.draftkings.total}`,
                                      game.odds.draftkings.over,
                                      game.odds.draftkings.over + (Math.random() * 20 - 10)
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Standard Odds Tables */}
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
                                          <span className="text-xs text-gray-600">Home</span>
                                          <span className="font-bold text-gray-900">
                                            {formatOdds(game.odds[book]?.moneyline_home)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-600">Away</span>
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
                                          <span className="text-xs text-gray-600">Home</span>
                                          <span className="font-bold text-gray-900">
                                            {game.odds[book]?.spread_home ? 
                                              `${game.odds[book].spread_home > 0 ? '+' : ''}${game.odds[book].spread_home} (${formatOdds(game.odds[book].spread_odds_home)})` 
                                              : 'N/A'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-600">Away</span>
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

                              {/* Total */}
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
            Always verify odds directly with the sportsbook before placing bets. {isVIPorLegacy && 'Sharp/Public money indicators and odds history are simulated for demonstration purposes.'}
            {isPaidMember && ' AI analysis is for informational purposes only and should not be considered financial advice.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LiveOdds() {
  // Live Odds is now free for all users (part of free tier value)
  return <LiveOddsContent />;
}