
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Shield, Trophy, TrendingUp, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AutoUpdateStatus() {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [manualScore, setManualScore] = useState({ winner: "", final_score: "" });
  const [availableSports, setAvailableSports] = useState([]);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Check if current user is admin
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="max-w-md bg-red-500/10 border-red-500/50">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-red-300">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: allMatches, isLoading } = useQuery({
    queryKey: ['autoUpdateMatches'],
    queryFn: () => base44.entities.Match.list('-created_date', 1000),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Match.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autoUpdateMatches'] });
      setSelectedMatchId(null);
      setManualScore({ winner: "", final_score: "" });
    },
  });

  // Get pending matches (games that should have finished but haven't been updated)
  const pendingMatches = allMatches.filter(match => {
    if (!match.match_date) return false;
    if (match.actual_result?.completed === true) return false;
    
    const matchDate = new Date(match.match_date);
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    
    return matchDate < fourHoursAgo;
  });

  // Fetch available sports from The Odds API
  const checkAvailableSports = async (apiKey) => {
    try {
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (response.ok) {
        const sports = await response.json();
        setAvailableSports(sports);
        console.log("✅ Available sports from The Odds API:", sports);
        return sports;
      } else {
        console.error("Failed to fetch available sports list:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch available sports:", error);
    }
    return [];
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    setCheckResults(null);

    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('odds_api_key');
      
      if (!apiKey) {
        alert("⚠️ Please set your Odds API key in Settings first!");
        setIsChecking(false);
        return;
      }

      // First, check what sports are available
      const available = await checkAvailableSports(apiKey);

      const results = {
        checked: 0,
        updated: 0,
        notFound: 0,
        errors: [],
        details: []
      };

      // Enhanced sport mapping with multiple possible keys
      const sportMapping = {
        'NBA': ['basketball_nba', 'basketball_nba_preseason'],
        'NFL': ['americanfootball_nfl', 'americanfootball_nfl_preseason', 'americanfootball_nfl_super_bowl'],
        'Premier League': ['soccer_epl', 'soccer_england_epl'],
        'MLB': ['baseball_mlb', 'baseball_mlb_preseason', 'baseball_mlb_world_series'],
        'NHL': ['icehockey_nhl', 'icehockey_nhl_championship'],
        'MLS': ['soccer_usa_mls'],
        'Champions League': ['soccer_uefa_champs_league'],
        'La Liga': ['soccer_spain_la_liga'],
        'Bundesliga': ['soccer_germany_bundesliga'],
        'Serie A': ['soccer_italy_serie_a'],
        'Ligue 1': ['soccer_france_ligue_one'],
        'College Football': ['americanfootball_ncaaf'],
        'College Basketball': ['basketball_ncaab']
      };

      // Helper function to find the correct sport key
      const findSportKey = (sportName) => {
        // Try direct match first
        const possibleKeys = sportMapping[sportName] || [sportName.toLowerCase().replace(/\s+/g, '_')];
        
        // Check against available sports from the API
        for (const key of possibleKeys) {
          const found = available.find(s => s.key === key && s.active);
          if (found) {
            return found.key;
          }
        }
        
        // If no match found among active sports, return the first possible key as a fallback
        // The API call will then potentially return a 404 if the sport isn't available/active.
        return possibleKeys[0] || sportName.toLowerCase().replace(/\s+/g, '_'); // Fallback to a simple conversion
      };

      // Process each pending match
      for (const match of pendingMatches.slice(0, 10)) { // Limit to 10 to save API quota
        results.checked++;
        
        try {
          const sportKey = findSportKey(match.sport);
          
          console.log(`🔍 Checking match: ${match.home_team} vs ${match.away_team}`);
          console.log(`   Sport: ${match.sport} → API Key: ${sportKey}`);

          // Fetch scores from The Odds API
          const response = await fetch(
            `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=7`, // Increased daysFrom to 7
            { headers: { 'Accept': 'application/json' } }
          );

          if (!response.ok) {
            if (response.status === 401) {
              alert("❌ Invalid API key. Please check your Odds API key in Settings.");
              break;
            } else if (response.status === 404) {
              const activeSportTitles = available.filter(s => s.active).map(s => s.title).join(', ') || 'None';
              results.errors.push(`${match.home_team} vs ${match.away_team}: Sport "${sportKey}" (${match.sport}) not found or not in season. Active sports: ${activeSportTitles}`);
              results.notFound++;
              results.details.push({
                match: `${match.home_team} vs ${match.away_team}`,
                status: 'sport_not_available',
                error: `${match.sport} not currently available`
              });
              await new Promise(resolve => setTimeout(resolve, 500)); // Still apply delay
              continue; // Skip to the next match
            }
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }

          const scores = await response.json();
          console.log(`   Found ${scores.length} completed games for ${sportKey}`);
          
          // Find matching game with more flexible matching
          const matchingGame = scores.find(game => {
            if (!game.completed) return false;
            
            // Normalize team names for better matching
            const normalizeTeam = (name) => name.toLowerCase()
              .replace(/\s+(fc|united|city|town|athletic|club|ravens|patriots|eagles|chiefs|bills|cowboys|saints|packers|steelers|browns|bears|chargers|jets|giants|redskins|colts|jaguars|titans|texans|broncos|raiders|cardinals|rams|niners|seahawks|bucs|falcons|panthers|vikings|lions|bucks|celtics|lakers|warriors|rockets|spurs|heat|thunder|raptors|blazers|jazz|76ers|knicks|bulls|pistons|magic|hawks|hornets|grizzlies|pelicans|kings|suns|wizards|mavericks)\s*$/i, '')
              .replace(/[\W_]+/g, '') // Remove non-alphanumeric characters
              .trim();
            
            const homeNorm = normalizeTeam(match.home_team);
            const awayNorm = normalizeTeam(match.away_team);
            const gameHomeNorm = normalizeTeam(game.home_team);
            const gameAwayNorm = normalizeTeam(game.away_team);
            
            // Check for direct or partial matches
            const homeMatch = gameHomeNorm.includes(homeNorm) || homeNorm.includes(gameHomeNorm);
            const awayMatch = gameAwayNorm.includes(awayNorm) || awayNorm.includes(gameAwayNorm);
            
            // Also consider that some APIs might swap home/away if not explicit
            const reversedMatch = gameHomeNorm.includes(awayNorm) && gameAwayNorm.includes(homeNorm);

            return (homeMatch && awayMatch) || reversedMatch;
          });

          if (matchingGame && matchingGame.scores) {
            // Extract scores
            const homeScore = matchingGame.scores.find(s => s.name === matchingGame.home_team)?.score;
            const awayScore = matchingGame.scores.find(s => s.name === matchingGame.away_team)?.score;
            
            if (homeScore !== undefined && awayScore !== undefined) {
              // Determine winner
              const winner = homeScore > awayScore ? matchingGame.home_team : matchingGame.away_team;
              
              console.log(`   ✅ Found result: ${homeScore}-${awayScore}, Winner: ${winner}`);
              
              // Update match
              await base44.entities.Match.update(match.id, {
                actual_result: {
                  winner: winner,
                  final_score: `${homeScore}-${awayScore}`,
                  completed: true,
                  last_checked: new Date().toISOString(),
                  source: "The Odds API",
                  api_sport_key: sportKey // New field to store the used API sport key
                }
              });

              results.updated++;
              results.details.push({
                match: `${match.home_team} vs ${match.away_team}`,
                status: 'updated',
                score: `${homeScore}-${awayScore}`,
                winner: winner
              });
            } else {
              console.log(`   ❌ Incomplete score data for game: ${matchingGame.home_team} vs ${matchingGame.away_team}`);
              results.notFound++;
              results.details.push({
                match: `${match.home_team} vs ${match.away_team}`,
                status: 'incomplete_score_data'
              });
            }
          } else {
            console.log(`   ❌ No matching game found in ${scores.length} results`);
            results.notFound++;
            results.details.push({
              match: `${match.home_team} vs ${match.away_team}`,
              status: 'not_found_in_results'
            });
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`Error checking match ${match.id}:`, error);
          results.errors.push(`${match.home_team} vs ${match.away_team}: ${error.message}`);
        }
      }

      setCheckResults(results);
      queryClient.invalidateQueries({ queryKey: ['autoUpdateMatches'] });

    } catch (error) {
      console.error("Manual check failed:", error);
      alert(`Failed to check matches: ${error.message}`);
    }

    setIsChecking(false);
  };

  const handleManualUpdate = (match) => {
    setSelectedMatchId(match.id);
    setManualScore({
      winner: match.actual_result?.winner || "",
      final_score: match.actual_result?.final_score || ""
    });
  };

  const submitManualUpdate = () => {
    if (!manualScore.winner || !manualScore.final_score) {
      alert("Please fill in both winner and final score");
      return;
    }

    updateMutation.mutate({
      id: selectedMatchId,
      data: {
        actual_result: {
          winner: manualScore.winner,
          final_score: manualScore.final_score,
          completed: true,
          last_checked: new Date().toISOString(),
          source: "Manual Entry"
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Auto-Update Status</h1>
              <p className="text-slate-400">Monitor and manage automated match result updates</p>
            </div>
          </div>

          {/* Admin Badge */}
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Shield className="w-4 h-4 mr-2" />
            Admin Only
          </Badge>
        </motion.div>

        {/* API Key Warning */}
        {!localStorage.getItem('odds_api_key') && (
          <Alert className="mb-6 bg-amber-500/10 border-amber-500/50">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <AlertDescription className="text-amber-300">
              <strong>API Key Required:</strong> Please set your Odds API key in{" "}
              <a href="/Settings" className="underline hover:text-amber-200">Settings</a> to use automatic updates.
            </AlertDescription>
          </Alert>
        )}

        {/* Available Sports Info */}
        {availableSports.length > 0 && (
          <Alert className="mb-6 bg-blue-500/10 border-blue-500/50">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              <strong>Currently Active Sports:</strong>{" "}
              {availableSports.filter(s => s.active).map(s => s.title).join(', ') || 'None (off-season for many leagues)'}
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Check Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 bg-slate-800/90 border-slate-700">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-3">
                <Trophy className="w-6 h-6" />
                Manual Result Check (Using The Odds API)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-slate-300 mb-2">
                    Check pending matches for final scores using The Odds API
                  </p>
                  <p className="text-sm text-slate-400">
                    {pendingMatches.length} pending {pendingMatches.length === 1 ? 'match' : 'matches'} (will check up to 10)
                  </p>
                </div>
                <Button
                  onClick={handleManualCheck}
                  disabled={isChecking || pendingMatches.length === 0 || !localStorage.getItem('odds_api_key')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isChecking ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </motion.div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Run Manual Check
                    </>
                  )}
                </Button>
              </div>

              {/* Check Results */}
              {checkResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                >
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Check Results
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                      <div className="text-sm text-slate-400 mb-1">Checked</div>
                      <div className="text-2xl font-bold text-white">{checkResults.checked}</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                      <div className="text-sm text-green-400 mb-1">Updated</div>
                      <div className="text-2xl font-bold text-green-400">{checkResults.updated}</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
                      <div className="text-sm text-yellow-400 mb-1">Not Found</div>
                      <div className="text-2xl font-bold text-yellow-400">{checkResults.notFound}</div>
                    </div>
                  </div>

                  {checkResults.details.length > 0 && (
                    <div className="space-y-2">
                      {checkResults.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded p-2 text-sm">
                          <span className="text-slate-300">{detail.match}</span>
                          {detail.status === 'updated' ? (
                            <div className="flex items-center gap-2">
                              <span className="text-green-400 font-semibold">{detail.score}</span>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                              {detail.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {checkResults.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
                      <div className="text-red-400 font-semibold mb-2">Errors:</div>
                      {checkResults.errors.map((error, idx) => (
                        <div key={idx} className="text-sm text-red-300">{error}</div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Matches List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                Pending Matches ({pendingMatches.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                </div>
              ) : pendingMatches.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-slate-400">All matches are up to date!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{match.sport}</Badge>
                            {match.league && <Badge variant="outline">{match.league}</Badge>}
                          </div>
                          <div className="font-bold text-white text-lg mb-1">
                            {match.home_team} vs {match.away_team}
                          </div>
                          {match.match_date && (
                            <div className="text-sm text-slate-400 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {format(new Date(match.match_date), "MMM d, yyyy 'at' HH:mm")}
                            </div>
                          )}
                          {match.actual_result?.last_checked && (
                            <div className="text-xs text-slate-500 mt-1">
                              Last checked: {format(new Date(match.actual_result.last_checked), "MMM d, HH:mm")}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleManualUpdate(match)}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          Manual Update
                        </Button>
                      </div>

                      {/* Manual Update Form */}
                      {selectedMatchId === match.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 p-4 bg-slate-800 rounded border border-slate-600"
                        >
                          <h4 className="text-white font-semibold mb-3">Enter Final Result:</h4>
                          <div className="grid gap-4">
                            <div>
                              <Label className="text-slate-300">Winner (Full Team Name)</Label>
                              <Input
                                value={manualScore.winner}
                                onChange={(e) => setManualScore({...manualScore, winner: e.target.value})}
                                placeholder="e.g., Los Angeles Chargers"
                                className="bg-slate-900 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300">Final Score</Label>
                              <Input
                                value={manualScore.final_score}
                                onChange={(e) => setManualScore({...manualScore, final_score: e.target.value})}
                                placeholder="e.g., 37-10"
                                className="bg-slate-900 border-slate-600 text-white"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={submitManualUpdate}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Save Result
                              </Button>
                              <Button
                                onClick={() => setSelectedMatchId(null)}
                                variant="outline"
                                className="border-slate-600"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
