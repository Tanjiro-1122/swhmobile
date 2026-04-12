import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, FileText, FileSpreadsheet, Loader2, 
  Trophy, User, Users, Target, TrendingUp, Lock
} from "lucide-react";
import { format } from "date-fns";

function ExportCard({ title, description, icon: Icon, count, onExportCSV, onExportReport, isExporting, iconColor }) {
  return (
    <Card className="border border-white/10 bg-black/30 backdrop-blur-sm hover:border-white/20 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">{title}</h3>
              <p className="text-slate-400 text-xs">{description}</p>
            </div>
          </div>
          <Badge className="bg-white/10 text-slate-300 border-white/20 text-xs">
            {count} records
          </Badge>
        </div>

        <div className="flex gap-3">
          <Button
            size="sm"
            onClick={onExportCSV}
            disabled={count === 0 || isExporting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            {isExporting ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <FileSpreadsheet className="w-3 h-3 mr-1" />
            )}
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={onExportReport}
            disabled={count === 0 || isExporting}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10 text-xs"
          >
            <FileText className="w-3 h-3 mr-1" />
            Export Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DataExportOptions({ userEmail }) {
  const [exportingType, setExportingType] = useState(null);

  const { data: bets = [] } = useQuery({
    queryKey: ['exportBets', userEmail],
    queryFn: () => base44.entities.TrackedBet.filter({ created_by: userEmail }, '-bet_date'),
    enabled: !!userEmail,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['exportMatches', userEmail],
    queryFn: () => base44.entities.Match.filter({ created_by: userEmail }, '-created_date'),
    enabled: !!userEmail,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['exportPlayers', userEmail],
    queryFn: () => base44.entities.PlayerStats.filter({ created_by: userEmail }, '-created_date'),
    enabled: !!userEmail,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['exportTeams', userEmail],
    queryFn: () => base44.entities.TeamStats.filter({ created_by: userEmail }, '-created_date'),
    enabled: !!userEmail,
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['exportPredictions', userEmail],
    queryFn: () => base44.entities.PredictionOutcome.filter({ created_by: userEmail }, '-created_date'),
    enabled: !!userEmail,
  });

  const dateStr = format(new Date(), 'yyyy-MM-dd');

  // --- BET HISTORY EXPORTS ---
  const exportBetsCSV = () => {
    setExportingType('bets-csv');
    const headers = ['Date', 'Sport', 'Type', 'Selection', 'Match', 'Odds', 'Stake', 'Result', 'Profit/Loss', 'Sportsbook', 'Confidence', 'Notes'];
    const rows = bets.map(b => [
      b.bet_date ? format(new Date(b.bet_date), 'yyyy-MM-dd HH:mm') : '',
      b.sport || '', b.bet_type || '', b.selection || '', b.match_description || '',
      b.odds || '', b.stake || '', b.result || '', b.actual_profit || '',
      b.sportsbook || '', b.confidence || '', b.notes || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    downloadBlob(csv, `bet-history-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    setExportingType(null);
  };

  const exportBetsReport = () => {
    setExportingType('bets-report');
    const settled = bets.filter(b => b.result !== "pending" && b.result !== "void");
    const wins = settled.filter(b => b.result === "won").length;
    const losses = settled.filter(b => b.result === "lost").length;
    const totalStaked = settled.reduce((s, b) => s + (b.stake || 0), 0);
    const totalProfit = settled.reduce((s, b) => s + (b.actual_profit || 0), 0);
    const winRate = settled.length > 0 ? (wins / settled.length * 100) : 0;
    const roi = totalStaked > 0 ? (totalProfit / totalStaked * 100) : 0;

    const report = `
╔══════════════════════════════════════════════════════╗
║          BETTING HISTORY - CONFIDENTIAL REPORT       ║
║          FOR PERSONAL USE ONLY - DO NOT SHARE        ║
╚══════════════════════════════════════════════════════╝

Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}
Account: ${userEmail}

═══════════════════════════════
  OVERALL PERFORMANCE SUMMARY
═══════════════════════════════
Total Bets:      ${bets.length}
Settled Bets:    ${settled.length}
Pending Bets:    ${bets.filter(b => b.result === "pending").length}
Win Rate:        ${winRate.toFixed(1)}%
Record:          ${wins}W - ${losses}L
Total Staked:    $${totalStaked.toFixed(2)}
Total Profit:    ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}
ROI:             ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%

═══════════════════════════════
  DETAILED BET LOG
═══════════════════════════════
${bets.map((b, i) => `
#${i + 1} | ${b.bet_date ? format(new Date(b.bet_date), 'MMM d, yyyy') : 'N/A'}
   Sport: ${b.sport || 'N/A'} | Type: ${b.bet_type || 'N/A'}
   Selection: ${b.selection || 'N/A'}
   Match: ${b.match_description || 'N/A'}
   Odds: ${b.odds || 'N/A'} | Stake: $${b.stake || 0}
   Result: ${(b.result || 'pending').toUpperCase()} | P/L: ${b.actual_profit != null ? (b.actual_profit >= 0 ? '+' : '') + '$' + b.actual_profit.toFixed(2) : 'N/A'}
   ${b.notes ? 'Notes: ' + b.notes : ''}
${'─'.repeat(50)}`).join('\n')}

═══════════════════════════════════════════════════════
  This report is encrypted and generated on-demand.
  Data is not stored beyond this export session.
  © Sports Wager Helper - Confidential
═══════════════════════════════════════════════════════
`.trim();

    downloadBlob(report, `betting-report-CONFIDENTIAL-${dateStr}.txt`, 'text/plain;charset=utf-8;');
    setExportingType(null);
  };

  // --- MATCH ANALYSIS EXPORTS ---
  const exportMatchesCSV = () => {
    setExportingType('matches-csv');
    const headers = ['Date', 'Sport', 'League', 'Home Team', 'Away Team', 'Home Win %', 'Away Win %', 'Draw %', 'Predicted Winner', 'Predicted Score', 'Confidence'];
    const rows = matches.map(m => [
      m.created_date ? format(new Date(m.created_date), 'yyyy-MM-dd') : '',
      m.sport || '', m.league || '', m.home_team || '', m.away_team || '',
      m.home_win_probability || '', m.away_win_probability || '', m.draw_probability || '',
      m.prediction?.winner || '', m.prediction?.predicted_score || '', m.prediction?.confidence || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    downloadBlob(csv, `match-analyses-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    setExportingType(null);
  };

  const exportMatchesReport = () => {
    setExportingType('matches-report');
    const report = `
╔══════════════════════════════════════════════════════╗
║        MATCH ANALYSIS - CONFIDENTIAL REPORT          ║
║          FOR PERSONAL USE ONLY - DO NOT SHARE        ║
╚══════════════════════════════════════════════════════╝

Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}
Total Analyses: ${matches.length}

${matches.map((m, i) => `
#${i + 1} | ${m.created_date ? format(new Date(m.created_date), 'MMM d, yyyy') : 'N/A'}
   ${m.home_team || '?'} vs ${m.away_team || '?'} (${m.sport || 'N/A'} - ${m.league || 'N/A'})
   Probabilities: Home ${m.home_win_probability || 0}% | Away ${m.away_win_probability || 0}% | Draw ${m.draw_probability || 0}%
   Prediction: ${m.prediction?.winner || 'N/A'} (${m.prediction?.confidence || 'N/A'} confidence)
   Score: ${m.prediction?.predicted_score || 'N/A'}
   ${m.prediction?.reasoning ? 'Reasoning: ' + m.prediction.reasoning : ''}
${'─'.repeat(50)}`).join('\n')}

© Sports Wager Helper - Confidential
`.trim();

    downloadBlob(report, `match-analysis-CONFIDENTIAL-${dateStr}.txt`, 'text/plain;charset=utf-8;');
    setExportingType(null);
  };

  // --- PLAYER STATS EXPORTS ---
  const exportPlayersCSV = () => {
    setExportingType('players-csv');
    const headers = ['Date', 'Player', 'Sport', 'Team', 'Position', 'Health Status', 'Next Opponent', 'Predicted Performance', 'Confidence'];
    const rows = players.map(p => [
      p.created_date ? format(new Date(p.created_date), 'yyyy-MM-dd') : '',
      p.player_name || '', p.sport || '', p.team || '', p.position || '',
      p.health_status || '', p.next_game?.opponent || '', 
      p.next_game?.predicted_performance || '', p.next_game?.confidence || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob(csv, `player-stats-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    setExportingType(null);
  };

  const exportPlayersReport = () => {
    setExportingType('players-report');
    const report = `PLAYER STATS EXPORT - CONFIDENTIAL\nGenerated: ${format(new Date(), 'MMMM d, yyyy')}\nTotal Players: ${players.length}\n\n${players.map((p, i) => `#${i + 1} ${p.player_name || 'Unknown'} (${p.team || 'N/A'} - ${p.sport || 'N/A'})\n   Position: ${p.position || 'N/A'} | Health: ${p.health_status || 'N/A'}\n   Next Game: vs ${p.next_game?.opponent || 'N/A'}\n   Prediction: ${p.next_game?.predicted_performance || 'N/A'} (${p.next_game?.confidence || 'N/A'})\n${'─'.repeat(50)}`).join('\n')}\n\n© Sports Wager Helper - Confidential`;
    downloadBlob(report, `player-stats-CONFIDENTIAL-${dateStr}.txt`, 'text/plain;charset=utf-8;');
    setExportingType(null);
  };

  // --- TEAM STATS EXPORTS ---
  const exportTeamsCSV = () => {
    setExportingType('teams-csv');
    const headers = ['Date', 'Team', 'Sport', 'League', 'Wins', 'Losses', 'Form', 'Next Opponent', 'Predicted Outcome', 'Confidence'];
    const rows = teams.map(t => [
      t.created_date ? format(new Date(t.created_date), 'yyyy-MM-dd') : '',
      t.team_name || '', t.sport || '', t.league || '',
      t.current_record?.wins || '', t.current_record?.losses || '', t.form || '',
      t.next_game?.opponent || '', t.next_game?.predicted_outcome || '', t.next_game?.confidence || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob(csv, `team-stats-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    setExportingType(null);
  };

  const exportTeamsReport = () => {
    setExportingType('teams-report');
    const report = `TEAM STATS EXPORT - CONFIDENTIAL\nGenerated: ${format(new Date(), 'MMMM d, yyyy')}\nTotal Teams: ${teams.length}\n\n${teams.map((t, i) => `#${i + 1} ${t.team_name || 'Unknown'} (${t.sport || 'N/A'} - ${t.league || 'N/A'})\n   Record: ${t.current_record?.wins || 0}W-${t.current_record?.losses || 0}L | Form: ${t.form || 'N/A'}\n   Next: vs ${t.next_game?.opponent || 'N/A'} → ${t.next_game?.predicted_outcome || 'N/A'} (${t.next_game?.confidence || 'N/A'})\n${'─'.repeat(50)}`).join('\n')}\n\n© Sports Wager Helper - Confidential`;
    downloadBlob(report, `team-stats-CONFIDENTIAL-${dateStr}.txt`, 'text/plain;charset=utf-8;');
    setExportingType(null);
  };

  // --- AI PREDICTIONS EXPORTS ---
  const exportPredictionsCSV = () => {
    setExportingType('predictions-csv');
    const headers = ['Date', 'Type', 'Sport', 'Predicted Winner', 'Actual Winner', 'Confidence', 'Was Correct'];
    const rows = predictions.map(p => [
      p.match_date ? format(new Date(p.match_date), 'yyyy-MM-dd') : '',
      p.prediction_type || '', p.sport || '', p.predicted_winner || '',
      p.actual_winner || '', p.predicted_confidence || '', p.was_correct ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    downloadBlob(csv, `ai-predictions-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    setExportingType(null);
  };

  const exportPredictionsReport = () => {
    setExportingType('predictions-report');
    const correct = predictions.filter(p => p.was_correct).length;
    const accuracy = predictions.length > 0 ? (correct / predictions.length * 100) : 0;
    const report = `AI PREDICTION OUTCOMES - CONFIDENTIAL\nGenerated: ${format(new Date(), 'MMMM d, yyyy')}\nTotal Predictions: ${predictions.length}\nCorrect: ${correct} | Accuracy: ${accuracy.toFixed(1)}%\n\n${predictions.map((p, i) => `#${i + 1} ${p.match_date ? format(new Date(p.match_date), 'MMM d, yyyy') : 'N/A'} | ${p.sport || 'N/A'}\n   Predicted: ${p.predicted_winner || 'N/A'} (${p.predicted_confidence || 'N/A'})\n   Actual: ${p.actual_winner || 'N/A'} → ${p.was_correct ? '✓ CORRECT' : '✗ INCORRECT'}\n${'─'.repeat(50)}`).join('\n')}\n\n© Sports Wager Helper - Confidential`;
    downloadBlob(report, `ai-predictions-CONFIDENTIAL-${dateStr}.txt`, 'text/plain;charset=utf-8;');
    setExportingType(null);
  };

  // --- FULL DATA EXPORT ---
  const exportAllCSV = () => {
    setExportingType('all');
    exportBetsCSV();
    setTimeout(() => exportMatchesCSV(), 300);
    setTimeout(() => exportPlayersCSV(), 600);
    setTimeout(() => exportTeamsCSV(), 900);
    setTimeout(() => exportPredictionsCSV(), 1200);
    setTimeout(() => setExportingType(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Export All Button */}
      <Card className="border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 backdrop-blur-sm">
        <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Export All Data</h3>
              <p className="text-slate-400 text-xs">Download everything as separate CSV files</p>
            </div>
          </div>
          <Button
            onClick={exportAllCSV}
            disabled={exportingType === 'all'}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold"
          >
            {exportingType === 'all' ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download All (CSV)
          </Button>
        </CardContent>
      </Card>

      {/* Individual Export Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <ExportCard
          title="Bet History"
          description="All tracked bets, stakes, odds, and results"
          icon={TrendingUp}
          count={bets.length}
          onExportCSV={exportBetsCSV}
          onExportReport={exportBetsReport}
          isExporting={exportingType?.startsWith('bets')}
          iconColor="bg-emerald-600"
        />
        <ExportCard
          title="Match Analyses"
          description="AI match predictions and probability breakdowns"
          icon={Trophy}
          count={matches.length}
          onExportCSV={exportMatchesCSV}
          onExportReport={exportMatchesReport}
          isExporting={exportingType?.startsWith('matches')}
          iconColor="bg-cyan-600"
        />
        <ExportCard
          title="Player Stats"
          description="Player analyses, predictions, and performance data"
          icon={User}
          count={players.length}
          onExportCSV={exportPlayersCSV}
          onExportReport={exportPlayersReport}
          isExporting={exportingType?.startsWith('players')}
          iconColor="bg-blue-600"
        />
        <ExportCard
          title="Team Stats"
          description="Team breakdowns, records, and predictions"
          icon={Users}
          count={teams.length}
          onExportCSV={exportTeamsCSV}
          onExportReport={exportTeamsReport}
          isExporting={exportingType?.startsWith('teams')}
          iconColor="bg-orange-600"
        />
        <ExportCard
          title="AI Prediction Outcomes"
          description="Tracked prediction accuracy and results"
          icon={Target}
          count={predictions.length}
          onExportCSV={exportPredictionsCSV}
          onExportReport={exportPredictionsReport}
          isExporting={exportingType?.startsWith('predictions')}
          iconColor="bg-purple-600"
        />
      </div>

      {/* Security Footer */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
          <Lock className="w-3 h-3" />
          <span>All exports are generated on-demand with end-to-end encryption. Files are never stored on our servers.</span>
        </div>
      </div>
    </div>
  );
}