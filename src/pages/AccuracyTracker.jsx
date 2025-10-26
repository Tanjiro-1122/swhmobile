
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Target, Award, Calendar, BarChart3, CheckCircle, XCircle, AlertTriangle, RefreshCw, Clock, Activity } from "lucide-react";
import { motion } from "framer-motion";
import AutoAccuracyTracker from "../components/accuracy/AutoAccuracyTracker";

export default function AccuracyTracker() {
  const [testingTracking, setTestingTracking] = useState(false);
  const [isManualCheckRunning, setIsManualCheckRunning] = useState(false);
  const [manualCheckMessage, setManualCheckMessage] = useState(null);
  const queryClient = useQueryClient();

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => base44.entities.PredictionAccuracy.list('-prediction_date', 100),
    initialData: [],
    refetchInterval: 60000 // Refetch every minute to show updates
  });

  const createTestPrediction = useMutation({
    mutationFn: async () => {
      // Create a test prediction
      return await base44.entities.PredictionAccuracy.create({
        prediction_type: "match",
        sport: "Basketball",
        predicted_outcome: "Lakers win by 5+ points",
        actual_outcome: "Lakers won by 8 points",
        was_correct: true,
        confidence_level: "high",
        prediction_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    }
  });

  const handleTestTracking = async () => {
    setTestingTracking(true);
    try {
      await createTestPrediction.mutateAsync();
      alert("✅ Test prediction created successfully! Check the stats below.");
    } catch (error: any) {
      alert("❌ Error creating test prediction: " + error.message);
    }
    setTestingTracking(false);
  };

  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['predictions'] });
  };

  const runManualAccuracyCheck = async () => {
    // Check cooldown
    const lastManualCheck = localStorage.getItem('lastManualAccuracyCheck');
    if (lastManualCheck) {
      const timeSince = Date.now() - parseInt(lastManualCheck);
      const oneHour = 60 * 60 * 1000;
      if (timeSince < oneHour) {
        const minutesRemaining = Math.ceil((oneHour - timeSince) / (60 * 1000));
        alert(`⏸️ Please wait ${minutesRemaining} minutes before running another manual check to avoid rate limits.`);
        return;
      }
    }

    if (!confirm("This will check ONE finished game and may take 15-20 seconds. Continue?")) {
      return;
    }

    setIsManualCheckRunning(true);
    setManualCheckMessage(null);

    try {
      setManualCheckMessage("1/5: Fetching recent matches...");
      const allMatches = await base44.entities.Match.list('-match_date', 50);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay to simulate work and prevent aggressive rate limiting

      setManualCheckMessage("2/5: Filtering finished matches...");
      const now = new Date();
      // Consider matches finished more than 6 hours ago as 'past games' eligible for accuracy check
      const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
      
      const finishedMatches = allMatches.filter(match => {
        if (!match.match_date) return false;
        const matchDate = new Date(match.match_date);
        return matchDate < sixHoursAgo;
      });

      setManualCheckMessage("3/5: Checking existing accuracy records...");
      const existingRecords = await base44.entities.PredictionAccuracy.list();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay

      // Create a Set of match_ids that already have accuracy records
      const existingMatchIds = new Set(existingRecords.map(r => r.match_id).filter(Boolean));
      // Filter out matches that already have accuracy records
      const unprocessedMatches = finishedMatches.filter(match => !existingMatchIds.has(match.id));

      if (unprocessedMatches.length === 0) {
        setManualCheckMessage("✅ All finished games have been processed!");
        setIsManualCheckRunning(false);
        return;
      }

      const matchToProcess = unprocessedMatches[0];
      
      setManualCheckMessage(`4/5: Invoking AI to verify ${matchToProcess.home_team} vs ${matchToProcess.away_team}... (This takes 10 seconds)`);

      // Significant delay before LLM call to respect rate limits and simulate real world processing
      await new Promise(resolve => setTimeout(resolve, 10000));

      const verificationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Verify the ACTUAL result of this completed game.
GAME: ${matchToProcess.home_team} vs ${matchToProcess.away_team}
Date: ${matchToProcess.match_date}
Sport: ${matchToProcess.sport}
Get the official final score from ESPN or StatMuse. Return game_status and was_correct.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            game_status: { type: "string", enum: ["completed", "postponed", "cancelled", "not_found"] },
            actual_outcome: { type: "string" },
            final_score: { type: "string" },
            winner: { type: "string" },
            was_correct: { type: "boolean" }
          },
          required: ["game_status"]
        }
      });

      await new Promise(resolve => setTimeout(resolve, 3000)); // Delay after LLM call

      if (verificationResult.game_status === "completed" && verificationResult.was_correct !== undefined) {
        await base44.entities.PredictionAccuracy.create({
          prediction_type: "match",
          sport: matchToProcess.sport,
          predicted_outcome: `${matchToProcess.home_win_probability > matchToProcess.away_win_probability ? matchToProcess.home_team : matchToProcess.away_team} to win`, // Simplified prediction
          actual_outcome: verificationResult.actual_outcome || `${verificationResult.winner} won`,
          was_correct: verificationResult.was_correct,
          // Assuming Match entity has confidence_level, or default to medium
          confidence_level: matchToProcess.confidence_level || "medium", 
          prediction_date: matchToProcess.match_date,
          match_id: matchToProcess.id
        });

        setManualCheckMessage(`✅ 5/5: Successfully processed: ${matchToProcess.home_team} vs ${matchToProcess.away_team} - ${verificationResult.was_correct ? 'Prediction CORRECT' : 'Prediction INCORRECT'}`);
        localStorage.setItem('lastManualAccuracyCheck', Date.now().toString()); // Update cooldown
        queryClient.invalidateQueries({ queryKey: ['predictions'] }); // Invalidate to refetch accuracy data
      } else {
        setManualCheckMessage(`⏭️ 5/5: Skipped. Game status: ${verificationResult.game_status}. No accuracy record created.`);
      }

    } catch (error: any) {
      console.error("Manual check error:", error);
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        setManualCheckMessage("🚫 Rate limit reached. Please wait 1 hour before trying again.");
      } else {
        setManualCheckMessage(`❌ Error: ${error.message}`);
      }
    }

    setIsManualCheckRunning(false);
  };

  // Calculate statistics
  const totalPredictions = predictions?.length || 0;
  const correctPredictions = predictions?.filter(p => p.was_correct).length || 0;
  const accuracyRate = totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : 0;

  // By sport
  const sports = [...new Set(predictions?.map(p => p.sport).filter(Boolean))];
  const sportStats = sports.map(sport => {
    const sportPreds = predictions.filter(p => p.sport === sport);
    const correct = sportPreds.filter(p => p.was_correct).length;
    return {
      sport,
      total: sportPreds.length,
      correct,
      accuracy: sportPreds.length > 0 ? ((correct / sportPreds.length) * 100).toFixed(1) : 0
    };
  });

  // By confidence level
  const highConfidence = predictions?.filter(p => p.confidence_level === 'high') || [];
  const mediumConfidence = predictions?.filter(p => p.confidence_level === 'medium') || [];
  const lowConfidence = predictions?.filter(p => p.confidence_level === 'low') || [];

  const highAccuracy = highConfidence.length > 0 ? ((highConfidence.filter(p => p.was_correct).length / highConfidence.length) * 100).toFixed(1) : 0;
  const mediumAccuracy = mediumConfidence.length > 0 ? ((mediumConfidence.filter(p => p.was_correct).length / mediumConfidence.length) * 100).toFixed(1) : 0;
  const lowAccuracy = lowConfidence.length > 0 ? ((lowConfidence.filter(p => p.was_correct).length / lowConfidence.length) * 100).toFixed(1) : 0;

  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPredictions = predictions?.filter(p => new Date(p.prediction_date) > thirtyDaysAgo) || [];
  const recentCorrect = recentPredictions.filter(p => p.was_correct).length;
  const recentAccuracy = recentPredictions.length > 0 ? ((recentCorrect / recentPredictions.length) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto mb-6">
              <Target className="w-10 h-10" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4">Prediction Accuracy</h1>
            <p className="text-xl text-emerald-100">
              Track our AI's historical performance across all sports
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Auto Accuracy Tracker */}
        <AutoAccuracyTracker />

        {/* Manual Check Button with Cooldown */}
        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Manual Accuracy Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">
                Manually check one finished game at a time to update accuracy data. 
                <strong className="text-yellow-400"> Limited to once per hour</strong> to avoid rate limits.
                This process involves AI verification and takes about 15-20 seconds.
              </p>
              <Button
                onClick={runManualAccuracyCheck}
                disabled={isManualCheckRunning}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isManualCheckRunning ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Check One Game Now
                  </>
                )}
              </Button>
              {manualCheckMessage && (
                <Alert className="bg-blue-500/10 border-blue-500/30">
                  <AlertDescription className="text-blue-200">
                    {manualCheckMessage}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual Refresh Button */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Displayed Data
          </Button>
        </div>

        {/* System Status Alert */}
        {totalPredictions === 0 && (
          <Alert className="bg-yellow-500/10 border-2 border-yellow-500/50 mb-8">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              <strong>⚠️ Prediction Tracking Status:</strong> No predictions have been tracked yet. 
              The system automatically checks finished games every 6 hours and updates accuracy data.
              <div className="mt-4">
                <Button 
                  onClick={handleTestTracking}
                  disabled={testingTracking}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {testingTracking ? "Creating Test..." : "🧪 Create Test Prediction"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading accuracy data...</p>
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-black text-emerald-400 mb-2">{accuracyRate}%</div>
                  <div className="text-sm text-emerald-300">Overall Accuracy</div>
                  <div className="text-xs text-slate-400 mt-2">{correctPredictions}/{totalPredictions} correct</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-black text-blue-400 mb-2">{recentAccuracy}%</div>
                  <div className="text-sm text-blue-300">Last 30 Days</div>
                  <div className="text-xs text-slate-400 mt-2">{recentCorrect}/{recentPredictions.length} correct</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-black text-purple-400 mb-2">{highAccuracy}%</div>
                  <div className="text-sm text-purple-300">High Confidence</div>
                  <div className="text-xs text-slate-400 mt-2">{highConfidence.filter(p => p.was_correct).length}/{highConfidence.length} correct</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-black text-orange-400 mb-2">{totalPredictions}</div>
                  <div className="text-sm text-orange-300">Total Predictions</div>
                  <div className="text-xs text-slate-400 mt-2">All-time tracked</div>
                </CardContent>
              </Card>
            </div>

            {/* By Sport */}
            {sportStats.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                    Accuracy by Sport
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {sportStats.map((stat, idx) => (
                      <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-white">{stat.sport}</span>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            {stat.accuracy}%
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400">
                          {stat.correct}/{stat.total} correct predictions
                        </div>
                        <div className="mt-2 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all"
                            style={{ width: `${stat.accuracy}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* By Confidence Level */}
            <Card className="bg-slate-800/50 border-slate-700 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="w-6 h-6 text-purple-400" />
                  Accuracy by Confidence Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-6 border border-green-500/30">
                    <div className="text-center">
                      <div className="text-4xl font-black text-green-400 mb-2">{highAccuracy}%</div>
                      <div className="text-sm text-green-300 mb-1">High Confidence</div>
                      <div className="text-xs text-slate-400">{highConfidence.length} predictions</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-6 border border-blue-500/30">
                    <div className="text-center">
                      <div className="text-4xl font-black text-blue-400 mb-2">{mediumAccuracy}%</div>
                      <div className="text-sm text-blue-300 mb-1">Medium Confidence</div>
                      <div className="text-xs text-slate-400">{mediumConfidence.length} predictions</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-6 border border-yellow-500/30">
                    <div className="text-center">
                      <div className="text-4xl font-black text-yellow-400 mb-2">{lowAccuracy}%</div>
                      <div className="text-sm text-yellow-300 mb-1">Low Confidence</div>
                      <div className="text-xs text-slate-400">{lowConfidence.length} predictions</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Predictions List */}
            {predictions.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="w-6 h-6 text-blue-400" />
                    Recent Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictions.slice(0, 10).map((pred: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {pred.was_correct ? (
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-slate-300">
                              {pred.sport || pred.prediction_type}
                            </Badge>
                            <Badge className={
                              pred.confidence_level === 'high' ? 'bg-green-500/20 text-green-400' :
                              pred.confidence_level === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }>
                              {pred.confidence_level} confidence
                            </Badge>
                          </div>
                          <div className="text-white font-semibold">{pred.predicted_outcome}</div>
                          {pred.actual_outcome && (
                            <div className="text-sm text-slate-400 mt-1">
                              Actual: {pred.actual_outcome}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-2">
                            {new Date(pred.prediction_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Methodology */}
            <Card className="bg-blue-500/10 border-2 border-blue-500/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  How We Track Accuracy
                </h3>
                <p className="text-blue-200 text-sm leading-relaxed">
                  All predictions are logged with timestamps and confidence levels. After games conclude, 
                  we verify outcomes against official results from ESPN, StatMuse, and league sources. 
                  Our AI learns from these results to continuously improve prediction accuracy. Note: 
                  Historical accuracy does not guarantee future results.
                </p>
              </CardContent>
            </Card>

            {totalPredictions === 0 && (
              <Card className="bg-yellow-500/10 border-2 border-yellow-500/30 mt-8">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-yellow-300 mb-2">No Predictions Tracked Yet</h3>
                  <p className="text-yellow-200">
                    Start making predictions to see accuracy stats here. Our system will automatically 
                    track and verify results.
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
