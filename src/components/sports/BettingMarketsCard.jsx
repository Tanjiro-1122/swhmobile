import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Zap, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function BettingMarketsCard({ markets }) {
  if (!markets) return null;

  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-blue-600" />
          Additional Betting Markets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {markets.over_under && markets.over_under.line && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-gray-900">Over/Under</h4>
              <Badge variant="outline" className="ml-auto">
                Line: {markets.over_under.line}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                <div className="text-xs text-gray-600 mb-1">OVER</div>
                <div className="text-2xl font-bold text-green-700">
                  {markets.over_under.over_probability?.toFixed(1)}%
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
                <div className="text-xs text-gray-600 mb-1">UNDER</div>
                <div className="text-2xl font-bold text-red-700">
                  {markets.over_under.under_probability?.toFixed(1)}%
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {markets.both_teams_score && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-purple-600" />
              <h4 className="font-bold text-gray-900">Both Teams to Score</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
                <div className="text-xs text-gray-600 mb-1">YES</div>
                <div className="text-2xl font-bold text-purple-700">
                  {markets.both_teams_score.yes_probability?.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                <div className="text-xs text-gray-600 mb-1">NO</div>
                <div className="text-2xl font-bold text-gray-700">
                  {markets.both_teams_score.no_probability?.toFixed(1)}%
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {markets.total_goals_range && markets.total_goals_range.predicted_total && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-600" />
              <h4 className="font-bold text-gray-900">Predicted Total Score</h4>
            </div>
            <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100 rounded p-3">
              <span className="text-gray-700">{markets.total_goals_range.range || "Total"}</span>
              <span className="text-2xl font-bold text-orange-600">
                {markets.total_goals_range.predicted_total}
              </span>
            </div>
          </motion.div>
        )}

        {markets.first_to_score && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-600" />
              <h4 className="font-bold text-gray-900">First to Score</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                <div className="text-xs text-gray-600 mb-1">HOME</div>
                <div className="text-2xl font-bold text-blue-700">
                  {markets.first_to_score.home_probability?.toFixed(1)}%
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
                <div className="text-xs text-gray-600 mb-1">AWAY</div>
                <div className="text-2xl font-bold text-purple-700">
                  {markets.first_to_score.away_probability?.toFixed(1)}%
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}