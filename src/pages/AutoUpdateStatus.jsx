import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, AlertCircle, Shield, CheckCircle, Search, Save, X, AlertTriangle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AutoUpdateStatus() {
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [manualScore, setManualScore] = useState({ winner: "", final_score: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autoUpdateMatches'] });
    },
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

  const matchesWithoutPredictions = pendingMatches.filter(match => !match.prediction);

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

    const currentMatch = pendingMatches.find(m => m.id === selectedMatchId);
    
    if (!currentMatch) {
      setDebugInfo({ step: 'ERROR', message: 'Match not found' });
      return;
    }

    setDebugInfo({ step: 'Checking match data...', currentMatch: currentMatch });

    if (!currentMatch.prediction) {
      setDebugInfo({ 
        step: 'DATA ERROR', 
        message: 'Match is missing prediction field. Cannot update.',
        fix: 'This match was created without required data. Delete it and create a new analysis.'
      });
      return;
    }

    if (currentMatch.betting_markets?.spread?.line && typeof currentMatch.betting_markets.spread.line !== 'string') {
      currentMatch.betting_markets.spread.line = String(currentMatch.betting_markets.spread.line);
    }

    const updateData = {
      ...currentMatch,
      actual_result: {
        winner: manualScore.winner.trim(),
        final_score: manualScore.final_score.trim(),
        completed: true,
        last_checked: new Date().toISOString(),
        source: "Manual Entry"
      }
    };

    delete updateData.id;
    delete updateData.created_date;
    delete updateData.updated_date;
    delete updateData.created_by;

    setDebugInfo({ step: 'Sending update...', dataSize: JSON.stringify(updateData).length });

    updateMutation.mutate({
      id: selectedMatchId,
      data: updateData
    });
  };

  const handleBulkDeleteIncomplete = async () => {
    if (matchesWithoutPredictions.length === 0) {
      alert("No incomplete matches to delete!");
      return;
    }

    const confirmed = window.confirm(
      `⚠️ Delete ${matchesWithoutPredictions.length} incomplete matches?\n\nThese matches are missing required data and cannot be updated.`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    setDebugInfo({ step: 'Deleting incomplete matches...', count: matchesWithoutPredictions.length });

    let deleted = 0;
    let failed = 0;

    for (const match of matchesWithoutPredictions) {
      try {
        await deleteMutation.mutateAsync(match.id);
        deleted++;
        setDebugInfo({ 
          step: 'Deleting...', 
          progress: `${deleted}/${matchesWithoutPredictions.length}`,
          current: `${match.home_team} vs ${match.away_team}`
        });
      } catch (error) {
        console.error(`Failed to delete match ${match.id}:`, error);
        failed++;
      }
    }

    setDebugInfo({ 
      step: 'Complete!', 
      deleted: deleted,
      failed: failed,
      message: `Deleted ${deleted} matches${failed > 0 ? `, ${failed} failed` : ''}`
    });

    setIsDeleting(false);
    
    setTimeout(() => {
      alert(`✅ Deleted ${deleted} incomplete matches!${failed > 0 ? `\n⚠️ ${failed} failed to delete.` : ''}`);
      setDebugInfo(null);
    }, 1500);
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
              <h1 className="text-3xl font-bold text-white">Auto-Update Status</h1>
              <p className="text-slate-400">Manually update pending match results</p>
            </div>
          </div>

          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Shield className="w-4 h-4 mr-2" />
            Admin Only
          </Badge>
        </motion.div>

        {debugInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className={debugInfo.step.includes('ERROR') ? 'bg-red-500/10 border-red-500/50' : 'bg-blue-500/10 border-blue-500/50'}>
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

        {matchesWithoutPredictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="bg-yellow-500/10 border-yellow-500/50">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="flex items-center justify-between">
                <div className="text-yellow-300">
                  <strong>{matchesWithoutPredictions.length}</strong> matches are missing required data and cannot be updated.
                </div>
                <Button
                  onClick={handleBulkDeleteIncomplete}
                  disabled={isDeleting}
                  variant="destructive"
                  size="sm"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Incomplete
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Card className="bg-slate-800/90 border-slate-700 mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-slate-700">
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="w-5 h-5" />
              Google Search Tool
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search: Lakers vs Celtics final score..."
                className="flex-1 bg-slate-900 border-slate-700 text-white"
              />
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-2" />
                Search Google
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              💡 Tip: Search for "[team1] vs [team2] final score" to find the result
            </p>
          </CardContent>
        </Card>

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
                            {!match.prediction && (
                              <Badge className="bg-red-500 text-white">⚠️ Missing Prediction</Badge>
                            )}
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
                        
                        {!match.prediction ? (
                          <Alert className="bg-yellow-500/10 border-yellow-500/50">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <AlertDescription className="text-yellow-300 text-sm">
                              This match is missing required data. Please delete it and create a new search.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Button
                            onClick={() => handleManualUpdate(match)}
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full"
                          >
                            Manual Update
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {selectedMatchId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMatchId(null)}
          >
            <Card 
              className="bg-slate-800 border-slate-700 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-slate-700">
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    Enter Final Result
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMatchId(null)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={submitManualUpdate} className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Winner</Label>
                    <Input
                      value={manualScore.winner}
                      onChange={(e) => setManualScore({...manualScore, winner: e.target.value})}
                      placeholder="e.g., Milwaukee Bucks"
                      className="bg-slate-900 border-slate-700 text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white mb-2 block">Final Score</Label>
                    <Input
                      value={manualScore.final_score}
                      onChange={(e) => setManualScore({...manualScore, final_score: e.target.value})}
                      placeholder="Format: [winner score]-[loser score]"
                      className="bg-slate-900 border-slate-700 text-white"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      💡 Format: [winner score]-[loser score]
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedMatchId(null)}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      disabled={updateMutation.isLoading}
                    >
                      {updateMutation.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Result
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}