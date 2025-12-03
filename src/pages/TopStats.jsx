import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Star, TrendingUp, Loader2 } from "lucide-react";
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

  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['topStats', selectedSport],
    queryFn: async () => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a sports statistics expert. Provide the current top 10 teams and top 10 players for ${selectedSport.toUpperCase()} based on the 2024-2025 season (or most recent completed season if current season hasn't started).

For teams, rank by win-loss record and include:
- Rank
- Team name
- Wins
- Losses
- Win percentage
- Points/runs scored per game (or goals for hockey/soccer)
- Points/runs allowed per game (or goals against)
- Current streak (e.g., "W3" or "L2")
- Division/Conference

For players, rank by overall performance/impact and include:
- Rank
- Player name
- Team
- Position
- Key stat 1 (sport-specific: passing yards for NFL QB, points for NBA, batting avg for MLB, goals for NHL/Soccer)
- Key stat 2 (sport-specific: touchdowns for NFL, assists for NBA, home runs for MLB, assists for NHL/Soccer)
- Key stat 3 (sport-specific: passer rating for NFL, rebounds for NBA, RBIs for MLB, plus/minus for NHL)
- Games played

Be accurate with real current statistics.`,
        add_context_from_internet: true,
        response_json_schema: {
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
      return response;
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
            <Trophy className="w-4 h-4 mr-2 inline" />
            TOP STATS
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            League Leaders & Standings
          </h1>
          <p className="text-white/70">
            Top 10 teams and players across major sports leagues
          </p>
        </div>

        {/* Sport Tabs */}
        <Tabs value={selectedSport} onValueChange={setSelectedSport} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent mb-8">
            {SPORTS.map((sport) => (
              <TabsTrigger
                key={sport.id}
                value={sport.id}
                className="px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white bg-white/10 text-white/70 hover:bg-white/20 transition-all min-w-[80px]"
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
              ) : error ? (
                <Card className="bg-red-500/20 border-red-500/50">
                  <CardContent className="p-6 text-center">
                    <p className="text-red-400">Failed to load stats. Please try again.</p>
                  </CardContent>
                </Card>
              ) : statsData ? (
                <div className="space-y-8">
                  {/* Season Info */}
                  <div className="text-center">
                    <Badge variant="outline" className="text-white/70 border-white/30">
                      {statsData.season || '2024-2025 Season'}
                    </Badge>
                  </div>

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
                                <td className="py-3 px-2 text-center text-green-400 font-bold">{team.wins}</td>
                                <td className="py-3 px-2 text-center text-red-400 font-bold">{team.losses}</td>
                                <td className="py-3 px-2 text-center text-white">{team.winPct}</td>
                                <td className="py-3 px-2 text-center text-blue-400">{team.pointsFor}</td>
                                <td className="py-3 px-2 text-center text-orange-400">{team.pointsAgainst}</td>
                                <td className="py-3 px-2 text-center">
                                  <Badge className={team.streak?.startsWith('W') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                    {team.streak}
                                  </Badge>
                                </td>
                                <td className="py-3 px-2 text-white/60 text-sm">{team.division}</td>
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
                                <td className="py-3 px-2 text-center text-green-400 font-bold">{player.stat1Value}</td>
                                <td className="py-3 px-2 text-center text-purple-400 font-bold">{player.stat2Value}</td>
                                <td className="py-3 px-2 text-center text-cyan-400 font-bold">{player.stat3Value}</td>
                                <td className="py-3 px-2 text-center text-white/60">{player.gamesPlayed}</td>
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