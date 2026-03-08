import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, MapPin, Calendar, TrendingUp, TrendingDown, Shield, Swords, AlertTriangle } from "lucide-react";

const StatRow = ({ label, home, away }) => (
  <div className="grid grid-cols-3 gap-2 items-center py-2 border-b border-slate-700/50 last:border-0">
    <span className="text-right text-sm font-bold text-white">{home}</span>
    <span className="text-center text-xs text-slate-400 font-medium">{label}</span>
    <span className="text-left text-sm font-bold text-white">{away}</span>
  </div>
);

const InjuryList = ({ injuries, teamName }) => {
  if (!injuries?.length) return <p className="text-xs text-slate-500">No injuries reported</p>;
  return (
    <div className="space-y-1">
      {injuries.map((inj, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <span className="text-white font-medium">{inj.player}</span>
          <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-500/50 text-amber-400">{inj.status}</Badge>
        </div>
      ))}
    </div>
  );
};

export default function MatchOverviewCard({ overview }) {
  if (!overview) return null;
  const { home_team, away_team, prediction, key_factors } = overview;

  const confidenceColor = {
    High: "bg-green-500/20 text-green-400 border-green-500/40",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    Low: "bg-red-500/20 text-red-400 border-red-500/40",
  };

  return (
    <div className="space-y-4">
      {/* Match Header */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600/20 via-transparent to-blue-600/20 p-6">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-4">
            {overview.league && <Badge variant="outline" className="border-slate-600 text-slate-300">{overview.league}</Badge>}
            {overview.match_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{overview.match_date}</span>}
            {overview.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{overview.venue}</span>}
          </div>

          {/* Team vs Team */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <Shield className="w-10 h-10 mx-auto mb-2 text-cyan-400" />
              <h3 className="text-xl font-black text-white">{home_team?.name}</h3>
              <p className="text-sm text-slate-400">{home_team?.record}</p>
              <p className="text-xs text-slate-500">Home: {home_team?.home_record}</p>
              <p className="text-xs text-slate-500">Form: {home_team?.recent_form}</p>
            </div>
            <div className="text-center">
              <Swords className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-xs text-slate-500 font-bold">VS</p>
            </div>
            <div className="text-center">
              <Shield className="w-10 h-10 mx-auto mb-2 text-blue-400" />
              <h3 className="text-xl font-black text-white">{away_team?.name}</h3>
              <p className="text-sm text-slate-400">{away_team?.record}</p>
              <p className="text-xs text-slate-500">Away: {away_team?.away_record}</p>
              <p className="text-xs text-slate-500">Form: {away_team?.recent_form}</p>
            </div>
          </div>
        </div>

        {/* Statistical Comparison */}
        <CardContent className="p-5">
          <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Statistical Comparison</h4>
          <StatRow label="PPG" home={home_team?.ppg} away={away_team?.ppg} />
          <StatRow label="Opp PPG" home={home_team?.opp_ppg} away={away_team?.opp_ppg} />
          <StatRow label="Off Rating" home={home_team?.offensive_rating} away={away_team?.offensive_rating} />
          <StatRow label="Def Rating" home={home_team?.defensive_rating} away={away_team?.defensive_rating} />
          {home_team?.key_stats?.map((stat, i) => (
            <StatRow key={i} label={stat.label} home={stat.value} away={away_team?.key_stats?.[i]?.value || "-"} />
          ))}
        </CardContent>
      </Card>

      {/* AI Prediction */}
      {prediction && (
        <Card className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="w-5 h-5 text-yellow-400" />
              AI Prediction
              <Badge className={`ml-auto border ${confidenceColor[prediction.confidence] || confidenceColor.Medium}`}>
                {prediction.confidence} Confidence ({prediction.confidence_numeric}%)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-white">{prediction.winner}</p>
                <p className="text-lg text-slate-300">{prediction.predicted_score}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm"><span className="text-cyan-400 font-bold">{prediction.home_win_probability}%</span> <span className="text-slate-500">Home</span></div>
                <div className="text-sm"><span className="text-blue-400 font-bold">{prediction.away_win_probability}%</span> <span className="text-slate-500">Away</span></div>
                {prediction.draw_probability > 0 && (
                  <div className="text-sm"><span className="text-slate-400 font-bold">{prediction.draw_probability}%</span> <span className="text-slate-500">Draw</span></div>
                )}
              </div>
            </div>
            {/* Probability Bar */}
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden flex">
              <div className="bg-cyan-500 h-full transition-all" style={{ width: `${prediction.home_win_probability}%` }} />
              {prediction.draw_probability > 0 && <div className="bg-slate-500 h-full transition-all" style={{ width: `${prediction.draw_probability}%` }} />}
              <div className="bg-blue-500 h-full transition-all" style={{ width: `${prediction.away_win_probability}%` }} />
            </div>
            <p className="text-sm text-slate-300">{prediction.reasoning}</p>
          </CardContent>
        </Card>
      )}

      {/* Injury Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-cyan-400">{home_team?.name} Injuries</CardTitle>
          </CardHeader>
          <CardContent><InjuryList injuries={home_team?.injuries} /></CardContent>
        </Card>
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-400">{away_team?.name} Injuries</CardTitle>
          </CardHeader>
          <CardContent><InjuryList injuries={away_team?.injuries} /></CardContent>
        </Card>
      </div>

      {/* Key Factors */}
      {key_factors?.length > 0 && (
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Key Decision Factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {key_factors.map((f, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-700/30 rounded-lg p-3">
                <span className="text-xs font-bold text-slate-500 mt-0.5">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{f.factor}</p>
                  <p className="text-xs text-slate-400">{f.description}</p>
                </div>
                <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs shrink-0">Favors {f.favors}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}