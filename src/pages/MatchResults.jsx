import React, { useState, useMemo } from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle, XCircle, Trophy, Filter, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { format, parseISO, isValid, startOfDay, endOfDay, subDays } from "date-fns";

function MatchResultsContent() {
  const [selectedDate, setSelectedDate] = useState("today");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allMatches, isLoading } = useQuery({
    queryKey: ['allMatches'],
    queryFn: () => base44.entities.Match.list('-match_date', 1000),
    initialData: [],
  });

  // Check if current user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Access Denied. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filter completed matches
  const completedMatches = allMatches.filter(m => m.actual_result?.completed);

  // Get unique dates from matches
  const availableDates = useMemo(() => {
    const dates = new Set();
    completedMatches.forEach(match => {
      if (match.match_date) {
        try {
          const date = parseISO(match.match_date);
          if (isValid(date)) {
            dates.add(format(startOfDay(date), 'yyyy-MM-dd'));
          }
        } catch (e) {
          console.error('Invalid date:', match.match_date);
        }
      }
    });
    return Array.from(dates).sort((a, b) => new Date(b) - new Date(a));
  }, [completedMatches]);

  // Filter matches by selected date
  const filteredMatches = useMemo(() => {
    if (selectedDate === "all") {
      return completedMatches;
    }

    let targetDate;
    if (selectedDate === "today") {
      targetDate = new Date();
    } else if (selectedDate === "yesterday") {
      targetDate = subDays(new Date(), 1);
    } else if (selectedDate === "last7days") {
      const sevenDaysAgo = subDays(new Date(), 7);
      return completedMatches.filter(match => {
        if (!match.match_date) return false;
        try {
          const matchDate = parseISO(match.match_date);
          return isValid(matchDate) && matchDate >= sevenDaysAgo;
        } catch {
          return false;
        }
      });
    } else {
      // Specific date selected
      targetDate = parseISO(selectedDate);
    }

    if (!targetDate || !isValid(targetDate)) return [];

    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    return completedMatches.filter(match => {
      if (!match.match_date) return false;
      try {
        const matchDate = parseISO(match.match_date);
        return isValid(matchDate) && matchDate >= startDate && matchDate <= endDate;
      } catch {
        return false;
      }
    });
  }, [completedMatches, selectedDate]);

  // Calculate stats for filtered matches
  const correctPredictions = filteredMatches.filter(
    m => m.prediction?.winner === m.actual_result?.winner
  ).length;
  const totalMatches = filteredMatches.length;
  const accuracy = totalMatches > 0 ? ((correctPredictions / totalMatches) * 100).toFixed(1) : 0;

  // Group matches by sport
  const matchesBySport = useMemo(() => {
    const grouped = {};
    filteredMatches.forEach(match => {
      const sport = match.sport || "Unknown";
      if (!grouped[sport]) {
        grouped[sport] = [];
      }
      grouped[sport].push(match);
    });
    return grouped;
  }, [filteredMatches]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Match Results</h1>
              <p className="text-slate-400">View completed matches and AI prediction accuracy</p>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="text-slate-300 font-semibold">Filter by Date:</span>
              </div>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-64 bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="today" className="text-white">Today</SelectItem>
                  <SelectItem value="yesterday" className="text-white">Yesterday</SelectItem>
                  <SelectItem value="last7days" className="text-white">Last 7 Days</SelectItem>
                  <SelectItem value="all" className="text-white">All Time</SelectItem>
                  {availableDates.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-t border-slate-700 mt-2">
                        Specific Dates
                      </div>
                      {availableDates.map(date => (
                        <SelectItem key={date} value={date} className="text-white">
                          {format(parseISO(date), 'MMMM d, yyyy')}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <div className="ml-auto">
                <Badge className="bg-slate-700 text-white text-lg px-4 py-2">
                  {totalMatches} {totalMatches === 1 ? 'Match' : 'Matches'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  AI Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-white mb-2">
                  {accuracy}%
                </div>
                <p className="text-blue-100 text-sm">
                  {correctPredictions} / {totalMatches} correct
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Correct Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-white mb-2">
                  {correctPredictions}
                </div>
                <p className="text-green-100 text-sm">
                  Accurate predictions
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-red-500 to-rose-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Incorrect Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-white mb-2">
                  {totalMatches - correctPredictions}
                </div>
                <p className="text-red-100 text-sm">
                  Missed predictions
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Matches List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="text-slate-400 mt-4">Loading matches...</p>
          </div>
        ) : totalMatches === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-16 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-bold text-white mb-2">No Completed Matches</h3>
              <p className="text-slate-400">
                {selectedDate === "today" ? "No matches completed today" : 
                 selectedDate === "yesterday" ? "No matches completed yesterday" :
                 selectedDate === "last7days" ? "No matches completed in the last 7 days" :
                 "No matches found for the selected date"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.keys(matchesBySport).sort().map((sport, sportIndex) => (
              <div key={sport}>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">{sport}</h2>
                  <Badge className="bg-slate-700 text-white">
                    {matchesBySport[sport].length} {matchesBySport[sport].length === 1 ? 'match' : 'matches'}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {matchesBySport[sport].map((match, index) => {
                    const wasCorrect = match.prediction?.winner === match.actual_result?.winner;
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (sportIndex * 0.1) + (index * 0.05) }}
                      >
                        <Card className={`bg-slate-800/50 border-2 ${wasCorrect ? 'border-green-500/50' : 'border-red-500/50'} hover:shadow-xl transition-all`}>
                          <CardHeader className={`${wasCorrect ? 'bg-green-500/10' : 'bg-red-500/10'} border-b border-slate-700`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{match.sport}</Badge>
                                {match.league && <Badge variant="outline" className="text-slate-400 border-slate-600">{match.league}</Badge>}
                              </div>
                              {wasCorrect ? (
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Correct
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 border-red-300">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Incorrect
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-5">
                            <div className="mb-4">
                              <div className="text-xl font-bold text-white mb-2">
                                {match.home_team} vs {match.away_team}
                              </div>
                              {match.match_date && (
                                <div className="text-sm text-slate-400 flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {format(parseISO(match.match_date), 'MMMM d, yyyy • h:mm a')}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className={`p-3 rounded-lg ${wasCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-700/50 border border-slate-600'}`}>
                                <div className="text-xs text-slate-400 mb-1">AI Predicted</div>
                                <div className="text-lg font-bold text-white mb-1">
                                  {match.prediction?.winner}
                                </div>
                                {match.prediction?.predicted_score && (
                                  <div className="text-sm text-slate-400">
                                    Score: {match.prediction.predicted_score}
                                  </div>
                                )}
                                {match.prediction?.confidence && (
                                  <Badge className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/30">
                                    {match.prediction.confidence} Confidence
                                  </Badge>
                                )}
                              </div>

                              <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                                <div className="text-xs text-slate-400 mb-1">Actual Winner</div>
                                <div className="text-lg font-bold text-white mb-1">
                                  {match.actual_result?.winner}
                                </div>
                                {match.actual_result?.final_score && (
                                  <div className="text-sm text-slate-400">
                                    Score: {match.actual_result.final_score}
                                  </div>
                                )}
                              </div>
                            </div>

                            {match.prediction?.reasoning && (
                              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-3">
                                <div className="text-xs text-slate-400 mb-1">AI Reasoning</div>
                                <div className="text-sm text-slate-300 leading-relaxed">
                                  {match.prediction.reasoning}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchResults() {
  return (
    <RequireAuth pageName="Match Results">
      <MatchResultsContent />
    </RequireAuth>
  );
}