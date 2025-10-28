
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Calendar, Mail, Settings, RefreshCw, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import RequireAuth from "../components/auth/RequireAuth";

function BettingBriefsContent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [briefData, setBriefData] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
  });

  const isVIPorLegacy = currentUser?.subscription_type === 'vip_annual' || currentUser?.subscription_type === 'legacy';

  // Default preferences if user hasn't set any
  const [preferences, setPreferences] = useState({
    sports: ['NBA', 'NFL', 'MLB', 'NHL'],
    frequency: 'daily',
    email_delivery: true,
  });

  const generateBrief = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports betting analyst creating a personalized betting brief for TODAY.

TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

USER PREFERENCES:
- Sports: ${preferences.sports.join(', ')}

REQUIRED SECTIONS:

1. TODAY'S TOP 3 BETTING OPPORTUNITIES
   For each opportunity provide:
   - Sport & Matchup (e.g., "NBA: Lakers vs Celtics")
   - Recommended Bet (e.g., "Lakers -5.5", "Over 225.5")
   - Current Odds (from DraftKings/FanDuel)
   - Confidence Level (High/Medium/Low)
   - Key Reasoning (2-3 specific stats/factors)

2. INJURY REPORT IMPACT (Top 3 Most Impactful)
   - Player Name & Team
   - Injury Status
   - Impact on betting lines
   - Recommended action (e.g., "Avoid betting on this team", "Fade the public overreaction")

3. LINE MOVEMENT ALERTS (Top 3)
   - Matchup
   - Line movement (e.g., "Lakers opened -3, now -5.5")
   - Possible reason for movement
   - Sharp vs Public money indication if available

4. TRENDS TO WATCH
   - 3-4 statistical trends across requested sports
   - E.g., "Home teams in NBA covering 68% of spreads this week"
   - How to exploit these trends

5. GAMES TO AVOID
   - 2-3 games with too much uncertainty
   - Why to avoid them

Use REAL current data from StatMuse, ESPN, and official league sources.
Be specific with numbers, team names, and current odds.
Format with clear headers and bullet points.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            generated_date: { type: "string" },
            top_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sport: { type: "string" },
                  matchup: { type: "string" },
                  recommended_bet: { type: "string" },
                  odds: { type: "string" },
                  confidence: { type: "string" },
                  reasoning: { type: "array", items: { type: "string" } }
                }
              }
            },
            injury_alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  player: { type: "string" },
                  team: { type: "string" },
                  status: { type: "string" },
                  betting_impact: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            line_movements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  matchup: { type: "string" },
                  movement: { type: "string" },
                  reason: { type: "string" },
                  sharp_public_indicator: { type: "string" }
                }
              }
            },
            trends: {
              type: "array",
              items: { type: "string" }
            },
            games_to_avoid: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  matchup: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setBriefData(result);
    } catch (error) {
      console.error("Failed to generate brief:", error);
    }
    setIsGenerating(false);
  };

  const toggleSport = (sport) => {
    setPreferences(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  if (!isVIPorLegacy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-12 text-center">
              <Crown className="w-20 h-20 mx-auto mb-6 text-yellow-600" />
              <h2 className="text-3xl font-black text-gray-900 mb-4">
                VIP & Legacy Members Only
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                Daily Personalized Betting Briefs are an exclusive feature for VIP Annual and Legacy members.
              </p>
              <Button
                onClick={() => window.location.href = '/Pricing'}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold px-8 py-6 text-lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to VIP
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-5xl font-black text-gray-900">Daily Betting Brief</h1>
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold px-3 py-1">
                  VIP EXCLUSIVE
                </Badge>
              </div>
              <p className="text-xl text-gray-600">AI-powered personalized betting insights</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="brief" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-14 bg-white/80 backdrop-blur-sm border-2 border-purple-200">
            <TabsTrigger value="brief" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Sparkles className="w-5 h-5 mr-2" />
              Today's Brief
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Settings className="w-5 h-5 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brief">
            {!briefData && (
              <Card className="border-2 border-purple-200 bg-white">
                <CardContent className="p-12 text-center">
                  <Sparkles className="w-20 h-20 mx-auto mb-6 text-purple-500" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Ready for Today's Betting Intel?
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Get AI-powered analysis of today's best betting opportunities, injury impacts, line movements, and trends across your favorite sports.
                  </p>
                  <Button
                    onClick={generateBrief}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-8 py-6 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                        Generating Your Brief...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-3" />
                        Generate Today's Brief
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 mt-4">
                    ⏱️ Takes about 30 seconds to analyze live data
                  </p>
                </CardContent>
              </Card>
            )}

            {briefData && (
              <div className="space-y-6">
                {/* Header with date and refresh */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="text-lg font-semibold text-gray-900">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <Button
                    onClick={generateBrief}
                    disabled={isGenerating}
                    variant="outline"
                    className="border-2 border-purple-500 text-purple-700 hover:bg-purple-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700 mr-2" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Brief
                      </>
                    )}
                  </Button>
                </div>

                {/* Top Opportunities */}
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-6 h-6" />
                      🎯 Top 3 Betting Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {briefData.top_opportunities?.map((opp, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-lg p-5 border-2 border-green-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Badge className="bg-green-100 text-green-800 border-green-300 mb-2">
                              {opp.sport}
                            </Badge>
                            <h4 className="text-xl font-bold text-gray-900">{opp.matchup}</h4>
                          </div>
                          <Badge className={
                            opp.confidence === 'High' ? 'bg-green-500 text-white' :
                            opp.confidence === 'Medium' ? 'bg-yellow-500 text-white' :
                            'bg-orange-500 text-white'
                          }>
                            {opp.confidence} Confidence
                          </Badge>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 mb-3">
                          <div className="text-2xl font-black text-green-700 mb-1">
                            {opp.recommended_bet}
                          </div>
                          <div className="text-sm text-gray-600">Odds: {opp.odds}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="font-semibold text-gray-900 text-sm">Why this bet:</div>
                          {opp.reasoning?.map((reason, ridx) => (
                            <div key={ridx} className="flex items-start gap-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* Injury Alerts */}
                <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
                  <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                    <CardTitle>🏥 Critical Injury Report</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {briefData.injury_alerts?.map((injury, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border-2 border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-bold text-gray-900 text-lg">{injury.player}</span>
                            <span className="text-gray-600 ml-2">({injury.team})</span>
                          </div>
                          <Badge className={
                            injury.status === 'Out' ? 'bg-red-500 text-white' :
                            injury.status === 'Questionable' ? 'bg-yellow-500 text-white' :
                            'bg-orange-500 text-white'
                          }>
                            {injury.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Impact:</strong> {injury.betting_impact}
                        </p>
                        <p className="text-sm font-semibold text-red-700">
                          💡 {injury.recommendation}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Line Movements */}
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                    <CardTitle>📊 Line Movement Alerts</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {briefData.line_movements?.map((line, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border-2 border-blue-200">
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{line.matchup}</h4>
                        <div className="bg-blue-50 rounded p-3 mb-2">
                          <p className="text-sm font-semibold text-blue-900">{line.movement}</p>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Reason:</strong> {line.reason}
                        </p>
                        {line.sharp_public_indicator && (
                          <p className="text-sm font-semibold text-blue-700">
                            💰 {line.sharp_public_indicator}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Trends */}
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <CardTitle>📈 Trends to Watch</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {briefData.trends?.map((trend, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-4 border-2 border-purple-200">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-700 font-bold text-sm">{idx + 1}</span>
                          </div>
                          <p className="text-gray-800">{trend}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Games to Avoid */}
                <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
                  <CardHeader className="bg-gradient-to-r from-gray-600 to-slate-600 text-white">
                    <CardTitle>⚠️ Games to Avoid</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {briefData.games_to_avoid?.map((game, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border-2 border-gray-300">
                        <h4 className="font-bold text-gray-900 mb-2">{game.matchup}</h4>
                        <p className="text-sm text-gray-700">{game.reason}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-2 border-purple-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Brief Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Sports Selection */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-3 block">
                    Select Sports for Your Brief:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'NCAAF', 'NCAAB'].map((sport) => (
                      <div key={sport} className="flex items-center space-x-2">
                        <Checkbox
                          id={sport}
                          checked={preferences.sports.includes(sport)}
                          onCheckedChange={() => toggleSport(sport)}
                        />
                        <label
                          htmlFor={sport}
                          className="text-sm font-medium text-gray-900 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {sport}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Delivery */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="email_delivery"
                      checked={preferences.email_delivery}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, email_delivery: checked }))}
                    />
                    <div>
                      <label
                        htmlFor="email_delivery"
                        className="text-sm font-semibold text-gray-900 cursor-pointer block mb-1"
                      >
                        Email Delivery
                      </label>
                      <p className="text-sm text-gray-700">
                        Receive your daily betting brief via email every morning at 8 AM
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Pro Tip:</strong> Your preferences are saved automatically. Changes will take effect for tomorrow's brief.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function BettingBriefs() {
  return (
    <RequireAuth pageName="Betting Briefs">
      <BettingBriefsContent />
    </RequireAuth>
  );
}
