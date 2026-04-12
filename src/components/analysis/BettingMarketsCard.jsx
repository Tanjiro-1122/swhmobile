import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Target } from "lucide-react";

export default function BettingMarketsCard({ data }) {
  if (!data) return null;

  const confidenceColor = {
    High: "bg-green-500/20 text-green-400 border-green-500/40",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    Low: "bg-red-500/20 text-red-400 border-red-500/40",
  };

  return (
    <Card className="bg-slate-800/70 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <DollarSign className="w-5 h-5 text-green-400" />
          Betting Markets Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Moneyline */}
          {data.moneyline && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 uppercase font-bold mb-2">Moneyline</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-300">Home</span>
                  <span className="text-sm font-bold text-white">{data.moneyline.home}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-300">Away</span>
                  <span className="text-sm font-bold text-white">{data.moneyline.away}</span>
                </div>
              </div>
            </div>
          )}

          {/* Spread */}
          {data.spread && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 uppercase font-bold mb-2">Spread</p>
              <p className="text-lg font-black text-white text-center">{data.spread.line}</p>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>H: {data.spread.home_odds}</span>
                <span>A: {data.spread.away_odds}</span>
              </div>
            </div>
          )}

          {/* Over/Under */}
          {data.over_under && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 uppercase font-bold mb-2">Over/Under</p>
              <p className="text-lg font-black text-white text-center">{data.over_under.total}</p>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>O: {data.over_under.over_odds}</span>
                <span>U: {data.over_under.under_odds}</span>
              </div>
              {data.over_under.ai_lean && (
                <Badge className="mt-2 w-full justify-center bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">{data.over_under.ai_lean}</Badge>
              )}
            </div>
          )}
        </div>

        {/* Sharp Money & Line Movement */}
        {(data.sharp_money || data.line_movement) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.sharp_money && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Sharp Money</p>
                <p className="text-xs text-slate-300">{data.sharp_money}</p>
              </div>
            )}
            {data.line_movement && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs font-bold text-blue-400 mb-1">Line Movement</p>
                <p className="text-xs text-slate-300">{data.line_movement}</p>
              </div>
            )}
          </div>
        )}

        {/* Best Bets */}
        {data.best_bets?.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
              <Target className="w-4 h-4 text-green-400" /> AI Best Bets
            </h4>
            <div className="space-y-2">
              {data.best_bets.map((bet, i) => (
                <div key={i} className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-bold text-white">{bet.bet}</p>
                    <Badge className={`border text-xs shrink-0 ml-2 ${confidenceColor[bet.confidence] || confidenceColor.Medium}`}>{bet.confidence}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{bet.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prop Bets */}
        {data.prop_bets?.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Prop Bets to Watch</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.prop_bets.map((prop, i) => (
                <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-sm text-white">{prop.description}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500">{prop.odds}</span>
                    <span className="text-xs text-purple-400">{prop.ai_recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}