
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Target, // Used for Overall Accuracy card icon
  Activity, // Used for Total Predictions card icon
  CheckCircle, // Used for Correct Predictions card icon and recent prediction icon
  XCircle, // Used for recent prediction icon
  AlertCircle, // Used for 'No Accuracy Data Yet' card icon
  RefreshCw, // Used for checking state of manual check button
  Zap // Used for manual check button icon
} from "lucide-react";
import { motion } from "framer-motion";
// AutoAccuracyTracker component is completely removed to disable automatic checks

export default function AccuracyTracker() {
  const [isCheckingAccuracy, setIsCheckingAccuracy] = useState(false);
  const [checkMessage, setCheckMessage] = useState(null);
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

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => base44.entities.PredictionAccuracy.list('-prediction_date'),
    initialData: [],
    // Removed refetchInterval to prevent automatic checks
  });

  const createAccuracyRecord = useMutation({
    mutationFn: (data) => base44.entities.PredictionAccuracy.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    }
  });

  // Manual accuracy check with aggressive rate limiting
  const handleManualAccuracyCheck = async () => {
    // Check if we've run this recently (within last 12 hours)
    const lastCheckTime = localStorage.getItem('lastManualAccuracyCheck');
    if (lastCheckTime) {
      const timeSinceLastCheck = Date.now() - parseInt(lastCheckTime, 10);
      const twelveHours = 12 * 60 * 60 * 1000;
      if (timeSinceLastCheck < twelveHours) {
        const hoursRemaining = Math.ceil((twelveHours - timeSinceLastCheck) / (60 * 60 * 1000));
        setCheckMessage({
          type: "warning",
          text: `⏸️ Please wait ${hoursRemaining} more hours before checking again to avoid rate limits.`
        });
        return;
      }
    }

    setIsCheckingAccuracy(true);
    setCheckMessage(null);

    try {
      console.log("🔍 Starting manual accuracy check...");

      // Get all matches
      setCheckMessage({ type: "info", text: "1/5: Fetching recent matches..." });
      const allMatches = await base44.entities.Match.list('-match_date', 30); // Reduced to 30

      // Wait 3 seconds after first API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Filter matches that have finished (6+ hours ago)
      setCheckMessage({ type: "info", text: "2/5: Filtering finished matches..." });
      const now = new Date();
      const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));

      const finishedMatches = allMatches.filter(match => {
        if (!match.match_date) return false;
        const matchDate = new Date(match.match_date);
        return matchDate < sixHoursAgo;
      });

      // Get existing accuracy records
      setCheckMessage({ type: "info", text: "3/5: Checking existing accuracy records..." });
      const existingRecords = await base44.entities.PredictionAccuracy.list();

      // Wait 3 seconds after second API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      const existingMatchIds = new Set(existingRecords.map(r => r.match_id).filter(Boolean));

      // Filter unprocessed matches
      const unprocessedMatches = finishedMatches.filter(match => !existingMatchIds.has(match.id));

      if (unprocessedMatches.length === 0) {
        setCheckMessage({
          type: "success",
          text: "✅ All finished games have been checked. No new results to verify."
        });
        setIsCheckingAccuracy(false);
        localStorage.setItem('lastManualAccuracyCheck', Date.now().toString());
        return;
      }

      // Process ONLY 1 game to avoid rate limits
      const matchToProcess = unprocessedMatches[0];

      setCheckMessage({ type: "info", text: `4/5: Invoking AI to verify ${matchToProcess.home_team} vs ${matchToProcess.away_team}... (This takes a few seconds)` });
      console.log(`📊 Verifying: ${matchToProcess.home_team} vs ${matchToProcess.away_team}`);

      // Wait 5 seconds before LLM call
      console.log("⏳ Waiting 5 seconds before API call...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      const verificationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Verify the ACTUAL result of this completed game.

GAME:
- Sport: ${matchToProcess.sport}
- Home: ${matchToProcess.home_team}
- Away: ${matchToProcess.away_team}
- Date: ${matchToProcess.match_date}

OUR PREDICTION: ${matchToProcess.home_win_probability > matchToProcess.away_win_probability ? matchToProcess.home_team : matchToProcess.away_team} to win

Search ESPN or StatMuse for the final score. Was our prediction correct?`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            game_status: { type: "string", enum: ["completed", "postponed", "cancelled", "not_found"] },
            actual_outcome: { type: "string" },
            final_score: { type: "string" },
            was_correct: { type: "boolean" },
            notes: { type: "string" }
          }
        }
      });

      setCheckMessage({ type: "info", text: "5/5: Processing verification result..." });
      if (verificationResult.game_status === "completed" && verificationResult.was_correct !== undefined) {
        await createAccuracyRecord.mutateAsync({
          prediction_type: "match",
          sport: matchToProcess.sport,
          predicted_outcome: `${matchToProcess.home_win_probability > matchToProcess.away_win_probability ? matchToProcess.home_team : matchToProcess.away_team} to win`,
          actual_outcome: verificationResult.actual_outcome || verificationResult.final_score,
          was_correct: verificationResult.was_correct,
          confidence_level: matchToProcess.confidence_level || 'medium', // Default if not present
          prediction_date: matchToProcess.match_date,
          match_id: matchToProcess.id
        });

        setCheckMessage({
          type: "success",
          text: `✅ Verified 1 game result. ${unprocessedMatches.length - 1} games remaining. Run again in 12 hours to check more.`
        });
        queryClient.invalidateQueries({ queryKey: ['predictions'] }); // Invalidate to refetch accuracy data
      } else {
        setCheckMessage({
          type: "info",
          text: `ℹ️ Game status: ${verificationResult.game_status}. ${verificationResult.notes || ''}. No accuracy record created.`
        });
      }

      localStorage.setItem('lastManualAccuracyCheck', Date.now().toString());

    } catch (error) {
      console.error("Error checking accuracy:", error);
      let errorMessage = "An unknown error occurred. Please try again in 12 hours.";
      if (error.message) {
        errorMessage = `❌ Error: ${error.message}. Please try again in 12 hours.`;
      }
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        errorMessage = "🚫 Rate limit reached. Please wait 12 hours before trying again.";
      }
      setCheckMessage({
        type: "error",
        text: errorMessage
      });
    }

    setIsCheckingAccuracy(false);
  };

  // Stats Calculations
  const totalPredictions = predictions.length;
  const correctPredictions = predictions.filter(p => p.was_correct === true).length;
  const incorrectPredictions = predictions.filter(p => p.was_correct === false).length;
  const overallAccuracy = totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : "N/A";

  const bySport = predictions.reduce((acc, p) => {
    if (!p.sport) return acc;
    if (!acc[p.sport]) {
      acc[p.sport] = { total: 0, correct: 0, incorrect: 0 };
    }
    acc[p.sport].total++;
    if (p.was_correct === true) acc[p.sport].correct++;
    if (p.was_correct === false) acc[p.sport].incorrect++;
    return acc;
  }, {});

  const byConfidence = predictions.reduce((acc, p) => {
    const level = p.confidence_level || 'unknown';
    if (!acc[level]) {
      acc[level] = { total: 0, correct: 0, incorrect: 0 };
    }
    acc[level].total++;
    if (p.was_correct === true) acc[level].correct++;
    if (p.was_correct === false) acc[level].incorrect++;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* AutoAccuracyTracker component removed */}

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black">Accuracy Tracker</h1>
              <p className="text-emerald-100 text-lg mt-2">
                Real-time verification of our AI predictions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Manual Check Button */}
        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Manual Accuracy Check</h3>
                <p className="text-slate-400 text-sm">
                  Verify finished games and update accuracy stats (limited to once every 12 hours)
                </p>
              </div>
              <Button
                onClick={handleManualAccuracyCheck}
                disabled={isCheckingAccuracy}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold"
              >
                {isCheckingAccuracy ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Check Accuracy Now
                  </>
                )}
              </Button>
            </div>

            {checkMessage && (
              <Alert className={`mt-4 ${
                checkMessage.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                checkMessage.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' :
                checkMessage.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                'bg-blue-500/10 border-blue-500/50 text-blue-400'
              }`}>
                <AlertDescription>{checkMessage.text}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading accuracy data...</p>
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Total Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-black text-white">{totalPredictions}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-800/80 to-emerald-900/80 backdrop-blur-xl border-2 border-green-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Correct
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-black text-green-400">{correctPredictions}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="w-5 h-5 text-emerald-400" />
                    Overall Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-black text-emerald-400">{overallAccuracy}%</div>
                </CardContent>
              </Card>
            </div>

            {/* By Sport */}
            {Object.keys(bySport).length > 0 && (
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Accuracy by Sport</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(bySport).map(([sport, stats]) => {
                      const accuracy = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0;
                      return (
                        <div key={sport} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-bold text-white">{sport}</span>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              {accuracy}% Accurate
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-400">
                            {stats.correct} correct / {stats.incorrect} incorrect / {stats.total} total
                          </div>
                          <div className="mt-2 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all"
                              style={{ width: `${accuracy}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* By Confidence */}
            {Object.keys(byConfidence).length > 0 && (
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Accuracy by Confidence Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(byConfidence).map(([level, stats]) => {
                      const accuracy = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0;
                      let badgeClasses = 'bg-slate-500/20 text-slate-400 border-slate-500/30';
                      if (level === 'high') {
                        badgeClasses = 'bg-green-500/20 text-green-400 border-green-500/30';
                      } else if (level === 'medium') {
                        badgeClasses = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                      } else if (level === 'low') {
                        badgeClasses = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                      }

                      return (
                        <div key={level} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-bold text-white capitalize">{level} Confidence</span>
                            <Badge className={badgeClasses}>
                              {accuracy}% Accurate
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-400">
                            {stats.correct} correct / {stats.incorrect} incorrect / {stats.total} total
                          </div>
                          <div className="mt-2 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={ `h-full transition-all ${
                                level === 'high' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                level === 'medium' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                level === 'low' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                'bg-slate-500'
                              }`
                            }
                              style={{ width: `${accuracy}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Predictions */}
            {predictions.length > 0 && (
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictions.slice(0, 10).map((pred, idx) => (
                      <motion.div
                        key={pred.id || idx} // Use pred.id if available, fallback to idx
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {pred.was_correct ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                              <span className="font-bold text-white">
                                {pred.was_correct ? 'Correct' : 'Incorrect'}
                              </span>
                              <Badge variant="outline" className="text-slate-400">
                                {pred.sport}
                              </Badge>
                              {pred.confidence_level && (
                                <Badge variant="outline" className="text-slate-400 capitalize">
                                  {pred.confidence_level}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-slate-400 mb-1">
                              <strong>Predicted:</strong> {pred.predicted_outcome}
                            </div>
                            <div className="text-sm text-slate-400">
                              <strong>Actual:</strong> {pred.actual_outcome || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-500 mt-2">
                                {pred.prediction_date ? new Date(pred.prediction_date).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {predictions.length === 0 && !isLoading && (
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-slate-700">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Accuracy Data Yet</h3>
                  <p className="text-slate-400 mb-6">
                    Click "Check Accuracy Now" to start verifying finished games and tracking prediction accuracy.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
