import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Zap } from "lucide-react";

export default function KeyMatchupsCard({ data }) {
  if (!data) return null;

  return (
    <Card className="bg-slate-800/70 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Swords className="w-5 h-5 text-red-400" />
          Key Player Matchups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.key_matchups?.map((matchup, i) => (
          <div key={i} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
            <p className="text-xs font-bold text-slate-400 uppercase mb-3">{matchup.matchup_title}</p>
            <div className="grid grid-cols-3 gap-3 items-start">
              {/* Player A */}
              <div className="text-center">
                <p className="text-sm font-bold text-cyan-400">{matchup.player_a?.name}</p>
                <p className="text-xs text-slate-500">{matchup.player_a?.team} • {matchup.player_a?.position}</p>
                <p className="text-xs text-slate-300 mt-1">{matchup.player_a?.season_stats}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{matchup.player_a?.recent_form}</p>
              </div>
              {/* VS */}
              <div className="text-center pt-2">
                <Swords className="w-5 h-5 mx-auto text-slate-600 mb-1" />
                <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                  Edge: {matchup.edge}
                </Badge>
              </div>
              {/* Player B */}
              <div className="text-center">
                <p className="text-sm font-bold text-blue-400">{matchup.player_b?.name}</p>
                <p className="text-xs text-slate-500">{matchup.player_b?.team} • {matchup.player_b?.position}</p>
                <p className="text-xs text-slate-300 mt-1">{matchup.player_b?.season_stats}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{matchup.player_b?.recent_form}</p>
              </div>
            </div>
            {matchup.edge_reason && (
              <p className="text-xs text-slate-400 mt-2 bg-slate-800/50 rounded p-2">{matchup.edge_reason}</p>
            )}
          </div>
        ))}

        {/* X-Factors */}
        {data.x_factors?.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-400" /> X-Factors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.x_factors.map((xf, i) => (
                <div key={i} className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-sm font-bold text-white">{xf.player_name} <span className="text-xs text-slate-400">({xf.team})</span></p>
                  <p className="text-xs text-slate-300 mt-1">{xf.reason}</p>
                  <Badge variant="outline" className="mt-2 text-[10px] border-yellow-500/30 text-yellow-400">{xf.impact_potential}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}