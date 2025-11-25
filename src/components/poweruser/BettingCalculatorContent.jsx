import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, DollarSign, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function BettingCalculatorContent() {
  // Single Bet Calculator
  const [stake, setStake] = useState("");
  const [odds, setOdds] = useState("");
  const [singleResult, setSingleResult] = useState(null);

  // Parlay Calculator
  const [parlayStake, setParlayStake] = useState("");
  const [parlayLegs, setParlayLegs] = useState([{ odds: "" }]);
  const [parlayResult, setParlayResult] = useState(null);

  // American to Decimal odds converter
  const americanToDecimal = (american) => {
    const num = parseFloat(american);
    if (num >= 0) {
      return (num / 100) + 1;
    } else {
      return (100 / Math.abs(num)) + 1;
    }
  };

  // Calculate single bet
  const calculateSingle = () => {
    if (!stake || !odds) return;
    
    const stakeNum = parseFloat(stake);
    const oddsNum = parseFloat(odds);
    
    let payout, profit;
    
    if (oddsNum >= 0) {
      // Positive odds (underdog)
      profit = (stakeNum * oddsNum) / 100;
      payout = stakeNum + profit;
    } else {
      // Negative odds (favorite)
      profit = (stakeNum * 100) / Math.abs(oddsNum);
      payout = stakeNum + profit;
    }
    
    setSingleResult({
      stake: stakeNum,
      profit: profit.toFixed(2),
      payout: payout.toFixed(2),
      roi: ((profit / stakeNum) * 100).toFixed(1)
    });
  };

  // Calculate parlay
  const calculateParlay = () => {
    if (!parlayStake || parlayLegs.some(leg => !leg.odds)) return;
    
    const stakeNum = parseFloat(parlayStake);
    let combinedDecimal = 1;
    
    parlayLegs.forEach(leg => {
      const decimal = americanToDecimal(leg.odds);
      combinedDecimal *= decimal;
    });
    
    const payout = stakeNum * combinedDecimal;
    const profit = payout - stakeNum;
    
    // Convert back to American odds
    let americanOdds;
    if (combinedDecimal >= 2) {
      americanOdds = `+${Math.round((combinedDecimal - 1) * 100)}`;
    } else {
      americanOdds = `-${Math.round(100 / (combinedDecimal - 1))}`;
    }
    
    setParlayResult({
      stake: stakeNum,
      profit: profit.toFixed(2),
      payout: payout.toFixed(2),
      combinedOdds: americanOdds,
      roi: ((profit / stakeNum) * 100).toFixed(1)
    });
  };

  const addParlayLeg = () => {
    setParlayLegs([...parlayLegs, { odds: "" }]);
  };

  const removeParlayLeg = (index) => {
    const newLegs = parlayLegs.filter((_, i) => i !== index);
    setParlayLegs(newLegs);
  };

  const updateParlayLeg = (index, value) => {
    const newLegs = [...parlayLegs];
    newLegs[index].odds = value;
    setParlayLegs(newLegs);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-3xl font-black text-gray-900">Odds Calculator</CardTitle>
          <p className="text-gray-600">Calculate potential payouts for single selections and multi-picks</p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-white/80 backdrop-blur-sm border-2 border-blue-200">
          <TabsTrigger value="single" className="text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
            <DollarSign className="w-5 h-5 mr-2" />
            Single Selection
          </TabsTrigger>
          <TabsTrigger value="parlay" className="text-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <TrendingUp className="w-5 h-5 mr-2" />
            Multi-Pick
          </TabsTrigger>
        </TabsList>

        {/* Single Selection Calculator */}
        <TabsContent value="single">
          <Card className="border-2 border-blue-200 bg-white">
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Stake Amount ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    className="h-14 text-lg border-2 border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    American Odds
                  </label>
                  <Input
                    type="text"
                    placeholder="-110 or +150"
                    value={odds}
                    onChange={(e) => setOdds(e.target.value)}
                    className="h-14 text-lg border-2 border-gray-300 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Enter - for favorites, + for underdogs
                  </p>
                </div>
              </div>

              <Button
                onClick={calculateSingle}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Zap className="w-5 h-5 mr-2" />
                Calculate Payout
              </Button>

              {singleResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Results</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-semibold">Stake:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${singleResult.stake}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-semibold">Profit:</span>
                      <span className="text-2xl font-bold text-green-600">
                        +${singleResult.profit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-green-200 pt-3">
                      <span className="text-gray-800 font-bold">Total Payout:</span>
                      <span className="text-3xl font-black text-green-600">
                        ${singleResult.payout}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-semibold">ROI:</span>
                      <Badge className="bg-green-600 text-white text-lg px-4 py-1">
                        {singleResult.roi}%
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Reference */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h4 className="font-bold text-gray-900 mb-2">📚 Quick Reference:</h4>
                <ul className="text-sm text-gray-800 space-y-1">
                  <li>• <strong>-110:</strong> Bet $110 to win $100 (most common)</li>
                  <li>• <strong>-200:</strong> Bet $200 to win $100 (heavy favorite)</li>
                  <li>• <strong>+150:</strong> Bet $100 to win $150 (underdog)</li>
                  <li>• <strong>+300:</strong> Bet $100 to win $300 (big underdog)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Pick Calculator */}
        <TabsContent value="parlay">
          <Card className="border-2 border-indigo-200 bg-white">
            <CardContent className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Total Stake Amount ($)
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  value={parlayStake}
                  onChange={(e) => setParlayStake(e.target.value)}
                  className="h-14 text-lg border-2 border-gray-300 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-lg">Multi-Pick Selections:</h4>
                {parlayLegs.map((leg, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder={`Pick ${index + 1} Odds (e.g., -110)`}
                        value={leg.odds}
                        onChange={(e) => updateParlayLeg(index, e.target.value)}
                        className="h-12 border-2 border-gray-300"
                      />
                    </div>
                    {parlayLegs.length > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => removeParlayLeg(index)}
                        className="h-12 px-4 border-2 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addParlayLeg}
                  className="w-full h-12 border-2 border-indigo-300 hover:bg-indigo-50"
                >
                  + Add Another Pick
                </Button>
              </div>

              <Button
                onClick={calculateParlay}
                className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Zap className="w-5 h-5 mr-2" />
                Calculate Multi-Pick Payout
                </Button>

              {parlayResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Multi-Pick Results</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-semibold">Number of Picks:</span>
                      <Badge className="bg-indigo-600 text-white text-lg px-4 py-1">
                        {parlayLegs.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-semibold">Combined Odds:</span>
                      <span className="text-xl font-bold text-indigo-600">
                        {parlayResult.combinedOdds}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-semibold">Stake:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${parlayResult.stake}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-semibold">Profit:</span>
                      <span className="text-2xl font-bold text-purple-600">
                        +${parlayResult.profit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-purple-200 pt-3">
                      <span className="text-gray-800 font-bold">Total Payout:</span>
                      <span className="text-3xl font-black text-purple-600">
                        ${parlayResult.payout}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-semibold">ROI:</span>
                      <Badge className="bg-purple-600 text-white text-lg px-4 py-1">
                        {parlayResult.roi}%
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-900 font-semibold">
                      ⚠️ <strong>Remember:</strong> ALL picks must be correct for the multi-pick to pay out. 
                      Risk increases significantly with more picks.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Multi-Pick Info */}
              <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                <h4 className="font-bold text-gray-900 mb-2">💡 Multi-Pick Tips:</h4>
                <ul className="text-sm text-gray-800 space-y-1">
                  <li>• <strong>2-pick combo:</strong> Both must be correct (~3:1 payout typical)</li>
                  <li>• <strong>3-pick combo:</strong> All three must be correct (~6:1 payout)</li>
                  <li>• <strong>4-pick combo:</strong> All four must be correct (~12:1 payout)</li>
                  <li>• Higher risk, higher reward - analyze carefully!</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}