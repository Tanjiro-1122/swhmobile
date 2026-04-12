import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function BettingMarketsCard({ markets }) {
  if (!markets) return null;

  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Additional Betting Markets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Over/Under */}
        {markets.over_under && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg p-4 border border-blue-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-gray-900">Over/Under</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                Line: {markets.over_under.line}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Over</div>
                <div className="text-2xl font-bold text-green-600">
                  {markets.over_under.over_probability?.toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                <div className="text-sm text-gray-600 mb-1">Under</div>
                <div className="text-2xl font-bold text-red-600">
                  {markets.over_under.under_probability?.toFixed(1)}%
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Both Teams Score */}
        {markets.both_teams_score && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-4 border border-blue-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-gray-900">Both Teams to Score</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Yes</div>
                <div className="text-2xl font-bold text-green-600">
                  {markets.both_teams_score.yes_probability?.toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                <div className="text-sm text-gray-600 mb-1">No</div>
                <div className="text-2xl font-bold text-red-600">
                  {markets.both_teams_score.no_probability?.toFixed(1)}%
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Total Goals Range */}
        {markets.total_goals_range && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-4 border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">Total Goals</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {markets.total_goals_range.predicted_total}
                </div>
                <div className="text-xs text-gray-500">
                  {markets.total_goals_range.range}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* First to Score */}
        {markets.first_to_score && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-4 border border-blue-200"
          >
            <div className="font-bold text-gray-900 mb-3">First to Score</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Home</div>
                <div className="text-2xl font-bold text-blue-600">
                  {markets.first_to_score.home_probability?.toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded border border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Away</div>
                <div className="text-2xl font-bold text-purple-600">
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