import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Zap, AlertTriangle, RefreshCw, TrendingUp, Trophy, Target } from "lucide-react";
import { motion } from "framer-motion";
import AIPredictionCard from "./AIPredictionCard";

export default function TodaysPredictions() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [activeTab, setActiveTab] = useState("games");

  const CACHE_HOURS = 6; // Cache predictions for 6 hours

  const generatePredictions = async () => {
    setIsGenerating(true);
    try {
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const todayDate = new Date().toISOString().split('T')[0];

      // Check cache first
      const cached = await base44.entities.CachedPredictions.filter({ prediction_date: todayDate });
      const now = new Date();
      
      if (cached.length > 0) {
        const cacheEntry = cached[0];
        const expiresAt = new Date(cacheEntry.expires_at);
        
        if (expiresAt > now && cacheEntry.predictions_data) {
          console.log('Using cached predictions');
          setPredictions(cacheEntry.predictions_data);
          setIsGenerating(false);
          return;
        }
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert sports analyst. Generate AI predictions for today's major sporting events.
Date: ${today}

Generate predictions for:
1. 3-5 major games happening today across NBA, NFL, NHL, Soccer (Premier League, La Liga, etc.), or MLB (if in season)
2. 3-5 key player performance predictions
3. 2-3 potential upset alerts where underdogs have a realistic chance

For each GAME prediction include:
- Teams, league, and matchup details
- Predicted winner with confidence score (0-100)
- Predicted score
- Win probabilities for each team (and draw if applicable)
- Key factors influencing the prediction
- Detailed reasoning
- Flag if it's a potential upset

For each PLAYER prediction include:
- Player name, team, position
- Predicted stats for the game (be specific: points, rebounds, yards, goals, etc.)
- Confidence score
- Trend (up/down/steady) and reason
- Reasoning based on matchup, recent form, etc.

For each UPSET ALERT include:
- Matchup details
- Upset probability percentage
- Factors that could cause the upset
- Detailed reasoning

Be realistic and base predictions on actual current season data, injuries, matchups, and trends.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            game_predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  home_team: { type: "string" },
                  away_team: { type: "string" },
                  league: { type: "string" },
                  sport: { type: "string" },
                  match_date: { type: "string" },
                  predicted_winner: { type: "string" },
                  predicted_score: { type: "string" },
                  confidence: { type: "number" },
                  home_win_prob: { type: "number" },
                  away_win_prob: { type: "number" },
                  draw_prob: { type: "number" },
                  key_factors: { type: "array", items: { type: "string" } },
                  reasoning: { type: "string" },
                  is_upset_alert: { type: "boolean" }
                }
              }
            },
            player_predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  player_name: { type: "string" },
                  team: { type: "string" },
                  position: { type: "string" },
                  sport: { type: "string" },
                  predicted_stats: { type: "string" },
                  confidence: { type: "number" },
                  trend: { type: "string" },
                  trend_reason: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            upset_alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  matchup: { type: "string" },
                  sport: { type: "string" },
                  upset_probability: { type: "number" },
                  underdog: { type: "string" },
                  factors: { type: "array", items: { type: "string" } },
                  reasoning: { type: "string" }
                }
              }
            },
            generated_at: { type: "string" }
          }
        }
      });

      // Cache the result for 6 hours
      const expiresAt = new Date(now.getTime() + CACHE_HOURS * 60 * 60 * 1000);
      if (cached.length > 0) {
        await base44.entities.CachedPredictions.delete(cached[0].id);
      }
      await base44.entities.CachedPredictions.create({
        prediction_date: todayDate,
        predictions_data: result,
        expires_at: expiresAt.toISOString()
      });

      setPredictions(result);
    } catch (error) {
      console.error("Failed to generate predictions:", error);
      setPredictions(null);
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">AI Predictions</h2>
                <p className="text-gray-600">Game outcomes & player performance forecasts</p>
                <p className="text-amber-600 text-xs">⏱️ Predictions refreshed every 6 hours</p>
              </div>
            </div>
            <Button
              onClick={generatePredictions}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-6 py-3"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Generate Today's Predictions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isGenerating && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-2 border-purple-100 animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-purple-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-purple-100 rounded w-2/3 mb-2" />
                <div className="h-4 bg-purple-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-purple-600">
              <Brain className="w-5 h-5 animate-pulse" />
              <span className="font-medium">AI is analyzing real-time data...</span>
            </div>
          </div>
        </div>
      )}

      {/* Predictions Display */}
      {predictions && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border-2 border-purple-200">
              <TabsTrigger 
                value="games"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Games ({predictions.game_predictions?.length || 0})
              </TabsTrigger>
              <TabsTrigger 
                value="players"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold"
              >
                <Target className="w-4 h-4 mr-2" />
                Players ({predictions.player_predictions?.length || 0})
              </TabsTrigger>
              <TabsTrigger 
                value="upsets"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Upsets ({predictions.upset_alerts?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="games">
              <div className="grid md:grid-cols-2 gap-4">
                {predictions.game_predictions?.map((pred, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <AIPredictionCard prediction={pred} type="game" />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="players">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictions.player_predictions?.map((pred, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <AIPredictionCard prediction={pred} type="player" />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="upsets">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictions.upset_alerts?.map((pred, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <AIPredictionCard prediction={pred} type="upset" />
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Generated timestamp */}
          <div className="text-center text-sm text-gray-500 mt-4">
            Generated at {new Date().toLocaleTimeString()}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!predictions && !isGenerating && (
        <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
          <CardContent className="p-12 text-center">
            <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Predictions Yet</h3>
            <p className="text-gray-600 mb-6">
              Click the button above to generate AI-powered predictions for today's games
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge className="bg-purple-100 text-purple-700">Game Outcomes</Badge>
              <Badge className="bg-emerald-100 text-emerald-700">Player Stats</Badge>
              <Badge className="bg-orange-100 text-orange-700">Upset Alerts</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}