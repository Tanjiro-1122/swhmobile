import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, TrendingUp, AlertTriangle, Cloud, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function BettingBriefsContent() {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const { data: briefs = [], isLoading, refetch } = useQuery({
    queryKey: ['bettingBriefs'],
    queryFn: async () => {
      return await base44.entities.BettingBrief.list('-brief_date', 10);
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache old data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const handleRefresh = async () => {
    setIsGenerating(true);
    try {
      // Generate new brief
      await base44.functions.invoke('generateDailyBrief', {});
      // Refetch the list
      await refetch();
    } catch (error) {
      console.error('Failed to generate brief:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Sparkles className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <Card className="border-2 border-slate-700 bg-slate-800/50">
        <CardContent className="p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-bold text-white mb-2">No Betting Briefs Yet</h3>
          <p className="text-slate-400">Daily AI-generated betting briefs will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
        onClick={handleRefresh}
        variant="outline"
        size="sm"
        disabled={isGenerating || isLoading}
        className="gap-2 bg-slate-800 text-white border-slate-600 hover:bg-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Refresh'}
        </Button>
      </div>
      {briefs.map((brief, index) => (
        <motion.div
          key={brief.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-2 border-purple-500/30 bg-slate-800/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-900/50 to-slate-800 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  {brief.title}
                </CardTitle>
                <Badge variant="secondary" className="flex items-center gap-1 bg-slate-700 text-slate-300">
                  <Calendar className="w-3 h-3" />
                  {new Date(brief.brief_date).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-300 mb-6">{brief.summary}</p>

              {/* Top Picks */}
              {brief.top_picks && brief.top_picks.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Top Picks
                  </h4>
                  <div className="space-y-3">
                    {brief.top_picks.map((pick, idx) => (
                      <div key={idx} className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="secondary" className="text-xs mb-2 bg-slate-700 text-slate-300">{pick.sport}</Badge>
                            <h5 className="font-bold text-white">{pick.match}</h5>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{pick.confidence}</Badge>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">
                          <strong className="text-white">Pick:</strong> {pick.pick} ({pick.odds})
                        </p>
                        <p className="text-sm text-slate-400">{pick.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Injury Updates */}
              {brief.injury_updates && brief.injury_updates.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Injury Updates
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {brief.injury_updates.map((injury, idx) => (
                      <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <div className="font-semibold text-white">{injury.player}</div>
                        <div className="text-sm text-slate-400">{injury.team}</div>
                        <div className="text-sm text-red-400 mt-1">{injury.injury}</div>
                        <div className="text-xs text-slate-500 mt-1">Impact: {injury.impact}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weather Alerts */}
              {brief.weather_alerts && brief.weather_alerts.length > 0 && (
                <div>
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-blue-400" />
                    Weather Alerts
                  </h4>
                  <div className="space-y-2">
                    {brief.weather_alerts.map((weather, idx) => (
                      <div key={idx} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <div className="font-semibold text-white">{weather.match}</div>
                        <div className="text-sm text-slate-400">{weather.conditions}</div>
                        <div className="text-sm text-blue-400">{weather.impact}</div>
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