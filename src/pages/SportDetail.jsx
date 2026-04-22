import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Shield, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

const sportConfig = {
  NFL: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nfl.png',
    gradient: 'from-blue-600 to-blue-800',
    accent: 'bg-blue-600',
    source: 'NFL.com & TeamRankings.com'
  },
  MLB: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/mlb.png',
    gradient: 'from-red-600 to-red-800',
    accent: 'bg-red-600',
    source: 'MLB.com'
  },
  NBA: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nba.png',
    gradient: 'from-orange-500 to-orange-700',
    accent: 'bg-orange-500',
    source: 'NBA.com'
  },
  NHL: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nhl.png',
    gradient: 'from-teal-500 to-teal-700',
    accent: 'bg-teal-500',
    source: 'NHL.com'
  },
  Soccer: {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/FIFA_logo_without_slogan.svg/500px-FIFA_logo_without_slogan.svg.png',
    gradient: 'from-green-600 to-green-800',
    accent: 'bg-green-600',
    source: 'Premier League'
  }
};

export default function SportDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const sport = urlParams.get('sport') || 'NFL';
  const config = sportConfig[sport] || sportConfig.NFL;

  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);
const playerColumnsConfig = {
  NFL: [
    { header: 'Pass Yds', key: 'passingYards' },
    { header: 'TDs', key: 'totalTds' },
    { header: 'Sacks/Rec', key: 'sacksOrReceptions' },
    { header: 'Tkls/PassTD', key: 'tacklesOrPassingTds' },
  ],
  MLB: [
    { header: 'AVG/ERA', key: 'avgOrEra' },
    { header: 'HR/SO', key: 'hrOrSo' },
    { header: 'RBI/Wins', key: 'rbiOrWins' },
    { header: 'Hits/WHIP', key: 'hitsOrWhip' },
  ],
  NBA: [
    { header: 'PPG', key: 'ppg' },
    { header: 'RPG', key: 'rpg' },
    { header: 'APG', key: 'apg' },
    { header: 'FG%', key: 'fgPercentage' },
  ],
  NHL: [
    { header: 'Goals', key: 'goals' },
    { header: 'Assists', key: 'assists' },
    { header: 'Points', key: 'points' },
    { header: '+/-', key: 'plusMinus' },
  ],
  Soccer: [
    { header: 'Goals', key: 'goals' },
    { header: 'Assists', key: 'assists' },
    { header: 'Shots', key: 'shots' },
    { header: 'Tackles', key: 'tackles' },
  ],
};

const playerColumns = playerColumnsConfig[sport] || [];

const fetchData = async () => {
  setLoadingPlayers(true);
  setLoadingTeams(true);

  try {
    const resp = await fetch('/api/sal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `List the current top 10 players and top 5 teams for ${sport}. Format as JSON with two arrays: players (name, team, stat, value) and teams (name, record, ranking).` })
          });
          const salData = await resp.json();
          let parsed = { players: [], teams: [] };
          try { const m = (salData.reply||'').match(/\{.*\}/s); if(m) parsed = JSON.parse(m[0]); } catch {}
          const response = { data: parsed };

    if (response.data?.players) {
      setPlayers(response.data.players);
    }
    if (response.data?.teams) {
      setTeams(response.data.teams);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  setLoadingPlayers(false);
  setLoadingTeams(false);
};

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={`bg-gradient-to-br ${config.gradient} pt-8 pb-16 px-4`}>
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('TopTen')}>
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <img src={config.logo} alt={sport} className="w-20 h-20 object-contain bg-white rounded-xl p-2" />
            <div>
              <h1 className="text-5xl font-black text-white">{sport}</h1>
              <p className="text-white/80 mt-2 text-lg">Top 10 Players & Team Rankings</p>
              <p className="text-white/60 text-sm mt-1">Source: {config.source}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        <div className="flex justify-end mb-4">
          <Button 
            onClick={fetchData}
            variant="secondary"
            className="shadow-sm"
            disabled={loadingPlayers || loadingTeams}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(loadingPlayers || loadingTeams) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="players" className="w-full">
          <TabsList className="w-full bg-white shadow-sm rounded-xl p-1 mb-6">
            <TabsTrigger value="players" className="flex-1 rounded-lg">
              <Users className="w-4 h-4 mr-2" />
              Top 10 Players
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex-1 rounded-lg">
              <Shield className="w-4 h-4 mr-2" />
              Top 10 Teams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {loadingPlayers ? (
                <div className="p-8 text-center text-slate-500">Loading players...</div>
              ) : players.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No player data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10">#</th>
                        <th className="text-left p-3 font-semibold text-slate-700 sticky left-12 bg-slate-50 z-10 min-w-[160px]">Player</th>
                        <th className="text-left p-3 font-semibold text-slate-700 min-w-[140px]">Team</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">POS</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">GP</th>
                        {playerColumns.map(col => (
                          <th key={col.key} className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player, index) => (
                        <tr key={index} className="border-b hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white">{index + 1}</td>
                            <td className="p-3 font-semibold text-slate-800 sticky left-12 bg-white">{player.name}</td>
                            <td className="p-3 text-slate-600">{player.team}</td>
                            <td className="p-3 text-center text-xs text-slate-600">{player.position || '--'}</td>
                            <td className="p-3 text-center text-slate-600">{player.gamesPlayed || '--'}</td>
                            {playerColumns.map(col => (
                              <td key={col.key} className="p-3 text-center text-slate-600 font-semibold">{player[col.key] || '--'}</td>
                            ))}
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="teams">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {loadingTeams ? (
                <div className="p-8 text-center text-slate-500">Loading teams...</div>
              ) : teams.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No team data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10">#</th>
                        <th className="text-left p-3 font-semibold text-slate-700 sticky left-12 bg-slate-50 z-10 min-w-[140px]">Team</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">Record</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">Win%</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">PF</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">PA</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">Diff</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">ATS</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">O/U</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">Home</th>
                        <th className="text-center p-3 font-semibold text-slate-700 whitespace-nowrap">Away</th>
                        <th className="text-left p-3 font-semibold text-slate-700 whitespace-nowrap">Last 5-10</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team, index) => (
                        <tr key={index} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white">{index + 1}</td>
                          <td className="p-3 font-semibold text-slate-800 sticky left-12 bg-white">{team.name}</td>
                          <td className="p-3 text-center text-slate-600 whitespace-nowrap">{team.wins}-{team.losses}</td>
                          <td className="p-3 text-center font-semibold text-slate-700">{team.winPct}</td>
                          <td className="p-3 text-center text-slate-600">{team.pointsFor || '--'}</td>
                          <td className="p-3 text-center text-slate-600">{team.pointsAgainst || '--'}</td>
                          <td className={`p-3 text-center font-semibold ${parseFloat(team.differential) > 0 ? 'text-green-600' : parseFloat(team.differential) < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            {team.differential || '--'}
                          </td>
                          <td className="p-3 text-center text-slate-600">{team.ats || '--'}</td>
                          <td className="p-3 text-center text-slate-600">{team.ou || '--'}</td>
                          <td className="p-3 text-center text-slate-600 text-xs">{team.homeRecord || '--'}</td>
                          <td className="p-3 text-center text-slate-600 text-xs">{team.awayRecord || '--'}</td>
                          <td className="p-3 text-slate-600 text-xs font-mono">{team.lastGames || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}