import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, BarChart3, Trophy, AlertCircle, CheckCircle2, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AIPerformanceContent() {
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
      <div className="flex items-center justify-center py-20">
        <Activity className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load calibration data: {error.message}</AlertDescription>
      </Alert>
    );
  }

  const hasData = calibrationData && calibrationData.total_predictions > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">Track how accurate our AI predictions really are</p>
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
            After matches are completed, record the outcomes to build calibration data.
          </AlertDescription>
        </Alert>
      )}

      {hasData ? (
        <>
          {/* Overview Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border-2 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600">Total Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gray-900">{calibrationData.total_predictions}</div>
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

          {/* Performance by Sport */}
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
                        <span className="text-sm text-gray-600 ml-2">({sport.total} predictions)</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-black ${getAccuracyColor(sport.accuracy)}`}>
                          {sport.accuracy}%
                        </div>
                        <div className="text-sm text-gray-600">{sport.correct} / {sport.total}</div>
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
              Start analyzing matches and recording outcomes to build calibration data!
            </p>
            <Button onClick={() => window.location.href = '/Dashboard'}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}