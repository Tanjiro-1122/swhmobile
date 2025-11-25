import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Zap, Target, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import ConfidenceMeter from "./ConfidenceMeter";
import FactorBreakdown from "./FactorBreakdown";

export default function AIPredictionCard({ prediction, type = "game" }) {
  const [expanded, setExpanded] = React.useState(false);
  
  const getConfidenceColor = (confidence) => {
    if (confidence >= 75) return "text-emerald-500";
    if (confidence >= 50) return "text-amber-500";
    return "text-red-500";
  };

  if (type === "game") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="overflow-hidden border-2 border-purple-300 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h30v30H0z\" fill=\"none\"/%3E%3Ccircle cx=\"15\" cy=\"15\" r=\"2\" fill=\"rgba(255,255,255,0.1)\"/%3E%3C/svg%3E')] opacity-50" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold">AI Game Prediction</CardTitle>
              </div>
              {prediction.is_upset_alert && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse shadow-lg">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Upset Alert!
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Matchup */}
            <div className="text-center py-2">
              <div className="text-xl font-black text-gray-900 tracking-tight">
                {prediction.home_team} <span className="text-purple-400 mx-2">vs</span> {prediction.away_team}
              </div>
              <div className="text-sm text-gray-500 mt-1">{prediction.league} • {prediction.match_date}</div>
            </div>

            {/* Prediction with Confidence Meter */}
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 rounded-2xl p-5 border border-purple-200 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Predicted Winner</div>
                  <div className="text-2xl font-black bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                    {prediction.predicted_winner}
                  </div>
                  {prediction.predicted_score && (
                    <div className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 bg-white rounded-lg font-bold shadow-sm">{prediction.predicted_score}</span>
                    </div>
                  )}
                </div>
                <ConfidenceMeter value={prediction.confidence} size="md" />
              </div>
            </div>

            {/* Win Probabilities */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <motion.div 
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-xl font-black text-blue-600">{prediction.home_win_prob}%</div>
                <div className="text-xs font-medium text-gray-500">Home Win</div>
              </motion.div>
              <motion.div 
                className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-3 border border-gray-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-xl font-black text-gray-600">{prediction.draw_prob || 0}%</div>
                <div className="text-xs font-medium text-gray-500">Draw</div>
              </motion.div>
              <motion.div 
                className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-3 border border-red-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-xl font-black text-red-600">{prediction.away_win_prob}%</div>
                <div className="text-xs font-medium text-gray-500">Away Win</div>
              </motion.div>
            </div>

            {/* Expandable Details */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              {expanded ? "Show Less" : "Show Analysis Details"}
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Factor Breakdown */}
                  {prediction.key_factors && prediction.key_factors.length > 0 && (
                    <FactorBreakdown factors={prediction.key_factors} />
                  )}

                  {/* Detailed Reasoning */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">AI Analysis</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{prediction.reasoning}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (type === "player") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
      >
        <Card className="overflow-hidden border-2 border-emerald-300 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h30v30H0z\" fill=\"none\"/%3E%3Ccircle cx=\"15\" cy=\"15\" r=\"2\" fill=\"rgba(255,255,255,0.1)\"/%3E%3C/svg%3E')] opacity-50" />
            <div className="relative flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg font-bold">Player Prediction</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-black text-white">
                  {prediction.player_name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900 text-lg">{prediction.player_name}</div>
                <div className="text-sm text-gray-500">{prediction.team} • {prediction.position}</div>
              </div>
              <ConfidenceMeter value={prediction.confidence} size="sm" />
            </div>

            {/* Predicted Stats */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Predicted Stats</div>
              <div className="text-lg font-bold text-emerald-700">{prediction.predicted_stats}</div>
            </div>

            {/* Trend */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                prediction.trend === "up" ? "bg-green-100" : 
                prediction.trend === "down" ? "bg-red-100" : "bg-yellow-100"
              }`}>
                {prediction.trend === "up" ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : prediction.trend === "down" ? (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                ) : (
                  <Zap className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-bold ${
                  prediction.trend === "up" ? "text-green-600" : 
                  prediction.trend === "down" ? "text-red-600" : "text-yellow-600"
                }`}>
                  {prediction.trend === "up" ? "Trending Up" : prediction.trend === "down" ? "Trending Down" : "Steady"}
                </div>
                <div className="text-xs text-gray-500">{prediction.trend_reason}</div>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl">{prediction.reasoning}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Upset Alert type
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card className="overflow-hidden border-2 border-orange-400 bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 shadow-lg hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 text-white p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h30v30H0z\" fill=\"none\"/%3E%3Cpath d=\"M15 5L25 25H5z\" fill=\"rgba(255,255,255,0.1)\"/%3E%3C/svg%3E')] opacity-50" />
          <div className="relative flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <CardTitle className="text-lg font-bold">⚠️ Upset Alert</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="text-center">
            <div className="text-xl font-black text-gray-900">{prediction.matchup}</div>
            <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-bold">{prediction.upset_probability}% Upset Chance</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border-2 border-orange-200 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-700">Why This Could Happen</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{prediction.reasoning}</p>
          </div>
          
          {prediction.factors && prediction.factors.length > 0 && (
            <FactorBreakdown factors={prediction.factors} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}