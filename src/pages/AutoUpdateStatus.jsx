
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, Clock, Zap, Activity, TrendingUp, AlertCircle, Search, XCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AutoUpdateStatus() {
  const [isRunning, setIsRunning] = useState(false);
  const [checkingMatch, setCheckingMatch] = useState(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000, // User info is unlikely to change often
  });

  // Check if current user is admin
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6">
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

  const { data: pendingMatches, isLoading, refetch: refetchPending } = useQuery({
    queryKey: ['pendingMatches'],
    queryFn: async () => {
      const allMatches = await base44.entities.Match.list('-created_date', 500);
      return allMatches.filter(m => !m.actual_result || !m.actual_result.completed);
    },
    initialData: [],
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: recentlyUpdated, refetch: refetchRecent } = useQuery({
    queryKey: ['recentlyUpdatedMatches'],
    queryFn: async () => {
      const allMatches = await base44.entities.Match.list('-updated_date', 20);
      return allMatches.filter(m => m.actual_result && m.actual_result.completed);
    },
    initialData: [],
  });

  // Check which games are ready to be checked (match date has passed)
  const readyToCheck = pendingMatches.filter(m => {
    if (!m.match_date) return false;
    const matchDate = new Date(m.match_date);
    const now = new Date();
    // Check if match was more than 4 hours ago (game should be finished)
    return (now - matchDate) > (4 * 60 * 60 * 1000);
  });

  const runManualCheck = async () => {
    setIsRunning(true);
    setLastCheckTime(new Date());
    let updatedCount = 0;
    let failedCount = 0;
    
    try {
      // Check up to 5 matches at a time to avoid overwhelming the system
      const matchesToCheck = readyToCheck.slice(0, 5);
      
      for (const match of matchesToCheck) {
        setCheckingMatch(match);
        setSearchAttempt(0);
        
        try {
          // STRATEGY 1: Primary search
          setSearchAttempt(1);
          let result = await searchForResult(match, 1);
          
          // STRATEGY 2: League-specific search
          if (!result || !result.completed) {
            setSearchAttempt(2);
            result = await searchForResult(match, 2);
          }
          
          // STRATEGY 3: Official source search
          if (!result || !result.completed) {
            setSearchAttempt(3);
            result = await searchForResult(match, 3);
          }
          
          // STRATEGY 4: Latest scores search
          if (!result || !result.completed) {
            setSearchAttempt(4);
            result = await searchForResult(match, 4);
          }
          
          // STRATEGY 5: Alternate team names
          if (!result || !result.completed) {
            setSearchAttempt(5);
            result = await searchForResult(match, 5);
          }
          
          // STRATEGY 6: Google search on official sites
          if (!result || !result.completed) {
            setSearchAttempt(6);
            result = await searchForResult(match, 6);
          }
          
          if (result && result.completed) {
            // Update the match with the result
            await base44.entities.Match.update(match.id, {
              actual_result: {
                winner: result.winner,
                final_score: result.final_score,
                completed: true,
                last_checked: new Date().toISOString()
              }
            });
            updatedCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`Failed to check match ${match.id}:`, err);
          failedCount++;
        }
      }
      
      // Refetch both lists
      await refetchPending();
      await refetchRecent();
      
      alert(`✅ Check Complete!\n\n✓ Updated: ${updatedCount} matches\n✗ Not found: ${failedCount} matches\n\n${failedCount > 0 ? 'Failed matches will be retried in the next hourly check.' : ''}`);
      
    } catch (err) {
      console.error("Manual check error:", err);
      alert(`❌ Error during check: ${err.message}`);
    }
    
    setIsRunning(false);
    setCheckingMatch(null);
    setSearchAttempt(0);
  };

  const searchForResult = async (match, strategy) => {
    const matchDate = match.match_date ? format(new Date(match.match_date), 'MMMM d, yyyy') : '';
    let searchQuery = '';
    
    switch (strategy) {
      case 1: // Primary search
        searchQuery = `${match.home_team} vs ${match.away_team} final score ${matchDate}`;
        break;
      case 2: // League-specific
        searchQuery = `${match.league || match.sport} ${match.home_team} ${match.away_team} game result ${matchDate}`;
        break;
      case 3: // Official source
        searchQuery = `${match.home_team} ${match.away_team} ${matchDate} ESPN final score`;
        break;
      case 4: // Latest scores
        searchQuery = `Latest ${match.sport} scores ${matchDate} ${match.home_team} ${match.away_team}`;
        break;
      case 5: // Alternate names
        const homeCity = match.home_team.split(' ')[0];
        const awayCity = match.away_team.split(' ')[0];
        searchQuery = `${homeCity} vs ${awayCity} final score ${matchDate}`;
        break;
      case 6: // Google search on official sites
        const sportSite = match.sport === 'Basketball' ? 'nba.com' : 
                         match.sport === 'Football' ? 'nfl.com' :
                         match.sport === 'Soccer' ? 'espnfc.com' :
                         match.sport === 'Baseball' ? 'mlb.com' : 'espn.com';
        searchQuery = `site:espn.com OR site:${sportSite} ${match.home_team} ${match.away_team} final ${matchDate}`;
        break;
      default:
        return null;
    }
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for the FINAL SCORE of this game:

${searchQuery}

CRITICAL VERIFICATION:
- Game status MUST say: FINAL, COMPLETED, FINISHED, or RESULT
- DO NOT return results if game says: "Live", "In Progress", "Scheduled", "Upcoming"
- DO NOT return results if game was postponed or cancelled
- Verify the date matches: ${matchDate}
- Get scores from official sources (ESPN, league website, etc.)

If you find the final score, return it.
If you CANNOT confidently verify the game is finished, return completed: false`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            completed: { 
              type: "boolean",
              description: "True ONLY if game is definitively finished (status shows FINAL/COMPLETED)"
            },
            winner: { 
              type: ["string", "null"],
              description: "Name of winning team, null if not completed"
            },
            final_score: { 
              type: ["string", "null"],
              description: "Format: home_score-away_score (e.g. 115-108), null if not completed"
            },
            game_status: {
              type: "string",
              description: "Actual game status found (e.g., FINAL, In Progress, Scheduled, Postponed)"
            },
            source: {
              type: "string",
              description: "Where the result was found (e.g., ESPN, NBA.com)"
            }
          },
          required: ["completed", "game_status"]
        }
      });
      
      return result;
    } catch (err) {
      console.error(`Search strategy ${strategy} failed:`, err);
      return null;
    }
  };

  // Calculate next scheduled run (top of next hour)
  const getNextScheduledRun = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(next.getHours() + 1);
    next.setMinutes(0);
    next.setSeconds(0);
    next.setMilliseconds(0);
    return next;
  };

  const nextRun = getNextScheduledRun();
  const minutesUntilNext = Math.round((nextRun - new Date()) / 1000 / 60);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Admin Badge */}
        <div className="mb-4">
          <Badge className="bg-red-500 text-white">
            <Shield className="w-3 h-3 mr-1" />
            Admin Only
          </Badge>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <RefreshCw className="w-10 h-10 text-blue-400" />
            Auto-Update Status
          </h1>
          <p className="text-slate-300">
            Automated system checks match results every hour and updates AI performance (Admin View)
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Pending Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{readyToCheck.length}</div>
              <p className="text-xs text-slate-400 mt-1">Games ready to verify</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Recently Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{recentlyUpdated.length}</div>
              <p className="text-xs text-slate-400 mt-1">Last 20 results</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Awaiting Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{pendingMatches.length - readyToCheck.length}</div>
              <p className="text-xs text-slate-400 mt-1">Games not yet finished</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Next Auto-Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{minutesUntilNext}m</div>
              <p className="text-xs text-slate-400 mt-1">{format(nextRun, 'h:mm a')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Manual Check Button */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Manual Check</h3>
                <p className="text-blue-100">
                  Force an immediate check for game results (checks up to 5 games)
                </p>
                {checkingMatch && (
                  <div className="mt-3 bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-white text-sm mb-1">
                      <Search className="w-4 h-4 animate-pulse" />
                      <span className="font-semibold">Checking: {checkingMatch.home_team} vs {checkingMatch.away_team}</span>
                    </div>
                    <div className="text-xs text-blue-100">
                      Search Strategy {searchAttempt}/6: {
                        searchAttempt === 1 ? 'Primary search' :
                        searchAttempt === 2 ? 'League-specific search' :
                        searchAttempt === 3 ? 'Official source search' :
                        searchAttempt === 4 ? 'Latest scores search' :
                        searchAttempt === 5 ? 'Alternate team names' :
                        searchAttempt === 6 ? 'Google search on official sites' : ''
                      }
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={runManualCheck}
                disabled={isRunning || readyToCheck.length === 0}
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Check Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Multi-Strategy Search System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-slate-300 text-sm mb-4">
                Our enhanced system uses 6 different search strategies to ensure maximum reliability:
              </p>
              <div className="space-y-2">
                {[
                  { step: 1, name: "Primary Search", desc: "Team vs Team + final score + date" },
                  { step: 2, name: "League-Specific", desc: "League + teams + game result + date" },
                  { step: 3, name: "Official Source", desc: "Teams + date + ESPN final score" },
                  { step: 4, name: "Latest Scores", desc: "Latest sport scores + date, then filter" },
                  { step: 5, name: "Alternate Names", desc: "City names + abbreviations" },
                  { step: 6, name: "Google Search", desc: "Direct Google search on official sports sites (ESPN, NBA.com, NFL.com, MLB.com, etc.)" }
                ].map((strategy) => (
                  <div key={strategy.step} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{strategy.step}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{strategy.name}</div>
                      <div className="text-xs text-slate-400">{strategy.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Alert className="mt-4 bg-blue-500/10 border-blue-500/30">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-200 text-sm ml-2">
                  Each search verifies game status with keywords: FINAL, COMPLETED, FINISHED, RESULT before updating
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Ready to Check */}
        {readyToCheck.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Games Ready for Verification ({readyToCheck.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {readyToCheck.slice(0, 10).map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {match.home_team} vs {match.away_team}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                        <Badge variant="outline" className="text-xs">{match.sport}</Badge>
                        <span>{match.league}</span>
                        <span>•</span>
                        <span>{match.match_date ? format(new Date(match.match_date), 'MMM d, h:mm a') : 'No date'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}
                {readyToCheck.length > 10 && (
                  <div className="text-center text-slate-400 text-sm py-2">
                    + {readyToCheck.length - 10} more games ready to check
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recently Updated */}
        {recentlyUpdated.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recently Updated Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentlyUpdated.slice(0, 5).map((match) => {
                  const isCorrect = match.prediction?.winner?.toLowerCase() === match.actual_result?.winner?.toLowerCase();
                  
                  return (
                    <div key={match.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {match.home_team} vs {match.away_team}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                          <Badge variant="outline" className="text-xs">{match.sport}</Badge>
                          <span>Final: {match.actual_result?.final_score}</span>
                          <span>•</span>
                          <span>Winner: {match.actual_result?.winner}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Correct
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            <XCircle className="w-3 h-3 mr-1" />
                            Incorrect
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {lastCheckTime && (
          <div className="mt-6 text-center text-slate-400 text-sm">
            Last manual check: {format(lastCheckTime, 'h:mm:ss a')}
          </div>
        )}
      </div>
    </div>
  );
}
