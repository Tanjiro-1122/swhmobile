import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Database, 
  Users, 
  Target,
  Zap,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";

export default function SystemHealthCheck() {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const runComprehensiveTest = async () => {
    setIsRunningTest(true);
    const results = {
      entities: [],
      dataIntegrity: [],
      duplicates: [],
      authentication: [],
      vipSystem: [],
      betting: [],
      timestamp: new Date().toISOString()
    };

    try {
      // TEST 1: Entity Schemas
      console.log("🔍 TEST 1: Checking entity schemas...");
      try {
        const matchSchema = await base44.entities.Match.schema();
        results.entities.push({ name: "Match", status: "success", schema: Object.keys(matchSchema).length });
        
        const playerSchema = await base44.entities.PlayerStats.schema();
        results.entities.push({ name: "PlayerStats", status: "success", schema: Object.keys(playerSchema).length });
        
        const teamSchema = await base44.entities.TeamStats.schema();
        results.entities.push({ name: "TeamStats", status: "success", schema: Object.keys(teamSchema).length });
        
        const accuracySchema = await base44.entities.PredictionAccuracy.schema();
        results.entities.push({ name: "PredictionAccuracy", status: "success", schema: Object.keys(accuracySchema).length });
        
        const vipSchema = await base44.entities.VIPCounter.schema();
        results.entities.push({ name: "VIPCounter", status: "success", schema: Object.keys(vipSchema).length });
      } catch (error) {
        results.entities.push({ name: "Schema Check", status: "error", message: error.message });
      }

      // TEST 2: Data Integrity - Check for duplicate records
      console.log("🔍 TEST 2: Checking for duplicate data...");
      try {
        if (currentUser) {
          const matches = await base44.entities.Match.filter({ created_by: currentUser.email });
          const players = await base44.entities.PlayerStats.filter({ created_by: currentUser.email });
          const teams = await base44.entities.TeamStats.filter({ created_by: currentUser.email });
          
          // Check for duplicate matches
          const matchNames = matches.map(m => `${m.home_team}-${m.away_team}-${m.match_date}`);
          const duplicateMatches = matchNames.filter((item, index) => matchNames.indexOf(item) !== index);
          
          if (duplicateMatches.length > 0) {
            results.duplicates.push({ 
              type: "Matches", 
              status: "warning", 
              count: duplicateMatches.length,
              message: `Found ${duplicateMatches.length} potential duplicate matches`
            });
          } else {
            results.duplicates.push({ type: "Matches", status: "success", message: "No duplicates found" });
          }

          // Check for duplicate players
          const playerNames = players.map(p => `${p.player_name}-${p.team}`);
          const duplicatePlayers = playerNames.filter((item, index) => playerNames.indexOf(item) !== index);
          
          if (duplicatePlayers.length > 0) {
            results.duplicates.push({ 
              type: "Players", 
              status: "warning", 
              count: duplicatePlayers.length,
              message: `Found ${duplicatePlayers.length} potential duplicate players`
            });
          } else {
            results.duplicates.push({ type: "Players", status: "success", message: "No duplicates found" });
          }

          results.dataIntegrity.push({ 
            type: "Record Count", 
            status: "success", 
            matches: matches.length, 
            players: players.length, 
            teams: teams.length 
          });
        }
      } catch (error) {
        results.dataIntegrity.push({ type: "Data Check", status: "error", message: error.message });
      }

      // TEST 3: Authentication System
      console.log("🔍 TEST 3: Testing authentication...");
      try {
        const isAuth = await base44.auth.isAuthenticated();
        results.authentication.push({ 
          type: "Auth Status", 
          status: "success", 
          authenticated: isAuth,
          user: currentUser?.email || "Not logged in"
        });

        if (currentUser) {
          results.authentication.push({
            type: "User Data",
            status: "success",
            role: currentUser.role,
            subscription: currentUser.subscription_status || "free",
            vip: currentUser.vip_member || false
          });
        }
      } catch (error) {
        results.authentication.push({ type: "Auth Check", status: "error", message: error.message });
      }

      // TEST 4: VIP Counter System
      console.log("🔍 TEST 4: Checking VIP counter...");
      try {
        const counters = await base44.entities.VIPCounter.list('-updated_date', 1);
        if (counters.length > 0) {
          results.vipSystem.push({
            type: "VIP Counter",
            status: "success",
            current_count: counters[0].current_vip_count,
            last_updated: counters[0].last_updated,
            spots_remaining: 20 - counters[0].current_vip_count
          });

          // Verify cached count matches
          const cached = localStorage.getItem('vipCount');
          if (cached && parseInt(cached) !== counters[0].current_vip_count) {
            results.vipSystem.push({
              type: "Cache Sync",
              status: "warning",
              message: `Cache (${cached}) doesn't match DB (${counters[0].current_vip_count})`
            });
          } else {
            results.vipSystem.push({ type: "Cache Sync", status: "success", message: "Cache synchronized" });
          }
        } else {
          results.vipSystem.push({
            type: "VIP Counter",
            status: "warning",
            message: "No VIP counter found - needs initialization"
          });
        }
      } catch (error) {
        results.vipSystem.push({ type: "VIP Check", status: "error", message: error.message });
      }

      // TEST 5: Player Stats Validation
      console.log("🔍 TEST 5: Validating player stats structure...");
      try {
        if (currentUser) {
          const players = await base44.entities.PlayerStats.filter({ created_by: currentUser.email }, '-created_date', 5);
          
          if (players.length > 0) {
            players.forEach((player, index) => {
              const issues = [];
              
              // Check if starting status is present
              if (player.is_starting === undefined || player.is_starting === null) {
                issues.push("Missing starting status");
              }
              
              // Check if sport-specific stats match
              const sport = player.sport?.toLowerCase() || '';
              if (sport.includes('baseball') || sport.includes('mlb')) {
                if (!player.season_averages?.hits_per_game && !player.season_averages?.batting_average) {
                  issues.push("Missing baseball stats (hits/batting avg)");
                }
                if (player.season_averages?.points_per_game) {
                  issues.push("❌ REDUNDANCY: Baseball player has basketball stats (points)");
                }
              }
              
              if (sport.includes('basketball') || sport.includes('nba')) {
                if (!player.season_averages?.points_per_game) {
                  issues.push("Missing basketball stats (points)");
                }
                if (player.season_averages?.hits_per_game) {
                  issues.push("❌ REDUNDANCY: Basketball player has baseball stats (hits)");
                }
              }
              
              if (sport.includes('football') || sport.includes('nfl')) {
                const hasFootballStats = player.season_averages?.passing_yards_per_game || 
                                       player.season_averages?.rushing_yards_per_game || 
                                       player.season_averages?.receiving_yards_per_game;
                if (!hasFootballStats) {
                  issues.push("Missing football stats");
                }
                if (player.season_averages?.hits_per_game || player.season_averages?.points_per_game) {
                  issues.push("❌ REDUNDANCY: Football player has wrong sport stats");
                }
              }

              if (issues.length > 0) {
                results.betting.push({
                  type: `Player: ${player.player_name}`,
                  status: issues.some(i => i.includes('REDUNDANCY')) ? "error" : "warning",
                  issues: issues
                });
              } else {
                results.betting.push({
                  type: `Player: ${player.player_name}`,
                  status: "success",
                  sport: player.sport,
                  starting: player.is_starting
                });
              }
            });
          } else {
            results.betting.push({ type: "Player Stats", status: "info", message: "No player stats to validate" });
          }
        }
      } catch (error) {
        results.betting.push({ type: "Player Validation", status: "error", message: error.message });
      }

      // TEST 6: Match Data Validation
      console.log("🔍 TEST 6: Validating match data...");
      try {
        if (currentUser) {
          const matches = await base44.entities.Match.filter({ created_by: currentUser.email }, '-created_date', 5);
          
          if (matches.length > 0) {
            matches.forEach(match => {
              const issues = [];
              
              // Check home/away teams
              if (!match.home_team || !match.away_team) {
                issues.push("Missing home or away team");
              }
              
              // Check venue
              if (!match.venue) {
                issues.push("Missing venue information");
              }
              
              // Check probabilities total 100%
              const total = (match.home_win_probability || 0) + (match.away_win_probability || 0) + (match.draw_probability || 0);
              if (Math.abs(total - 100) > 1) {
                issues.push(`❌ Probabilities don't total 100% (total: ${total.toFixed(1)}%)`);
              }
              
              // Check key players
              if (!match.key_players || match.key_players.length === 0) {
                issues.push("No key players data");
              }
              
              if (issues.length > 0) {
                results.betting.push({
                  type: `Match: ${match.home_team} vs ${match.away_team}`,
                  status: issues.some(i => i.includes('❌')) ? "error" : "warning",
                  issues: issues
                });
              }
            });
          }
        }
      } catch (error) {
        results.betting.push({ type: "Match Validation", status: "error", message: error.message });
      }

      setTestResults(results);
    } catch (error) {
      console.error("Test error:", error);
      setTestResults({ error: error.message });
    }

    setIsRunningTest(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      success: 'bg-green-100 text-green-800 border-green-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      error: 'bg-red-100 text-red-800 border-red-300',
      info: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[status] || colors.info;
  };

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Admin access required to view system health check.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black">System Health Check</h1>
                <p className="text-blue-100">Comprehensive app diagnostics and validation</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Run Test Button */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Run Comprehensive Test</h3>
                <p className="text-slate-400">
                  Check entities, data integrity, duplicates, authentication, and betting stats
                </p>
              </div>
              <Button
                onClick={runComprehensiveTest}
                disabled={isRunningTest}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isRunningTest ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Run Full Diagnostic
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults && !testResults.error && (
          <div className="space-y-6">
            {/* Entities */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Database className="w-5 h-5 text-blue-400" />
                  Entity Schemas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.entities.map((entity, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-900 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(entity.status)}
                        <span className="font-semibold text-white">{entity.name}</span>
                      </div>
                      <Badge className={getStatusBadge(entity.status)}>
                        {entity.schema ? `${entity.schema} fields` : entity.message}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Duplicates */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-yellow-400" />
                  Duplicate Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.duplicates.map((dup, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-900 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(dup.status)}
                        <span className="font-semibold text-white">{dup.type}</span>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusBadge(dup.status)}>
                          {dup.message}
                        </Badge>
                        {dup.count > 0 && (
                          <div className="text-xs text-red-400 mt-1">
                            Action needed: {dup.count} duplicates
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Authentication */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-green-400" />
                  Authentication System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.authentication.map((auth, index) => (
                    <div key={index} className="bg-slate-900 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(auth.status)}
                        <span className="font-semibold text-white">{auth.type}</span>
                      </div>
                      {auth.authenticated !== undefined && (
                        <div className="ml-8 text-slate-400 text-sm space-y-1">
                          <div>Authenticated: {auth.authenticated ? 'Yes' : 'No'}</div>
                          <div>User: {auth.user}</div>
                        </div>
                      )}
                      {auth.role && (
                        <div className="ml-8 text-slate-400 text-sm space-y-1">
                          <div>Role: {auth.role}</div>
                          <div>Subscription: {auth.subscription}</div>
                          <div>VIP: {auth.vip ? 'Yes' : 'No'}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* VIP System */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-purple-400" />
                  VIP Counter System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.vipSystem.map((vip, index) => (
                    <div key={index} className="bg-slate-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(vip.status)}
                          <span className="font-semibold text-white">{vip.type}</span>
                        </div>
                        <Badge className={getStatusBadge(vip.status)}>
                          {vip.message || 'OK'}
                        </Badge>
                      </div>
                      {vip.current_count !== undefined && (
                        <div className="ml-8 text-slate-400 text-sm space-y-1">
                          <div>Current VIP Count: {vip.current_count}/20</div>
                          <div>Spots Remaining: {vip.spots_remaining}</div>
                          {vip.last_updated && (
                            <div>Last Updated: {new Date(vip.last_updated).toLocaleString()}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Betting Stats Validation */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Betting Stats Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.betting.length > 0 ? (
                    testResults.betting.map((bet, index) => (
                      <div key={index} className="bg-slate-900 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(bet.status)}
                            <span className="font-semibold text-white">{bet.type}</span>
                          </div>
                          <Badge className={getStatusBadge(bet.status)}>
                            {bet.status.toUpperCase()}
                          </Badge>
                        </div>
                        {bet.issues && bet.issues.length > 0 && (
                          <div className="ml-8 mt-2 space-y-1">
                            {bet.issues.map((issue, i) => (
                              <div key={i} className={`text-sm ${
                                issue.includes('REDUNDANCY') ? 'text-red-400 font-bold' : 'text-yellow-400'
                              }`}>
                                • {issue}
                              </div>
                            ))}
                          </div>
                        )}
                        {bet.sport && (
                          <div className="ml-8 text-slate-400 text-sm mt-2">
                            Sport: {bet.sport} | Starting: {bet.starting ? 'Yes' : 'No'}
                          </div>
                        )}
                        {bet.message && (
                          <div className="ml-8 text-slate-400 text-sm mt-2">
                            {bet.message}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-8">
                      No betting stats data to validate
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Test Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {[...testResults.entities, ...testResults.duplicates, ...testResults.authentication, ...testResults.vipSystem, ...testResults.betting]
                        .filter(t => t.status === 'success').length}
                    </div>
                    <div className="text-sm text-green-300">Passed</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                      {[...testResults.entities, ...testResults.duplicates, ...testResults.authentication, ...testResults.vipSystem, ...testResults.betting]
                        .filter(t => t.status === 'warning').length}
                    </div>
                    <div className="text-sm text-yellow-300">Warnings</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="text-3xl font-bold text-red-400 mb-1">
                      {[...testResults.entities, ...testResults.duplicates, ...testResults.authentication, ...testResults.vipSystem, ...testResults.betting]
                        .filter(t => t.status === 'error').length}
                    </div>
                    <div className="text-sm text-red-300">Errors</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {new Date(testResults.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-blue-300">Last Run</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {testResults?.error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Test Error: {testResults.error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}