import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, Clock, Zap, Activity, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function AutoUpdateStatus() {
  const [isRunning, setIsRunning] = useState(false);
  const queryClient = useQueryClient();

  const { data: pendingMatches, isLoading } = useQuery({
    queryKey: ['pendingMatches'],
    queryFn: async () => {
      const allMatches = await base44.entities.Match.list('-created_date', 500);
      return allMatches.filter(m => !m.actual_result || !m.actual_result.completed);
    },
    initialData: [],
  });

  const { data: recentlyUpdated } = useQuery({
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
    
    try {
      // For each ready match, check the score
      for (const match of readyToCheck.slice(0, 5)) { // Check up to 5 at a time
        try {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are checking if a sports game has finished and getting the final score.

MATCH DETAILS:
- Sport: ${match.sport}
- League: ${match.league}
- Home Team: ${match.home_team}
- Away Team: ${match.away_team}
- Scheduled Date: ${match.match_date}

TASK:
1. Search for the final score of this game using add_context_from_internet
2. Verify the game actually finished (not postponed/cancelled)
3. Find the actual winner and final score from ESPN, official league sites, or reliable sports databases

IMPORTANT:
- Only return data if you can VERIFY the game finished
- Use official sources (ESPN.com, NBA.com, NFL.com, etc.)
- If game was postponed/cancelled, set game_status to that
- If you can't find definitive results, set completed to false

Return the actual game result.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                completed: { type: "boolean", description: "Whether game finished" },
                winner: { type: "string", description: "Team that won" },
                final_score: { type: "string", description: "Final score (e.g., 115-108)" },
                game_status: { 
                  type: "string", 
                  enum: ["finished", "postponed", "cancelled", "not_found"],
                  description: "Status of the game"
                },
                source: { type: "string", description: "Where you found the score" }
              },
              required: ["completed", "game_status"]
            }
          });

          // Update match if we got valid results
          if (result.completed && result.winner && result.final_score) {
            await base44.entities.Match.update(match.id, {
              actual_result: {
                completed: true,
                winner: result.winner,
                final_score: result.final_score,
                verified_at: new Date().toISOString(),
                source: result.source || 'Auto-verified'
              }
            });
          }
          
          // Small delay between checks
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Failed to check match ${match.id}:`, error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['pendingMatches'] });
      queryClient.invalidateQueries({ queryKey: ['recentlyUpdatedMatches'] });
      queryClient.invalidateQueries({ queryKey: ['aiPerformanceMatches'] });
      
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="w-10 h-10 text-green-400" />
            Auto-Update System
          </h1>
          <p className="text-slate-300">
            Automated match results tracking - runs every hour
          </p>
        </div>

        {/* System Status */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Next Auto-Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white mb-1">
                  {new Date(Math.ceil(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <p className="text-blue-100 text-xs">
                  Runs every hour automatically
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Ready to Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white mb-1">{readyToCheck.length}</div>
                <p className="text-orange-100 text-xs">
                  Games that likely finished
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Still Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white mb-1">{pendingMatches.length}</div>
                <p className="text-purple-100 text-xs">
                  Total awaiting results
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Manual Check Button */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Manual Check Now</h3>
                <p className="text-slate-400">
                  Don't want to wait? Run a manual check for the latest game results
                </p>
              </div>
              <Button
                onClick={runManualCheck}
                disabled={isRunning || readyToCheck.length === 0}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Check Now ({readyToCheck.length})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/50 mb-8">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-6 h-6" />
              How Auto-Update Works
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-white">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div>
                  <div className="font-bold mb-1">Automated Hourly Checks</div>
                  <div className="text-slate-300 text-sm">
                    Every hour, the system automatically scans all your pending predictions
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div>
                  <div className="font-bold mb-1">Identifies Finished Games</div>
                  <div className="text-slate-300 text-sm">
                    Checks which games have passed their scheduled time (+ 4 hours buffer for long games)
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div>
                  <div className="font-bold mb-1">Fetches Live Scores</div>
                  <div className="text-slate-300 text-sm">
                    Uses AI with internet access to get final scores from ESPN, official league sites, and sports databases
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div>
                  <div className="font-bold mb-1">Updates Results Automatically</div>
                  <div className="text-slate-300 text-sm">
                    Records the winner, final score, and marks the prediction as complete
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 font-bold">5</div>
                <div>
                  <div className="font-bold mb-1">Calculates Accuracy</div>
                  <div className="text-slate-300 text-sm">
                    AI Performance page automatically updates with correct/incorrect predictions
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Games Ready to Check */}
        {readyToCheck.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Games Ready for Results Check ({readyToCheck.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {readyToCheck.slice(0, 10).map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">
                          {match.home_team} vs {match.away_team}
                        </div>
                        <div className="text-sm text-slate-400">
                          {match.sport} • {new Date(match.match_date).toLocaleString()} • Predicted: {match.prediction?.winner}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-orange-400 border-orange-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Awaiting Score
                      </Badge>
                    </div>
                  </motion.div>
                ))}
                {readyToCheck.length > 10 && (
                  <div className="text-center text-slate-400 text-sm pt-2">
                    + {readyToCheck.length - 10} more games ready
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recently Auto-Updated */}
        {recentlyUpdated.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Recently Auto-Updated ({recentlyUpdated.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {recentlyUpdated.slice(0, 5).map((match, index) => {
                  const isCorrect = match.prediction?.winner?.toLowerCase() === match.actual_result?.winner?.toLowerCase();
                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-slate-900/50 rounded-lg p-4 border-2 ${
                        isCorrect ? 'border-green-500/50' : 'border-red-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">✗</div>
                            )}
                            <div>
                              <div className="font-bold text-white">
                                {match.home_team} vs {match.away_team}
                              </div>
                              <div className="text-xs text-slate-400">
                                Updated: {new Date(match.updated_date).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 ml-7 text-sm">
                            <div>
                              <span className="text-slate-500">Predicted:</span>
                              <span className="text-white ml-2 font-semibold">{match.prediction?.winner}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Actual:</span>
                              <span className="text-white ml-2 font-semibold">{match.actual_result?.winner}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={isCorrect ? 'bg-green-500' : 'bg-red-500'}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}