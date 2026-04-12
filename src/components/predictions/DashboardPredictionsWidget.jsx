import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Zap, AlertTriangle, ChevronRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function DashboardPredictionsWidget() {
  const [quickPrediction, setQuickPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto-generate a quick prediction on mount
    generateQuickPrediction();
  }, []);

  const generateQuickPrediction = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Date: ${today}
Generate ONE high-confidence game prediction for a major sporting event today.
Include: teams, predicted winner, confidence %, one key reason, and if it's an upset.
Be concise.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            matchup: { type: "string" },
            sport: { type: "string" },
            predicted_winner: { type: "string" },
            confidence: { type: "number" },
            key_reason: { type: "string" },
            is_upset: { type: "boolean" }
          }
        }
      });

      setQuickPrediction(result);
    } catch (error) {
      console.error("Quick prediction failed:", error);
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="overflow-hidden border-2 border-purple-300 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 shadow-xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Brain className="w-6 h-6" />
              <span className="font-black text-lg">AI PREDICTION</span>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              <Zap className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          </div>

          {/* Content */}
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-5 bg-white/20 rounded w-3/4" />
                <div className="h-4 bg-white/10 rounded w-1/2" />
                <div className="h-8 bg-white/20 rounded w-full" />
              </div>
            ) : quickPrediction ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500/30 text-purple-200 border-purple-400">
                    {quickPrediction.sport}
                  </Badge>
                  {quickPrediction.is_upset && (
                    <Badge className="bg-orange-500 text-white animate-pulse">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      UPSET
                    </Badge>
                  )}
                </div>

                <div className="text-white">
                  <div className="text-sm text-purple-200 mb-1">{quickPrediction.matchup}</div>
                  <div className="text-xl font-black flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    {quickPrediction.predicted_winner}
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${quickPrediction.confidence}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-200">Confidence</span>
                  <span className="text-green-400 font-bold">{quickPrediction.confidence}%</span>
                </div>

                <p className="text-sm text-purple-200">{quickPrediction.key_reason}</p>
              </div>
            ) : (
              <div className="text-center text-purple-200 py-4">
                <Brain className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Unable to load prediction</p>
              </div>
            )}

            {/* CTA */}
            <Link to={createPageUrl("AnalysisHub")}>
              <Button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold">
                View All Predictions
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}