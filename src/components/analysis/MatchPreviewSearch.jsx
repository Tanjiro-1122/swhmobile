import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

export default function MatchPreviewSearch({ onSearch, isSearching }) {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [sport, setSport] = useState("nba");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim()) return;
    onSearch({ home_team: homeTeam.trim(), away_team: awayTeam.trim(), sport });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/70 backdrop-blur-sm border border-slate-700 rounded-xl p-5">
      <h3 className="text-lg font-bold text-white mb-4">Search Match Preview</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input
          placeholder="Home team (e.g. Lakers)"
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
        />
        <Input
          placeholder="Away team (e.g. Celtics)"
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
        />
        <Select value={sport} onValueChange={setSport}>
          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nba">NBA</SelectItem>
            <SelectItem value="nfl">NFL</SelectItem>
            <SelectItem value="mlb">MLB</SelectItem>
            <SelectItem value="nhl">NHL</SelectItem>
            <SelectItem value="soccer">Soccer</SelectItem>
            <SelectItem value="ncaab">NCAAB</SelectItem>
            <SelectItem value="ncaaf">NCAAF</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isSearching || !homeTeam.trim() || !awayTeam.trim()} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold">
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
          {isSearching ? "Analyzing..." : "Analyze Match"}
        </Button>
      </div>
    </form>
  );
}