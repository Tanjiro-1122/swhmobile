import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, DollarSign, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

export default function BettingCalculator() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#888", fontSize: 14, padding: "12px 16px 4px",
          fontWeight: 500
        }}
      >
        ← Back
      </button>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Betting Calculator</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Calculate potential payouts for single bets and parlays
          </p>
        </div>

        <Tabs defaultValue="single" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-14">
            <TabsTrigger value="single" className="text-lg">
              <DollarSign className="w-5 h-5 mr-2" />
              Single Bet
            </TabsTrigger>
            <TabsTrigger value="parlay" className="text-lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              Parlay
            </TabsTrigger>
          </TabsList>

          {/* Single Bet Calculator */}
          <TabsContent value="single">
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <CardTitle className="text-2xl">Single Bet Calculator</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stake Amount ($)
                    </label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                      className="h-14 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      American Odds
                    </label>
                    <Input
                      type="text"
                      placeholder="-110 or +150"
                      value={odds}
                      onChange={(e) => setOdds(e.target.value)}
                      className="h-14 text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
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
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Results</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Stake:</span>
                        <span className="text-2xl font-bold text-gray-900">
                          ${singleResult.stake}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Profit:</span>
                        <span className="text-2xl font-bold text-green-600">
                          +${singleResult.profit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t-2 border-green-200 pt-3">
                        <span className="text-gray-700 font-bold">Total Payout:</span>
                        <span className="text-3xl font-black text-green-600">
                          ${singleResult.payout}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">ROI:</span>
                        <Badge className="bg-green-600 text-white text-lg px-4 py-1">
                          {singleResult.roi}%
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Quick Reference */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-2">📚 Quick Reference:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>-110:</strong> Bet $110 to win $100 (most common)</li>
                    <li>• <strong>-200:</strong> Bet $200 to win $100 (heavy favorite)</li>
                    <li>• <strong>+150:</strong> Bet $100 to win $150 (underdog)</li>
                    <li>• <strong>+300:</strong> Bet $100 to win $300 (big underdog)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parlay Calculator */}
          <TabsContent value="parlay">
            <Card className="border-2 border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardTitle className="text-2xl">Parlay Calculator</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Stake Amount ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={parlayStake}
                    onChange={(e) => setParlayStake(e.target.value)}
                    className="h-14 text-lg"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900">Parlay Legs:</h4>
                  {parlayLegs.map((leg, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder={`Leg ${index + 1} Odds (e.g., -110)`}
                          value={leg.odds}
                          onChange={(e) => updateParlayLeg(index, e.target.value)}
                          className="h-12"
                        />
                      </div>
                      {parlayLegs.length > 1 && (
                        <Button
                          variant="outline"
                          onClick={() => removeParlayLeg(index)}
                          className="h-12 px-4 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addParlayLeg}
                    className="w-full h-12"
                  >
                    + Add Another Leg
                  </Button>
                </div>

                <Button
                  onClick={calculateParlay}
                  className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Calculate Parlay Payout
                </Button>

                {parlayResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Parlay Results</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Number of Legs:</span>
                        <Badge className="bg-indigo-600 text-white text-lg">
                          {parlayLegs.length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Combined Odds:</span>
                        <span className="text-xl font-bold text-indigo-600">
                          {parlayResult.combinedOdds}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Stake:</span>
                        <span className="text-2xl font-bold text-gray-900">
                          ${parlayResult.stake}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Profit:</span>
                        <span className="text-2xl font-bold text-purple-600">
                          +${parlayResult.profit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t-2 border-purple-200 pt-3">
                        <span className="text-gray-700 font-bold">Total Payout:</span>
                        <span className="text-3xl font-black text-purple-600">
                          ${parlayResult.payout}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">ROI:</span>
                        <Badge className="bg-purple-600 text-white text-lg px-4 py-1">
                          {parlayResult.roi}%
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ <strong>Remember:</strong> ALL legs must win for the parlay to pay out. 
                        Risk increases significantly with more legs.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Parlay Info */}
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <h4 className="font-bold text-gray-900 mb-2">💡 Parlay Tips:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>2-leg parlay:</strong> Both must win (~3:1 payout typical)</li>
                    <li>• <strong>3-leg parlay:</strong> All three must win (~6:1 payout)</li>
                    <li>• <strong>4-leg parlay:</strong> All four must win (~12:1 payout)</li>
                    <li>• Higher risk, higher reward - use responsibly!</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}