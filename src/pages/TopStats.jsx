import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Star, TrendingUp, Loader2, RefreshCw, Tv, Newspaper, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";
import BettingBriefsContent from "@/components/hub/BettingBriefsContent";

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
  const [mainTab, setMainTab] = useState('topten');
  const [hasLoadedStats, setHasLoadedStats] = useState(false);
  const [isGeneratingStats, setIsGeneratingStats] = useState(false);

  // Check if stats have been loaded before
  useEffect(() => {
    const loaded = localStorage.getItem('topStatsLoaded');
    setHasLoadedStats(!!loaded);
  }, []);

  const getPromptForSport = (sport) => {
    const prompts = {
        nfl: `You are a sports data expert. PRIORITIZE THESE SOURCES IN ORDER:

    PRIMARY SOURCE (CHECK FIRST):
    1. The Odds API - Check for current NFL odds, lines, player props

    SECONDARY SOURCES:
    2. ESPN.com/nfl/standings
    3. NFL.com

    Search for the CURRENT 2024-2025 NFL season standings and player statistics.

CRITICAL: You MUST provide EXACTLY 10 teams and EXACTLY 10 players with ALL required fields.

Teams (EXACTLY 10): rank (1-10), name (e.g., "Kansas City Chiefs"), wins (number), losses (number), winPct (e.g., "0.750"), pointsFor (e.g., "28.5"), pointsAgainst (e.g., "18.2"), streak (e.g., "W3"), division (e.g., "AFC West")

Players (EXACTLY 10): rank (1-10), name (e.g., "Patrick Mahomes"), team, position (QB/RB/WR/TE), stat1Label (e.g., "Pass Yds"), stat1Value (e.g., "3250"), stat2Label (e.g., "Pass TD"), stat2Value (e.g., "28"), stat3Label (e.g., "Rating"), stat3Value (e.g., "105.2"), gamesPlayed (number)

Use CURRENT 2024-2025 season data. Search ESPN and NFL.com NOW.`,

      nba: `You are a sports data expert. PRIORITIZE THESE SOURCES IN ORDER:

      PRIMARY SOURCE (CHECK FIRST):
      1. The Odds API - Check for current NBA odds, lines, player props

      SECONDARY SOURCES:
      2. ESPN.com/nba/standings
      3. NBA.com

      Search for the CURRENT 2024-2025 NBA season standings and player statistics.

CRITICAL: You MUST provide EXACTLY 10 teams and EXACTLY 10 players with ALL required fields.

Teams (EXACTLY 10): rank (1-10), name (e.g., "Boston Celtics"), wins (number), losses (number), winPct (e.g., "0.667"), pointsFor (e.g., "115.2"), pointsAgainst (e.g., "108.5"), streak (e.g., "W5"), division (e.g., "Atlantic" or "Eastern Conference")

Players (EXACTLY 10): rank (1-10), name (e.g., "Luka Doncic"), team, position (PG/SG/SF/PF/C), stat1Label (e.g., "PPG"), stat1Value (e.g., "28.5"), stat2Label (e.g., "APG"), stat2Value (e.g., "8.2"), stat3Label (e.g., "RPG"), stat3Value (e.g., "9.1"), gamesPlayed (number)

Use CURRENT 2024-2025 season data. Search ESPN and NBA.com NOW.`,

      mlb: `You are a sports data expert. PRIORITIZE THESE SOURCES IN ORDER:

      PRIMARY SOURCE (CHECK FIRST):
      1. The Odds API - Check for current MLB odds, lines, player props

      SECONDARY SOURCES:
      2. ESPN.com/mlb
      3. MLB.com

      Search for the FINAL 2024 MLB season standings and statistics (season ended in October 2024).

CRITICAL: You MUST provide EXACTLY 10 teams and EXACTLY 10 players with ALL required fields.

Teams (EXACTLY 10): rank (1-10), name (e.g., "Los Angeles Dodgers"), wins (number), losses (number), winPct (e.g., "0.605"), pointsFor (e.g., "5.2" - runs per game), pointsAgainst (e.g., "4.1" - runs allowed), streak (e.g., "Won World Series" or "Lost NLCS"), division (e.g., "NL West")

Players (EXACTLY 10): rank (1-10), name (e.g., "Shohei Ohtani"), team, position (OF/1B/SS/SP/RP), stat1Label (e.g., "AVG" or "ERA"), stat1Value (e.g., ".310" or "2.45"), stat2Label (e.g., "HR" or "Wins"), stat2Value (e.g., "45" or "18"), stat3Label (e.g., "RBI" or "K"), stat3Value (e.g., "120" or "250"), gamesPlayed (number)

Use FINAL 2024 season data.`,

      nhl: `You are a sports data expert. PRIORITIZE THESE SOURCES IN ORDER:

      PRIMARY SOURCE (CHECK FIRST):
      1. The Odds API - Check for current NHL odds, lines, player props

      SECONDARY SOURCES:
      2. ESPN.com/nhl/standings
      3. NHL.com

      Search for the CURRENT 2024-2025 NHL season standings and player statistics.

CRITICAL: You MUST provide EXACTLY 10 teams and EXACTLY 10 players with ALL required fields.

Teams (EXACTLY 10): rank (1-10), name (e.g., "Colorado Avalanche"), wins (number), losses (number including OT/SO), winPct (e.g., "0.625"), pointsFor (e.g., "3.5" - goals per game), pointsAgainst (e.g., "2.8"), streak (e.g., "W4"), division (e.g., "Central")

Players (EXACTLY 10): rank (1-10), name (e.g., "Connor McDavid"), team, position (C/LW/RW/D/G), stat1Label (e.g., "Goals"), stat1Value (e.g., "25"), stat2Label (e.g., "Assists"), stat2Value (e.g., "42"), stat3Label (e.g., "+/-"), stat3Value (e.g., "+18"), gamesPlayed (number)

Use CURRENT 2024-2025 season data. Search ESPN and NHL.com NOW.`,

      soccer: `You are a sports data expert. PRIORITIZE THESE SOURCES IN ORDER:

      PRIMARY SOURCE (CHECK FIRST):
      1. The Odds API - Check for current Soccer odds, lines, player props

      SECONDARY SOURCES:
      2. FIFA.com/fifa-world-ranking
      3. transfermarkt.com

      Search for CURRENT FIFA World Rankings and top European league player statistics.

CRITICAL: You MUST provide EXACTLY 10 teams and EXACTLY 10 players with ALL required fields.

Teams (EXACTLY 10 national teams): rank (1-10), name (e.g., "Argentina"), wins (recent 10 games), losses (recent 10 games), winPct (e.g., "0.70"), pointsFor (e.g., "2.5" - goals per game), pointsAgainst (e.g., "0.8"), streak (e.g., "W-W-D"), division (e.g., "CONMEBOL" or "UEFA")

Players (EXACTLY 10 from top leagues): rank (1-10), name (e.g., "Erling Haaland"), team (club name), position (FW/MF/DF/GK), stat1Label (e.g., "Goals"), stat1Value (e.g., "22"), stat2Label (e.g., "Assists"), stat2Value (e.g., "8"), stat3Label (e.g., "Apps"), stat3Value (e.g., "20"), gamesPlayed (number)

Use CURRENT 2024-2025 season data. Search FIFA.com and transfermarkt NOW.`
    };
    return prompts[sport] || prompts.nfl;
  };

  const { data: statsData, isLoading, error, refetch } = useQuery({
    queryKey: ['topStats', selectedSport],
    queryFn: async () => {
      try {
        console.log('Invoking getSportsStats for sport:', selectedSport);
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
        console.log('getSportsStats response:', response);
        if (!response || !response.data) {
          throw new Error('Invalid response from getSportsStats');
        }
        localStorage.setItem('topStatsLoaded', 'true');
        return response.data;
      } catch (err) {
        console.error('Error invoking getSportsStats:', err);
        console.error('Error details:', {
          message: err?.message,
          status: err?.status,
          response: err?.response,
          data: err?.data
        });
        throw err;
      }
    },
    enabled: hasLoadedStats,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  const handleFirstTimeLookup = async () => {
    setIsGeneratingStats(true);
    setHasLoadedStats(true);
    localStorage.setItem('topStatsLoaded', 'true');
  };

  const handleRefreshStats = async () => {
    setIsGeneratingStats(true);
    try {
      await refetch();
    } finally {
      setIsGeneratingStats(false);
    }
  };

  useEffect(() => {
    if (hasLoadedStats && !isLoading && statsData) {
      setIsGeneratingStats(false);
    }
  }, [hasLoadedStats, isLoading, statsData]);

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

        {/* Main Tabs - Feeds vs Top Ten */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-black/40 backdrop-blur-xl border border-white/10 p-1">
            <TabsTrigger 
              value="feeds"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-white/60 flex items-center gap-2"
            >
              <Newspaper className="w-4 h-4" />
              Feeds
            </TabsTrigger>
            <TabsTrigger 
              value="topten"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-white/60 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Top Ten
            </TabsTrigger>
          </TabsList>

          {/* Feeds Section */}
          <TabsContent value="feeds" className="mt-6">
            <BettingBriefsContent />
          </TabsContent>

          {/* Top Ten Section */}
          <TabsContent value="topten" className="mt-6">
            {/* Sport Selection Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              {SPORTS.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => {
                    setSelectedSport(sport.id);
                    setHasLoadedStats(true);
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedSport === sport.id
                      ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/50 scale-105'
                      : 'bg-black/40 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="text-5xl mb-2">{sport.icon}</div>
                  <div className="text-white font-bold">{sport.name}</div>
                </button>
              ))}
            </div>

            {hasLoadedStats && selectedSport && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    {currentSportConfig?.name} - Top 10 Teams & Players
                  </h2>
                  <Button
                    onClick={handleRefreshStats}
                    variant="outline"
                    size="sm"
                    disabled={isGeneratingStats || isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGeneratingStats || isLoading ? 'animate-spin' : ''}`} />
                    {isGeneratingStats || isLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>

                {isLoading ? (
                  <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/30">
                <CardContent className="p-12 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-2xl font-bold text-white mb-3">Ready to See the Latest Stats?</h3>
                  <p className="text-white/70 mb-6">
                    Click below to load current standings and player stats for all major sports
                  </p>
                  <Button 
                    onClick={handleFirstTimeLookup}
                    disabled={isGeneratingStats}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-3 text-lg"
                  >
                    {isGeneratingStats ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading Stats...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5 mr-2" />
                        First Time Lookup
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : error || !statsData || !statsData.teams?.length ? (
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
                            {statsData.teams?.slice(0, 10).map((team, idx) => (
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
                            {statsData.players?.slice(0, 10).map((player, idx) => (
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
                  </>
                  )}
                  </TabsContent>
        </Tabs>
      </div>
      <FloatingDashboardButton />
    </div>
  );
}