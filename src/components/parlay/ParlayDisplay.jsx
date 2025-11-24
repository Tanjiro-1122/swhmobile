import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingUp, AlertTriangle, Save, DollarSign, Target, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function ParlayDisplay({ parlay, onSave }) {
  const getConfidenceColor = (confidence) => {
    const colors = {
      'High': 'bg-green-100 text-green-800 border-green-300',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Low': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[confidence] || colors['Medium'];
  };

  const getRiskColor = (risk) => {
    const colors = {
      'conservative': 'from-green-500 to-emerald-600',
      'balanced': 'from-blue-500 to-indigo-600',
      'aggressive': 'from-orange-500 to-red-600'
    };
    return colors[risk] || colors['balanced'];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-2 border-gray-200 shadow-xl">
        <CardHeader className={`bg-gradient-to-r ${getRiskColor(parlay.risk_level)} text-white border-b-2 border-white/20`}>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-black mb-2">
                {parlay.parlay_name}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/20 text-white border-white/40 font-bold">
                  {parlay.sport}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/40 font-bold capitalize">
                  {parlay.risk_level} Risk
                </Badge>
                <Badge className={`${getConfidenceColor(parlay.confidence)} border-2 font-bold`}>
                  {parlay.confidence} Confidence
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black mb-1">{parlay.total_odds}</div>
              <div className="text-sm opacity-90">Total Odds</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Payout Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                <DollarSign className="w-4 h-4" />
                Stake
              </div>
              <div className="text-2xl font-black text-gray-900">
                ${parlay.stake_amount}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                <TrendingUp className="w-4 h-4" />
                Potential Payout
              </div>
              <div className="text-2xl font-black text-gray-900">
                ${parlay.potential_payout?.toFixed(2)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                <Target className="w-4 h-4" />
                Potential Profit
              </div>
              <div className="text-2xl font-black text-gray-900">
                ${parlay.potential_profit?.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Overall Reasoning */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              Strategy
            </h3>
            <p className="text-gray-700 leading-relaxed">{parlay.reasoning}</p>
          </div>

          {/* Parlay Legs */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Parlay Legs ({parlay.legs?.length || 0})
            </h3>
            <div className="space-y-3">
              {parlay.legs?.map((leg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-purple-600 text-white font-bold">
                          Leg {index + 1}
                        </Badge>
                        {leg.game_time && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {leg.game_time}
                          </Badge>
                        )}
                      </div>
                      <div className="font-bold text-gray-900 text-lg mb-1">
                        {leg.match_description}
                      </div>
                      <div className="text-blue-600 font-bold text-base">
                        Pick: {leg.pick}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800 border-green-300 font-bold text-base px-3 py-1">
                        {leg.odds}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                    <strong>Reasoning:</strong> {leg.reasoning}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          {parlay.risk_factors && parlay.risk_factors.length > 0 && (
            <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Risk Factors to Consider
              </h3>
              <ul className="space-y-2">
                {parlay.risk_factors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Sources */}
          {parlay.data_sources && (
            <div className="text-xs text-gray-500 border-t-2 border-gray-200 pt-4">
              <p><strong>Data Sources:</strong> {parlay.data_sources.stats_source}</p>
              <p><strong>Last Updated:</strong> {new Date(parlay.data_sources.last_updated).toLocaleString()}</p>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={onSave}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold min-h-[56px] text-base rounded-[16px]"
          >
            <Save className="w-5 h-5 mr-2" />
            Save This Parlay
          </Button>

          {/* Disclaimer */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <p className="text-xs text-gray-700">
              <strong className="text-gray-900">⚠️ Important:</strong> This is AI-generated analysis for educational purposes only. Always do your own research and gamble responsibly. Past performance does not guarantee future results.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}