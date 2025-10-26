import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Search, Zap, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveOdds() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [oddsData, setOddsData] = useState(null);
  const [selectedSport, setSelectedSport] = useState("all");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a sports odds analyst with INTERNET ACCESS. Fetch CURRENT LIVE ODDS from the web.

SEARCH QUERY: "${searchQuery}"
TODAY: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

CRITICAL: You have internet access. Search these sources:
1. Odds Shark (oddsshark.com)
2. The Action Network (actionnetwork.com)
3. ESPN betting section
4. DraftKings or FanDuel odds pages

TASK: Find CURRENT BETTING ODDS for this match or sport.

Return odds from 3-5 major sportsbooks:
- DraftKings
- FanDuel
- BetMGM
- Caesars
- PointsBet

For EACH sportsbook provide:
1. Moneyline odds (Home / Away)
2. Spread (e.g., "-5.5 (-110)")
3. Over/Under total (e.g., "225.5")
4. Opening odds (if available)
5. Line movement: "up" or "down" or "stable"

Also provide:
- Best available odds (highest value for each bet type)
- Line movement summary
- Which way public is betting
- Sharp money indicators

Return valid JSON with current odds data.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            match_description: { type: "string" },
            sport: { type: "string" },
            game_time: { type: "string" },
            sportsbooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  moneyline_home: { type: "string" },
                  moneyline_away: { type: "string" },
                  spread_home: { type: "string" },
                  spread_away: { type: "string" },
                  total: { type: "string" },
                  total_over: { type: "string" },
                  total_under: { type: "string" },
                  line_movement: { type: "string" }
                }
              }
            },
            best_odds: {
              type: "object",
              properties: {
                moneyline_home: { type: "object" },
                moneyline_away: { type: "object" },
                spread_home: { type: "object" },
                spread_away: { type: "object" },
                total_over: { type: "object" },
                total_under: { type: "object" }
              }
            },
            line_movement_summary: { type: "string" },
            public_betting: { type: "string" },
            sharp_money: { type: "string" }
          }
        }
      });

      setOddsData(result);
    } catch (error) {
      console.error("Error fetching odds:", error);
    }
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Live Odds Comparison</h1>
              <p className="text-gray-600">Compare odds across multiple sportsbooks in real-time</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-8 border-2 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for any game (e.g., 'Lakers vs Celtics odds')"
                  className="pl-12 h-14 text-lg"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="h-14 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isSearching ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Get Live Odds
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Odds Display */}
        {oddsData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Match Header */}
            <Card className="border-2 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{oddsData.match_description}</h2>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-indigo-100 text-indigo-800">{oddsData.sport}</Badge>
                      {oddsData.game_time && (
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {oddsData.game_time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Line Movement Summary */}
                {oddsData.line_movement_summary && (
                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      <span className="font-bold text-gray-900">Line Movement</span>
                    </div>
                    <p className="text-sm text-gray-700">{oddsData.line_movement_summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Odds Comparison Table */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl">Odds Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="moneyline" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="moneyline">Moneyline</TabsTrigger>
                    <TabsTrigger value="spread">Spread</TabsTrigger>
                    <TabsTrigger value="total">Over/Under</TabsTrigger>
                  </TabsList>

                  <TabsContent value="moneyline">
                    <div className="space-y-3">
                      {oddsData.sportsbooks?.map((book, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                        >
                          <div className="font-bold text-gray-900 w-32">{book.name}</div>
                          <div className="flex gap-8">
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Home</div>
                              <div className="text-lg font-bold text-indigo-600">{book.moneyline_home}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Away</div>
                              <div className="text-lg font-bold text-purple-600">{book.moneyline_away}</div>
                            </div>
                          </div>
                          {book.line_movement && (
                            <Badge className={
                              book.line_movement === 'up' ? 'bg-green-100 text-green-800' :
                              book.line_movement === 'down' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {book.line_movement === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                              {book.line_movement === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
                              {book.line_movement}
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="spread">
                    <div className="space-y-3">
                      {oddsData.sportsbooks?.map((book, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                        >
                          <div className="font-bold text-gray-900 w-32">{book.name}</div>
                          <div className="flex gap-8">
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Home</div>
                              <div className="text-lg font-bold text-indigo-600">{book.spread_home}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Away</div>
                              <div className="text-lg font-bold text-purple-600">{book.spread_away}</div>
                            </div>
                          </div>
                          {book.line_movement && (
                            <Badge className={
                              book.line_movement === 'up' ? 'bg-green-100 text-green-800' :
                              book.line_movement === 'down' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {book.line_movement}
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="total">
                    <div className="space-y-3">
                      {oddsData.sportsbooks?.map((book, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                        >
                          <div className="font-bold text-gray-900 w-32">{book.name}</div>
                          <div className="flex gap-8">
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Total</div>
                              <div className="text-lg font-bold text-gray-900">{book.total}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Over</div>
                              <div className="text-lg font-bold text-green-600">{book.total_over}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">Under</div>
                              <div className="text-lg font-bold text-red-600">{book.total_under}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Best Odds Summary */}
            {oddsData.best_odds && (
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Zap className="w-6 h-6" />
                    Best Available Odds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {oddsData.best_odds.moneyline_home && (
                      <div className="p-4 bg-white rounded-lg border-2 border-green-300">
                        <div className="text-sm text-gray-600 mb-1">Best Home Moneyline</div>
                        <div className="text-2xl font-bold text-green-600">
                          {oddsData.best_odds.moneyline_home.odds}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          at {oddsData.best_odds.moneyline_home.book}
                        </div>
                      </div>
                    )}
                    {oddsData.best_odds.spread_home && (
                      <div className="p-4 bg-white rounded-lg border-2 border-green-300">
                        <div className="text-sm text-gray-600 mb-1">Best Home Spread</div>
                        <div className="text-2xl font-bold text-green-600">
                          {oddsData.best_odds.spread_home.line}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          at {oddsData.best_odds.spread_home.book}
                        </div>
                      </div>
                    )}
                    {oddsData.best_odds.total_over && (
                      <div className="p-4 bg-white rounded-lg border-2 border-green-300">
                        <div className="text-sm text-gray-600 mb-1">Best Over</div>
                        <div className="text-2xl font-bold text-green-600">
                          {oddsData.best_odds.total_over.total}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          at {oddsData.best_odds.total_over.book}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Insights */}
            <div className="grid md:grid-cols-2 gap-6">
              {oddsData.public_betting && (
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Public Betting
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{oddsData.public_betting}</p>
                  </CardContent>
                </Card>
              )}
              {oddsData.sharp_money && (
                <Card className="border-2 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-600" />
                      Sharp Money
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{oddsData.sharp_money}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!oddsData && !isSearching && (
          <div className="text-center py-20">
            <DollarSign className="w-20 h-20 mx-auto mb-6 text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Find the Best Odds</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Search for any game to compare live odds across major sportsbooks and find the best value for your bets
            </p>
          </div>
        )}
      </div>
    </div>
  );
}