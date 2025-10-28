import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, AlertCircle, Shield, CheckCircle, Search, Save, X, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AutoUpdateStatus() {
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [manualScore, setManualScore] = useState({ winner: "", final_score: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allMatches, isLoading } = useQuery({
    queryKey: ['autoUpdateMatches'],
    queryFn: () => base44.entities.Match.list('-created_date', 1000),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      setDebugInfo({ step: 'Starting update...', data: data });
      
      try {
        setDebugInfo({ step: 'Calling API...', matchId: id, data: data });
        const result = await base44.entities.Match.update(id, data);
        setDebugInfo({ step: 'Success!', result: result });
        return result;
      } catch (error) {
        setDebugInfo({ 
          step: 'ERROR', 
          error: error.message,
          errorType: error.constructor.name,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autoUpdateMatches'] });
      setSelectedMatchId(null);
      setManualScore({ winner: "", final_score: "" });
      setDebugInfo({ step: 'Complete!', message: 'Match updated successfully' });
      
      setTimeout(() => {
        alert("✅ Match result updated successfully!");
        setDebugInfo(null);
      }, 1000);
    },
    onError: (error) => {
      // Error already shown in debugInfo
    }
  });

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

  const pendingMatches = allMatches.filter(match => {
    if (!match.match_date) return false;
    if (match.actual_result?.completed === true) return false;
    
    const matchDate = new Date(match.match_date);
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    
    return matchDate < fourHoursAgo;
  });

  const handleManualUpdate = (match) => {
    setSelectedMatchId(match.id);
    setDebugInfo(null);
    setManualScore({
      winner: match.actual_result?.winner || "",
      final_score: match.actual_result?.final_score || ""
    });
  };

  const submitManualUpdate = (e) => {
    e.preventDefault();
    setDebugInfo({ step: 'Validating...', winner: manualScore.winner, score: manualScore.final_score });
    
    if (!manualScore.winner || !manualScore.final_score) {
      setDebugInfo({ step: 'VALIDATION ERROR', message: 'Please fill in both fields' });
      return;
    }

    if (!manualScore.final_score.includes('-')) {
      setDebugInfo({ step: 'VALIDATION ERROR', message: 'Score must be in format: 122-116' });
      return;
    }

    const updateData = {
      actual_result: {
        winner: manualScore.winner.trim(),
        final_score: manualScore.final_score.trim(),
        completed: true,
        last_checked: new Date().toISOString(),
        source: "Manual Entry"
      }
    };

    updateMutation.mutate({
      id: selectedMatchId,
      data: updateData
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      window.open(googleSearchUrl, '_blank');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Pending Match Updates</h1>
              <p className="text-slate-400">Manually update match results that need attention</p>
            </div>
          </div>

          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Shield className="w-4 h-4 mr-2" />
            Admin Only
          </Badge>
        </motion.div>

        {/* Debug Info Display */}
        {debugInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className={debugInfo.step === 'ERROR' || debugInfo.step === 'VALIDATION ERROR' ? 'bg-red-500/10 border-red-500/50' : 'bg-blue-500/10 border-blue-500/50'}>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="font-bold mb-2">{debugInfo.step}</div>
                <pre className="text-xs bg-slate-900 p-2 rounded overflow-auto max-h-64">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Google Search Tool */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Quick Google Search
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-300 mb-4">Search for match results, scores, and sports news directly on Google</p>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Lakers vs Celtics final score October 23 2025"
                  className="flex-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
                <Button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                💡 Tip: Include team names, date, and "final score" for best results
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Matches */}
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
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                        </div>
                        <Button
                          onClick={() => handleManualUpdate(match)}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full"
                        >
                          Manual Update
                        </Button>
                      </div>

                      {selectedMatchId === match.id && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          onSubmit={submitManualUpdate}
                          className="mt-4 p-4 bg-slate-800 rounded border border-slate-600"
                        >
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Enter Final Result:
                          </h4>
                          <div className="grid gap-4">
                            <div>
                              <Label className="text-slate-300 mb-2 block">Winner (Full Team Name)</Label>
                              <Input
                                value={manualScore.winner}
                                onChange={(e) => setManualScore({...manualScore, winner: e.target.value})}
                                placeholder="e.g., Milwaukee Bucks"
                                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                                required
                              />
                            </div>
                            <div>
                              <Label className="text-slate-300 mb-2 block">Final Score</Label>
                              <Input
                                value={manualScore.final_score}
                                onChange={(e) => setManualScore({...manualScore, final_score: e.target.value})}
                                placeholder="e.g., 122-116"
                                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                                required
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="submit"
                                disabled={updateMutation.isLoading}
                                className="bg-green-600 hover:bg-green-700 flex-1"
                              >
                                {updateMutation.isLoading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  setSelectedMatchId(null);
                                  setManualScore({ winner: "", final_score: "" });
                                  setDebugInfo(null);
                                }}
                                variant="outline"
                                className="border-slate-600"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </motion.form>
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