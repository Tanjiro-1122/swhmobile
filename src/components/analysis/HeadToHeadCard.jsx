import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Trophy } from "lucide-react";

export default function HeadToHeadCard({ data }) {
  if (!data) return null;

  return (
    <Card className="bg-slate-800/70 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <History className="w-5 h-5 text-amber-400" />
          Head-to-Head History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* H2H Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-black text-white">{data.total_meetings || 0}</p>
            <p className="text-xs text-slate-400">Total Meetings</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-black text-cyan-400">{data.home_team_wins || 0}</p>
            <p className="text-xs text-slate-400">Home Wins</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-black text-blue-400">{data.away_team_wins || 0}</p>
            <p className="text-xs text-slate-400">Away Wins</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-black text-amber-400">{data.avg_combined_score || 0}</p>
            <p className="text-xs text-slate-400">Avg Combined</p>
          </div>
        </div>

        {/* Trend Summary */}
        {data.trend_summary && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-sm text-amber-300">{data.trend_summary}</p>
          </div>
        )}

        {/* Recent Meetings */}
        {data.recent_meetings?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-400 uppercase">Recent Meetings</h4>
            {data.recent_meetings.map((game, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3">
                <div className="text-xs text-slate-500 w-20 shrink-0">{game.date}</div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white">{game.score}</span>
                  {game.note && <span className="text-xs text-slate-400 ml-2">— {game.note}</span>}
                </div>
                <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs shrink-0">
                  <Trophy className="w-3 h-3 mr-1" />{game.winner}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}