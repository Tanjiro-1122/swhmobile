import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const PickCard = ({ pick, index }) => {
  // Map confidence to risk (inverse relationship)
  const getRiskFromConfidence = (confidence) => {
    if (confidence === 'High') return 'Low';
    if (confidence === 'Low') return 'High';
    return 'Medium';
  };
  const riskLevel = getRiskFromConfidence(pick.confidence);
  
  const riskColors = {
    Low: "bg-green-500/20 text-green-400 border-green-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    High: "bg-red-500/20 text-red-400 border-red-500/30"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
              {pick.sport}
            </Badge>
            <div className="text-right">
              <div className="text-2xl font-black text-white">{pick.odds}</div>
              <div className="text-xs text-slate-400">Odds</div>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-1">{pick.pick}</h3>
          <p className="text-sm text-slate-400 mb-4">{pick.match}</p>
          
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">{pick.reasoning}</p>
          
          <Badge className={`${riskColors[riskLevel] || riskColors.Medium} border text-xs font-semibold`}>
            {riskLevel} Risk
          </Badge>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function DailyFreePicks() {
  const { data: briefs, isLoading } = useQuery({
    queryKey: ['latestBrief'],
    queryFn: async () => {
      const results = await base44.entities.BettingBrief.list('-brief_date', 1);
      return results;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const latestBrief = briefs?.[0];
  const topPicks = latestBrief?.top_picks?.slice(0, 2) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  if (topPicks.length === 0) {
    return null; // Don't show the section if no picks available
  }

  return (
    <div className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-6 h-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">Today's Top AI Picks</h2>
        <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs">
          FREE DAILY
        </Badge>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {topPicks.map((pick, index) => (
          <PickCard key={index} pick={pick} index={index} />
        ))}
      </div>
    </div>
  );
}