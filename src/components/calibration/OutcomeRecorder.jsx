import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Trophy, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OutcomeRecorder({ match }) {
  const [actualWinner, setActualWinner] = useState("");
  const [outcome, setOutcome] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const recordOutcomeMutation = useMutation({
    mutationFn: async (outcomeData) => {
      return await base44.entities.PredictionOutcome.create(outcomeData);
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['calibration'] });
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
      }, 2000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const wasCorrect = outcome === 'correct' || 
      (outcome === 'winner' && actualWinner === match.prediction?.winner);

    // Extract numeric confidence from prediction
    let numericConfidence = 50; // default
    const confidence = match.prediction?.confidence || 'Medium';
    if (confidence.toLowerCase().includes('high')) numericConfidence = 85;
    else if (confidence.toLowerCase().includes('low')) numericConfidence = 45;
    else numericConfidence = 65;

    const outcomeData = {
      prediction_id: match.id,
      prediction_type: 'match',
      predicted_winner: match.prediction?.winner || 'Unknown',
      predicted_confidence: confidence,
      predicted_confidence_numeric: numericConfidence,
      actual_winner: actualWinner || outcome,
      was_correct: wasCorrect,
      match_date: match.match_date,
      sport: match.sport,
      league: match.league,
      outcome_recorded_date: new Date().toISOString()
    };

    recordOutcomeMutation.mutate(outcomeData);
  };

  if (!showForm) {
    return (
      <Button
        onClick={() => setShowForm(true)}
        variant="outline"
        size="sm"
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Trophy className="w-4 h-4 mr-2" />
        Record Outcome
      </Button>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Record Match Outcome
        </CardTitle>
      </CardHeader>
      <CardContent>
        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              Outcome recorded successfully! This helps calibrate our AI.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Match Result</Label>
              <Select value={outcome} onValueChange={setOutcome} required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select outcome..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="correct">AI Prediction Was Correct ✅</SelectItem>
                  <SelectItem value="incorrect">AI Prediction Was Wrong ❌</SelectItem>
                  <SelectItem value="winner">Enter Actual Winner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {outcome === 'winner' && (
              <div>
                <Label className="text-xs font-semibold">Actual Winner</Label>
                <Input
                  value={actualWinner}
                  onChange={(e) => setActualWinner(e.target.value)}
                  placeholder="Enter winning team..."
                  className="mt-1"
                  required
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={recordOutcomeMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {recordOutcomeMutation.isPending ? 'Saving...' : 'Save Outcome'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>

            {recordOutcomeMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to record outcome. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}