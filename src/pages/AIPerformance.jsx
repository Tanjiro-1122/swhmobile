import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, BarChart3, Trophy, AlertCircle, CheckCircle2, Activity } from "lucide-react";
import RequireAuth from "../components/auth/RequireAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

function AIPerformanceContent() {
  const { data: calibrationData, isLoading, error, refetch } = useQuery({
    queryKey: ['calibration'],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateCalibration', {});
      return response.data;
    },
  });

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'Excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 70) return 'text-green-600';
    if (accuracy >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Activity className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load calibration data: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const hasData = calibrationData && calibrationData.total_predictions > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">AI Performance & Calibration</h1>
              <p className="text-gray-600 text-lg">Track how accurate our AI predictions really are</p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {!hasData && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Getting Started:</strong> We need actual match outcomes to calculate calibration. 
                After matches you've analyzed are completed, manually record the outcomes to build calibration data.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {hasData ? (
          <>
            {/* Overview Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-600">Total Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-gray-900">
                    {calibrationData.total_predictions}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-600">Overall Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-black ${getAccuracyColor(calibrationData.overall_accuracy)}`}>
                    {calibrationData.overall_accuracy}%
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-600">Calibration Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={`text-lg font-bold ${getQualityColor(calibrationData.calibration_quality)}`}>
                    {calibrationData.calibration_quality}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-600">Last Updated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700">
                    {new Date(calibrationData.last_updated).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calibration Bins */}
            <Card className="mb-8 border-2 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-blue-600" />
                  <CardTitle className="text-xl">Confidence Calibration Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-6">
                  This shows how well the AI's stated confidence matches actual accuracy. 
                  A well-calibrated model should have accuracy close to its confidence level.
                </p>

                <div className="space-y-4">
                  {calibrationData.calibration_bins.map((bin, idx) => {
                    const isWellCalibrated = Math.abs(
                      parseFloat(bin.predicted_confidence_range.match(/\d+/g)[0]) + 
                      parseFloat(bin.predicted_confidence_range.match(/\d+/g)[1])) / 2 - 
                      bin.actual_accuracy
                    ) < 15;

                    return (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-bold text-gray-900">{bin.bin}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              ({bin.total_predictions} predictions)
                            </span>
                          </div>
                          {isWellCalibrated ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="text-sm text-gray-600 mb-1">Actual Accuracy</div>
                            <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full flex items-center justify-end px-3 text-white font-bold text-sm ${
                                  bin.actual_accuracy >= 70 ? 'bg-green-500' :
                                  bin.actual_accuracy >= 55 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${bin.actual_accuracy}%` }}
                              >
                                {bin.actual_accuracy}%
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-green-600">
                              {bin.correct_predictions}
                            </div>
                            <div className="text-xs text-gray-600">correct</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* By Confidence Label */}
            {calibrationData.by_confidence && calibrationData.by_confidence.length > 0 && (
              <Card className="mb-8 border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    <CardTitle className="text-xl">Performance by Confidence Level</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    {calibrationData.by_confidence.map((conf, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-lg font-bold text-gray-900 mb-2">{conf.confidence} Confidence</div>
                        <div className={`text-3xl font-black ${getAccuracyColor(conf.accuracy)} mb-2`}>
                          {conf.accuracy}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {conf.correct} / {conf.total} predictions correct
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* By Sport */}
            {calibrationData.by_sport && calibrationData.by_sport.length > 0 && (
              <Card className="border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-green-600" />
                    <CardTitle className="text-xl">Performance by Sport</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {calibrationData.by_sport.map((sport, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <span className="font-bold text-gray-900">{sport.sport}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({sport.total} predictions)
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl font-black ${getAccuracyColor(sport.accuracy)}`}>
                            {sport.accuracy}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {sport.correct} / {sport.total}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Calibration Data Yet</h3>
              <p className="text-gray-600 mb-6">
                Start analyzing matches and recording actual outcomes to build calibration data!
              </p>
              <Button onClick={() => window.location.href = '/Dashboard'}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function AIPerformance() {
  return (
    <RequireAuth pageName="AI Performance">
      <AIPerformanceContent />
    </RequireAuth>
  );
}