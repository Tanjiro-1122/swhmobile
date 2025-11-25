import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar, TrendingUp, AlertTriangle, Cloud } from "lucide-react";
import { motion } from "framer-motion";

export default function BettingBriefsContent() {
  const { data: briefs = [], isLoading } = useQuery({
    queryKey: ['bettingBriefs'],
    queryFn: async () => {
      return await base44.entities.BettingBrief.list('-brief_date', 10);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Sparkles className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <Card className="border-2 border-gray-200">
        <CardContent className="p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Betting Briefs Yet</h3>
          <p className="text-gray-600">Daily AI-generated betting briefs will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {briefs.map((brief, index) => (
        <motion.div
          key={brief.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  {brief.title}
                </CardTitle>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(brief.brief_date).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-6">{brief.summary}</p>

              {/* Top Picks */}
              {brief.top_picks && brief.top_picks.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Top Picks
                  </h4>
                  <div className="space-y-3">
                    {brief.top_picks.map((pick, idx) => (
                      <div key={idx} className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="secondary" className="text-xs mb-2">{pick.sport}</Badge>
                            <h5 className="font-bold text-gray-900">{pick.match}</h5>
                          </div>
                          <Badge className="bg-green-100 text-green-800">{pick.confidence}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Pick:</strong> {pick.pick} ({pick.odds})
                        </p>
                        <p className="text-sm text-gray-600">{pick.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Injury Updates */}
              {brief.injury_updates && brief.injury_updates.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Injury Updates
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {brief.injury_updates.map((injury, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="font-semibold text-gray-900">{injury.player}</div>
                        <div className="text-sm text-gray-600">{injury.team}</div>
                        <div className="text-sm text-red-700 mt-1">{injury.injury}</div>
                        <div className="text-xs text-gray-500 mt-1">Impact: {injury.impact}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weather Alerts */}
              {brief.weather_alerts && brief.weather_alerts.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-blue-600" />
                    Weather Alerts
                  </h4>
                  <div className="space-y-2">
                    {brief.weather_alerts.map((weather, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="font-semibold text-gray-900">{weather.match}</div>
                        <div className="text-sm text-gray-600">{weather.conditions}</div>
                        <div className="text-sm text-blue-700">{weather.impact}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}