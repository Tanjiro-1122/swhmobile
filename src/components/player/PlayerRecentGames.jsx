import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function PlayerRecentGames({ recentForm }) {
  if (!recentForm || recentForm.length === 0) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Date N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "MMM d");
    } catch {
      return dateString;
    }
  };

  const getPerformanceColor = (rating) => {
    if (!rating) return "bg-gray-100 text-gray-800";
    const r = rating.toLowerCase();
    if (r.includes("excellent") || r.includes("hot") || r.includes("great")) {
      return "bg-green-100 text-green-800 border-green-300";
    }
    if (r.includes("good") || r.includes("solid")) {
      return "bg-blue-100 text-blue-800 border-blue-300";
    }
    if (r.includes("below") || r.includes("poor") || r.includes("cold")) {
      return "bg-red-100 text-red-800 border-red-300";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getPerformanceIcon = (rating) => {
    if (!rating) return <Minus className="w-4 h-4" />;
    const r = rating.toLowerCase();
    if (r.includes("excellent") || r.includes("hot") || r.includes("great")) {
      return <TrendingUp className="w-4 h-4" />;
    }
    if (r.includes("below") || r.includes("poor") || r.includes("cold")) {
      return <TrendingDown className="w-4 h-4" />;
    }
    return <Minus className="w-4 h-4" />;
  };

  return (
    <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-indigo-600" />
          Recent Games
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentForm.map((game, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-lg p-4 border border-indigo-200 hover:border-indigo-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-gray-900">vs {game.opponent}</div>
                  <div className="text-sm text-gray-600">{formatDate(game.date)}</div>
                </div>
                {game.performance_rating && (
                  <Badge className={`${getPerformanceColor(game.performance_rating)} border flex items-center gap-1`}>
                    {getPerformanceIcon(game.performance_rating)}
                    {game.performance_rating}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {game.points !== undefined && game.points !== null && (
                  <div className="text-center p-2 bg-gradient-to-br from-orange-50 to-red-50 rounded">
                    <div className="text-xs text-gray-600">Points</div>
                    <div className="text-xl font-bold text-orange-600">{game.points}</div>
                  </div>
                )}
                {game.assists !== undefined && game.assists !== null && (
                  <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded">
                    <div className="text-xs text-gray-600">Assists</div>
                    <div className="text-xl font-bold text-blue-600">{game.assists}</div>
                  </div>
                )}
                {game.rebounds !== undefined && game.rebounds !== null && (
                  <div className="text-center p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded">
                    <div className="text-xs text-gray-600">Rebounds</div>
                    <div className="text-xl font-bold text-green-600">{game.rebounds}</div>
                  </div>
                )}
                {game.goals !== undefined && game.goals !== null && (
                  <div className="text-center p-2 bg-gradient-to-br from-yellow-50 to-orange-50 rounded">
                    <div className="text-xs text-gray-600">Goals</div>
                    <div className="text-xl font-bold text-yellow-600">{game.goals}</div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}