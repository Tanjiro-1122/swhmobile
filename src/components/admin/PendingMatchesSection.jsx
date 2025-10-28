import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, Edit2, Save, X } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function PendingMatchesSection({ matches, onUpdateResult }) {
  const [editingId, setEditingId] = useState(null);
  const [winner, setWinner] = useState("");
  const [finalScore, setFinalScore] = useState("");

  // Filter matches that need updates (past date, not completed)
  const pendingMatches = matches.filter(match => {
    if (match.actual_result?.completed) return false;
    if (!match.match_date) return true; // Include matches without dates
    
    try {
      return new Date(match.match_date) < new Date();
    } catch {
      return true;
    }
  });

  const handleEdit = (match) => {
    setEditingId(match.id);
    setWinner(match.actual_result?.winner || "");
    setFinalScore(match.actual_result?.final_score || "");
  };

  const handleSave = (matchId) => {
    onUpdateResult(matchId, {
      winner,
      final_score: finalScore,
      completed: true
    });
    setEditingId(null);
    setWinner("");
    setFinalScore("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setWinner("");
    setFinalScore("");
  };

  if (pendingMatches.length === 0) {
    return (
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-900 mb-2">All Caught Up!</h3>
          <p className="text-green-700">No pending matches need result updates.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-yellow-300 bg-yellow-50">
      <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <CardTitle className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" />
          Pending Match Results ({pendingMatches.length})
        </CardTitle>
        <p className="text-yellow-100 text-sm mt-2">
          These matches have passed their game date and need result updates
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {pendingMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border-2 border-yellow-200 p-4"
            >
              {editingId === match.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {match.home_team} vs {match.away_team}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{match.sport}</Badge>
                        {match.match_date && (
                          <span className="text-sm text-gray-600">
                            {format(new Date(match.match_date), 'PPP')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Winner
                      </label>
                      <select
                        value={winner}
                        onChange={(e) => setWinner(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                      >
                        <option value="">Select winner...</option>
                        <option value={match.home_team}>{match.home_team}</option>
                        <option value={match.away_team}>{match.away_team}</option>
                        <option value="Draw">Draw</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Final Score
                      </label>
                      <Input
                        value={finalScore}
                        onChange={(e) => setFinalScore(e.target.value)}
                        placeholder="e.g., 115-108 or 3-2"
                        className="border-2 border-gray-300 focus:border-yellow-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSave(match.id)}
                      disabled={!winner || !finalScore}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Result
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="border-gray-300"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-lg mb-2">
                      {match.home_team} vs {match.away_team}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="outline">{match.sport}</Badge>
                      {match.league && <Badge variant="outline">{match.league}</Badge>}
                      {match.match_date && (
                        <Badge className="bg-yellow-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(match.match_date), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>

                    {match.prediction?.winner && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-blue-700 mb-1">AI Predicted Winner:</div>
                        <div className="font-semibold text-blue-900">{match.prediction.winner}</div>
                        {match.prediction.predicted_score && (
                          <div className="text-sm text-blue-700 mt-1">
                            Score: {match.prediction.predicted_score}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleEdit(match)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Update
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}