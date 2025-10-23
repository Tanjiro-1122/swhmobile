import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { format } from "date-fns";

export default function PlayerRecentGames({ recentForm }) {
  if (!recentForm || recentForm.length === 0) return null;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return null;
    }
  };

  return (
    <Card className="border-2 border-blue-100 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-blue-600" />
          Last {recentForm.length} Games - Detailed Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentForm.map((game, idx) => {
            const formattedDate = formatDate(game.date);
            return (
              <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-lg">vs {game.opponent}</div>
                    {formattedDate && (
                      <div className="text-xs text-gray-600">{formattedDate}</div>
                    )}
                  </div>
                  {game.performance_rating && (
                    <Badge className="bg-blue-600 text-white">{game.performance_rating}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {game.points !== undefined && (
                    <div className="bg-white rounded p-2 text-center border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{game.points}</div>
                      <div className="text-xs text-gray-600">Points</div>
                    </div>
                  )}
                  {game.assists !== undefined && (
                    <div className="bg-white rounded p-2 text-center border border-blue-200">
                      <div className="text-2xl font-bold text-purple-600">{game.assists}</div>
                      <div className="text-xs text-gray-600">Assists</div>
                    </div>
                  )}
                  {game.rebounds !== undefined && (
                    <div className="bg-white rounded p-2 text-center border border-blue-200">
                      <div className="text-2xl font-bold text-green-600">{game.rebounds}</div>
                      <div className="text-xs text-gray-600">Rebounds</div>
                    </div>
                  )}
                  {game.goals !== undefined && (
                    <div className="bg-white rounded p-2 text-center border border-blue-200">
                      <div className="text-2xl font-bold text-orange-600">{game.goals}</div>
                      <div className="text-xs text-gray-600">Goals</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}