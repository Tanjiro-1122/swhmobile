import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Star, TrendingUp, Loader2, RefreshCw, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";

// Sport configurations
const SPORTS = [
  { id: 'nfl', name: 'NFL', icon: '🏈' },
  { id: 'nba', name: 'NBA', icon: '🏀' },
  { id: 'mlb', name: 'MLB', icon: '⚾' },
  { id: 'nhl', name: 'NHL', icon: '🏒' },
  { id: 'soccer', name: 'Soccer', icon: '⚽' },
];

export default function TopStats() {
  const [selectedSport, setSelectedSport] = useState('nfl');

  const getPromptForSport = (sport) => {
    const prompts = {
      nfl: `Search the internet for the latest 2024-2025 NFL standings and statistics. Provide the current top 10 NFL teams by win-loss record and the top 10 players by performance.

Teams: Include rank (1-10), team name, wins, losses, win percentage (e.g., ".750"), points for per game (e.g., "28.5"), points against per game (e.g., "18.2"), current streak (e.g., "W3" or "L2"), and division.

Players: Include rank (1-10), player name, team, position (QB/RB/WR/etc), and three relevant stats with labels. For QBs: passing yards, touchdowns, passer rating. For RBs: rushing yards, touchdowns, yards per carry. For WRs: receiving yards, touchdowns, receptions. Include games played.`,

      nba: `Search the internet for the latest 2024-2025 NBA standings and statistics. Provide the current top 10 NBA teams by win-loss record and the top 10 players by performance.

Teams: Include rank (1-10), team name, wins, losses, win percentage (e.g., ".667"), points per game (e.g., "115.2"), points allowed per game (e.g., "108.5"), current streak (e.g., "W5" or "L1"), and conference (Eastern/Western).

Players: Include rank (1-10), player name, team, position (PG/SG/SF/PF/C), points per game, assists per game, rebounds per game, and games played.`,

      mlb: `Search the internet for the latest MLB standings and statistics. Since it's currently December, provide the final 2024 season top 10 teams and players.

Teams: Include rank (1-10), team name, wins, losses, win percentage (e.g., ".605"), runs scored per game (e.g., "5.2"), runs allowed per game (e.g., "4.1"), final streak or playoff result, and division.

Players: Include rank (1-10), player name, team, position (OF/1B/P/etc), and three relevant stats. For hitters: batting average, home runs, RBIs. For pitchers: ERA, wins, strikeouts. Include games played.`,

      nhl: `Search the internet for the latest 2024-2025 NHL standings and statistics. Provide the current top 10 NHL teams by points and the top 10 players by performance.

Teams: Include rank (1-10), team name, wins, losses (regular + OT/SO), win percentage (e.g., ".625"), goals for per game (e.g., "3.5"), goals against per game (e.g., "2.8"), current streak (e.g., "W4" or "L2"), and division.

Players: Include rank (1-10), player name, team, position (C/LW/RW/D), goals scored, assists, plus/minus rating, and games played.`,

      soccer: `Search the internet for the latest FIFA World Rankings and top European league statistics. Provide the current top 10 national teams and top 10 players.

Teams: Include rank (1-10), team name, wins (recent record), losses (recent record), win percentage or points, goals for (recent average), goals against (recent average), current form (e.g., "W-W-D"), and confederation (UEFA/CONMEBOL/etc).

Players: Include rank (1-10), player name, club team, position (FW/MF/DF), goals this season, assists this season, total goal contributions, and games played.`
    };
    return prompts[sport] || prompts.nfl;
  };

  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['topStats', selectedSport],
    queryFn: async () => {
      const response = await base44.functions.invoke('getSportsStats', {
        sport: selectedSport,
        prompt: getPromptForSport(selectedSport) + `

Return accurate, current statistics. For teams include: rank, name, wins, losses, winPct, pointsFor, pointsAgainst, streak, division.
For players include: rank, name, team, position, stat1Label, stat1Value, stat2Label, stat2Value, stat3Label, stat3Value, gamesPlayed.`,
        schema: {
          type: "object",
          properties: {
            sport: { type: "string" },
            season: { type: "string" },
            teams: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  rank: { type: "number" },
                  name: { type: "string" },
                  wins: { type: "number" },
                  losses: { type: "number" },
                  winPct: { type: "string" },
                  pointsFor: { type: "string" },
                  pointsAgainst: { type: "string" },
                  streak: { type: "string" },
                  division: { type: "string" }
                }
              }
            },
            players: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  rank: { type: "number" },
                  name: { type: "string" },
                  team: { type: "string" },
                  position: { type: "string" },
                  stat1Label: { type: "string" },
                  stat1Value: { type: "string" },
                  stat2Label: { type: "string" },
                  stat2Value: { type: "string" },
                  stat3Label: { type: "string" },
                  stat3Value: { type: "string" },
                  gamesPlayed: { type: "number" }
                }
              }
            }
          }
        }
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  const currentSportConfig = SPORTS.find(s => s.id === selectedSport);

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm px-4 py-2 mb-4">
            <Tv className="w-4 h-4 mr-2 inline" />
            THE NEWS
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 flex items-center justify-center gap-3">
            <Tv className="w-10 h-10" />
            The News
          </h1>
          <p className="text-white/70">
            League standings, top players & latest sports updates
          </p>
          <div className="mt-4">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-4 py-2">
              🎁 FREE FOR ALL USERS - A Gift From Us!
            </Badge>
          </div>
        </div>

        {/* Sport Tabs */}
        <Tabs value={selectedSport} onValueChange={setSelectedSport} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent mb-8">
            {SPORTS.map((sport) => (
              <TabsTrigger
                key={sport.id}
                value={sport.id}
                className="relative px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white bg-white/10 text-white/70 hover:bg-white/20 transition-all min-w-[80px]"
              >
                <span className="text-xl mr-2">{sport.icon}</span>
                <span className="font-bold">{sport.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {SPORTS.map((sport) => (
            <TabsContent key={sport.id} value={sport.id}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-white/70">Loading {sport.name} stats...</p>
                </div>
              ) : error || !statsData || !statsData.teams?.length ? (
                <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-400/30">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-white mb-2">Error Loading Stats</h3>
                    <p className="text-white/70 mb-4">
                      {error?.message || error?.error || "Failed to load data. Please try again."}
                    </p>
                    {error?.details && (
                      <p className="text-xs text-white/50 mb-6 font-mono">{error.details}</p>
                    )}
                    <Button 
                      onClick={() => window.location.reload()}
                      className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold px-6"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : statsData ? (
                <div className="space-y-8">
                  {/* Season Info */}
                  {statsData.season && (
                    <div className="text-center">
                      <Badge variant="outline" className="text-white/70 border-white/30">
                        {statsData.season}
                      </Badge>
                    </div>
                  )}

                  {/* Top Teams Section */}
                  <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-400" />
                        Top 10 Teams - {sport.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-3 px-2 text-white/60 font-semibold text-sm">#</th>
                              <th className="text-left py-3 px-2 text-white/60 font-semibold text-sm">Team</th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">W</th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">L</th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">PCT</th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">PF</th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">PA</th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">STRK</th>
                              <th className="text-left py-3 px-2 text-white/60 font-semibold text-sm">DIV</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statsData.teams?.map((team, idx) => (
                              <tr 
                                key={idx} 
                                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''}`}
                              >
                                <td className="py-3 px-2">
                                  {idx < 3 ? (
                                    <span className={`font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                                      {team.rank || idx + 1}
                                    </span>
                                  ) : (
                                    <span className="text-white/60">{team.rank || idx + 1}</span>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-white font-semibold">{team.name}</td>
                                <td className="py-3 px-2 text-center text-green-300 font-bold">{team.wins}</td>
                                <td className="py-3 px-2 text-center text-red-300 font-bold">{team.losses}</td>
                                <td className="py-3 px-2 text-center text-white font-semibold">{team.winPct}</td>
                                <td className="py-3 px-2 text-center text-cyan-300 font-semibold">{team.pointsFor}</td>
                                <td className="py-3 px-2 text-center text-orange-300 font-semibold">{team.pointsAgainst}</td>
                                <td className="py-3 px-2 text-center">
                                  <Badge className={team.streak?.startsWith('W') ? 'bg-green-600/40 text-green-200 font-bold' : 'bg-red-600/40 text-red-200 font-bold'}>
                                    {team.streak}
                                  </Badge>
                                </td>
                                <td className="py-3 px-2 text-white/80 text-sm font-medium">{team.division}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Players Section */}
                  <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-400" />
                        Top 10 Players - {sport.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-3 px-2 text-white/60 font-semibold text-sm">#</th>
                              <th className="text-left py-3 px-2 text-white/60 font-semibold text-sm">Player</th>
                              <th className="text-left py-3 px-2 text-white/60 font-semibold text-sm">Team</th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">POS</th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">
                                {statsData.players?.[0]?.stat1Label || 'Stat 1'}
                              </th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">
                                {statsData.players?.[0]?.stat2Label || 'Stat 2'}
                              </th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">
                                {statsData.players?.[0]?.stat3Label || 'Stat 3'}
                              </th>
                              <th className="text-center py-3 px-2 text-white/60 font-semibold text-sm">GP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statsData.players?.map((player, idx) => (
                              <tr 
                                key={idx} 
                                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx < 3 ? 'bg-gradient-to-r from-purple-500/10 to-transparent' : ''}`}
                              >
                                <td className="py-3 px-2">
                                  {idx < 3 ? (
                                    <span className={`font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                                      {player.rank || idx + 1}
                                    </span>
                                  ) : (
                                    <span className="text-white/60">{player.rank || idx + 1}</span>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-white font-semibold">{player.name}</td>
                                <td className="py-3 px-2 text-white/70">{player.team}</td>
                                <td className="py-3 px-2 text-center">
                                  <Badge variant="outline" className="text-blue-400 border-blue-400/50">
                                    {player.position}
                                  </Badge>
                                </td>
                                <td className="py-3 px-2 text-center text-green-300 font-bold">{player.stat1Value}</td>
                                <td className="py-3 px-2 text-center text-purple-300 font-bold">{player.stat2Value}</td>
                                <td className="py-3 px-2 text-center text-cyan-300 font-bold">{player.stat3Value}</td>
                                <td className="py-3 px-2 text-center text-white/80 font-semibold">{player.gamesPlayed}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <FloatingDashboardButton />
    </div>
  );
}