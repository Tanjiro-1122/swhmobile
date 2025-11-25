import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Zap, Target, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AIPredictionCard({ prediction, type = "game" }) {
  const getConfidenceColor = (confidence) => {
    if (confidence >= 75) return "text-green-500";
    if (confidence >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getConfidenceBg = (confidence) => {
    if (confidence >= 75) return "bg-green-500";
    if (confidence >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 80) return "Very High";
    if (confidence >= 65) return "High";
    if (confidence >= 50) return "Moderate";
    if (confidence >= 35) return "Low";
    return "Very Low";
  };

  if (type === "game") {
    return (
      <Card className="overflow-hidden border-2 border-purple-200 bg-white shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <CardTitle className="text-lg font-bold">AI Game Prediction</CardTitle>
            </div>
            {prediction.is_upset_alert && (
              <Badge className="bg-orange-500 text-white animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Upset Alert!
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Matchup */}
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {prediction.home_team} vs {prediction.away_team}
            </div>
            <div className="text-sm text-gray-500">{prediction.league} • {prediction.match_date}</div>
          </div>

          {/* Prediction */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Predicted Winner</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{prediction.reasoning}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-black text-purple-700 mb-2">
              {prediction.predicted_winner}
            </div>
            {prediction.predicted_score && (
              <div className="text-sm text-gray-600">
                Predicted Score: <span className="font-bold">{prediction.predicted_score}</span>
              </div>
            )}
          </div>

          {/* Confidence Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">AI Confidence</span>
              <span className={`text-sm font-bold ${getConfidenceColor(prediction.confidence)}`}>
                {prediction.confidence}% ({getConfidenceLabel(prediction.confidence)})
              </span>
            </div>
            <Progress value={prediction.confidence} className="h-3" />
          </div>

          {/* Win Probabilities */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-700">{prediction.home_win_prob}%</div>
              <div className="text-xs text-gray-500">Home Win</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg font-bold text-gray-700">{prediction.draw_prob || 0}%</div>
              <div className="text-xs text-gray-500">Draw</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <div className="text-lg font-bold text-red-700">{prediction.away_win_prob}%</div>
              <div className="text-xs text-gray-500">Away Win</div>
            </div>
          </div>

          {/* Key Factors */}
          {prediction.key_factors && prediction.key_factors.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Key Factors</div>
              <div className="flex flex-wrap gap-1">
                {prediction.key_factors.slice(0, 4).map((factor, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="text-xs font-medium text-gray-500 mb-1">AI Analysis</div>
            <p className="text-sm text-gray-700">{prediction.reasoning}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "player") {
    return (
      <Card className="overflow-hidden border-2 border-emerald-200 bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <CardTitle className="text-lg font-bold">Player Performance Prediction</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-xl font-bold text-emerald-700">
                {prediction.player_name?.charAt(0)}
              </span>
            </div>
            <div>
              <div className="font-bold text-gray-900">{prediction.player_name}</div>
              <div className="text-sm text-gray-500">{prediction.team} • {prediction.position}</div>
            </div>
          </div>

          {/* Predicted Stats */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="text-sm font-medium text-gray-600 mb-2">Predicted Performance</div>
            <div className="text-lg font-bold text-emerald-700">{prediction.predicted_stats}</div>
          </div>

          {/* Confidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Confidence</span>
              <span className={`text-sm font-bold ${getConfidenceColor(prediction.confidence)}`}>
                {prediction.confidence}%
              </span>
            </div>
            <Progress value={prediction.confidence} className="h-2" />
          </div>

          {/* Trend */}
          <div className="flex items-center gap-2">
            {prediction.trend === "up" ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : prediction.trend === "down" ? (
              <TrendingDown className="w-5 h-5 text-red-500" />
            ) : (
              <Zap className="w-5 h-5 text-yellow-500" />
            )}
            <span className="text-sm text-gray-600">{prediction.trend_reason}</span>
          </div>

          <p className="text-sm text-gray-600">{prediction.reasoning}</p>
        </CardContent>
      </Card>
    );
  }

  // Upset Alert type
  return (
    <Card className="overflow-hidden border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <CardTitle className="text-lg font-bold">Upset Alert</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{prediction.matchup}</div>
          <Badge className="bg-orange-100 text-orange-700 mt-2">
            Upset Probability: {prediction.upset_probability}%
          </Badge>
        </div>
        <div className="bg-white rounded-lg p-3 border border-orange-200">
          <div className="text-sm font-medium text-orange-700">Why This Could Be an Upset</div>
          <p className="text-sm text-gray-600 mt-1">{prediction.reasoning}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {prediction.factors?.map((factor, i) => (
            <Badge key={i} variant="outline" className="text-xs bg-orange-50 text-orange-700">
              {factor}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}