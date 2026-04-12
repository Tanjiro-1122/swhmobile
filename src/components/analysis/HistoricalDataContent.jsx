import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Target, Activity, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

export default function HistoricalDataContent() {
  const [sportFilter, setSportFilter] = useState("all");

  const { data: outcomes, isLoading } = useQuery({
    queryKey: ['predictionOutcomes'],
    queryFn: () => base44.entities.PredictionOutcome.list('-match_date', 200),
    initialData: [],
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-purple-400 animate-spin" /></div>;
  }

  const filtered = sportFilter === "all" ? outcomes : outcomes.filter(o => o.sport?.toLowerCase() === sportFilter);

  // Calculate stats
  const total = filtered.length;
  const correct = filtered.filter(o => o.was_correct).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // By Sport
  const sportStats = {};
  outcomes.forEach(o => {
    const sport = o.sport || "Unknown";
    if (!sportStats[sport]) sportStats[sport] = { sport, total: 0, correct: 0 };
    sportStats[sport].total++;
    if (o.was_correct) sportStats[sport].correct++;
  });
  const bySportData = Object.values(sportStats).map(s => ({
    ...s,
    accuracy: Math.round((s.correct / s.total) * 100),
    incorrect: s.total - s.correct
  }));

  // By Confidence Level
  const confStats = {};
  filtered.forEach(o => {
    const conf = o.predicted_confidence || "Unknown";
    if (!confStats[conf]) confStats[conf] = { name: conf, total: 0, correct: 0 };
    confStats[conf].total++;
    if (o.was_correct) confStats[conf].correct++;
  });
  const byConfData = Object.values(confStats).map(c => ({
    ...c,
    accuracy: Math.round((c.correct / c.total) * 100)
  }));

  // Over Time (group by month)
  const monthlyStats = {};
  filtered.forEach(o => {
    const date = o.match_date ? new Date(o.match_date) : new Date(o.created_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyStats[key]) monthlyStats[key] = { month: key, total: 0, correct: 0 };
    monthlyStats[key].total++;
    if (o.was_correct) monthlyStats[key].correct++;
  });
  const timelineData = Object.values(monthlyStats)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({ ...m, accuracy: Math.round((m.correct / m.total) * 100) }));

  // Pie data for win/loss
  const pieData = [
    { name: "Correct", value: correct },
    { name: "Incorrect", value: total - correct }
  ];

  // Current streak
  let streak = 0;
  const sorted = [...filtered].sort((a, b) => new Date(b.match_date || b.created_date) - new Date(a.match_date || a.created_date));
  for (const o of sorted) {
    if (o.was_correct) streak++;
    else break;
  }

  const unique_sports = [...new Set(outcomes.map(o => o.sport).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">AI Prediction History</h3>
        </div>
        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-white">
            <SelectValue placeholder="Filter by sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {unique_sports.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {total === 0 ? (
        <Card className="bg-slate-800/70 border-slate-700">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Historical Data Yet</h3>
            <p className="text-slate-400">As predictions are verified with actual outcomes, charts and trends will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-slate-800/70 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-white">{total}</p>
                <p className="text-xs text-slate-400">Total Predictions</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/70 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-black ${accuracy >= 60 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{accuracy}%</p>
                <p className="text-xs text-slate-400">Overall Accuracy</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/70 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-cyan-400">{correct}</p>
                <p className="text-xs text-slate-400">Correct Picks</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/70 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-amber-400">{streak}</p>
                <p className="text-xs text-slate-400">Current Streak</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accuracy Over Time */}
            {timelineData.length > 1 && (
              <Card className="bg-slate-800/70 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-400" /> Accuracy Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }} />
                      <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} name="Accuracy %" />
                      <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="5 5" dot={false} name="# Predictions" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Win/Loss Pie */}
            <Card className="bg-slate-800/70 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white flex items-center gap-2"><Target className="w-4 h-4 text-green-400" /> Win/Loss Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* By Sport */}
          {bySportData.length > 1 && (
            <Card className="bg-slate-800/70 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white flex items-center gap-2"><Activity className="w-4 h-4 text-purple-400" /> Accuracy by Sport</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={bySportData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="sport" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="correct" stackId="a" fill="#22c55e" name="Correct" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="incorrect" stackId="a" fill="#ef4444" name="Incorrect" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* By Confidence */}
          {byConfData.length > 0 && (
            <Card className="bg-slate-800/70 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">Accuracy by Confidence Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {byConfData.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Badge variant="outline" className="w-20 justify-center border-slate-600 text-slate-300">{c.name}</Badge>
                      <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.accuracy >= 70 ? 'bg-green-500' : c.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.accuracy}%` }} />
                      </div>
                      <span className="text-sm font-bold text-white w-16 text-right">{c.accuracy}%</span>
                      <span className="text-xs text-slate-500 w-16 text-right">({c.correct}/{c.total})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}