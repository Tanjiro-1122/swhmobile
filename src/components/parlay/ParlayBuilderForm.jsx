import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, DollarSign, Target } from "lucide-react";

export default function ParlayBuilderForm({ onGenerate, isGenerating }) {
  const [sport, setSport] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [stakeAmount, setStakeAmount] = useState(50);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sport && riskLevel) {
      onGenerate({ sport, risk_level: riskLevel, stake_amount: stakeAmount });
    }
  };

  const sports = [
    "NBA",
    "NFL", 
    "MLB",
    "NHL",
    "Premier League",
    "La Liga",
    "Champions League",
    "College Basketball",
    "College Football"
  ];

  const riskLevels = [
    { value: "conservative", label: "Conservative", desc: "2-3 legs, safer picks, +150 to +250 odds", color: "from-green-500 to-emerald-600" },
    { value: "balanced", label: "Balanced", desc: "3-4 legs, moderate risk, +250 to +500 odds", color: "from-blue-500 to-indigo-600" },
    { value: "aggressive", label: "Aggressive", desc: "4-6 legs, high risk/reward, +500 to +1500 odds", color: "from-orange-500 to-red-600" }
  ];

  return (
    <Card className="border-2 border-gray-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-gray-200">
        <CardTitle className="text-2xl font-black flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          Build Your Parlay
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sport Selection */}
          <div>
            <label className="text-sm font-bold text-gray-900 mb-2 block">
              Select Sport
            </label>
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger className="min-h-[56px] text-base border-2 rounded-[16px]">
                <SelectValue placeholder="Choose a sport..." />
              </SelectTrigger>
              <SelectContent>
                {sports.map((s) => (
                  <SelectItem key={s} value={s} className="text-base py-3">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Risk Level Selection */}
          <div>
            <label className="text-sm font-bold text-gray-900 mb-3 block">
              Risk Level
            </label>
            <div className="grid gap-3">
              {riskLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setRiskLevel(level.value)}
                  className={`p-4 rounded-[16px] border-2 transition-all text-left min-h-[44px] ${
                    riskLevel === level.value
                      ? `bg-gradient-to-r ${level.color} text-white border-transparent shadow-lg`
                      : 'bg-white border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="font-bold text-base mb-1">{level.label}</div>
                  <div className={`text-sm ${riskLevel === level.value ? 'text-white/90' : 'text-gray-600'}`}>
                    {level.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stake Amount */}
          <div>
            <label className="text-sm font-bold text-gray-900 mb-2 block flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Stake Amount
            </label>
            <Input
              type="number"
              min="1"
              max="10000"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(Number(e.target.value))}
              className="min-h-[56px] text-base border-2 rounded-[16px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is for simulation only - no real money is wagered
            </p>
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            disabled={!sport || !riskLevel || isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold min-h-[56px] text-base disabled:opacity-50 rounded-[16px]"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Analyzing Games...
              </div>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2" />
                Generate AI Parlay
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong className="text-blue-900">💡 How it works:</strong> Our AI analyzes today's games using live data from StatMuse and ESPN, then builds a parlay based on your risk tolerance and selected sport.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}