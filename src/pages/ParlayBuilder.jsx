import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Plus, Trash2, DollarSign, Zap, Trophy, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function ParlayBuilder() {
  const [parlayLegs, setParlayLegs] = useState([]);
  const [stake, setStake] = useState("");
  const [parlayName, setParlayName] = useState("");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const { data: savedParlays, isLoading } = useQuery({
    queryKey: ['parlays', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Parlay.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const saveParlayMutation = useMutation({
    mutationFn: (parlayData) => base44.entities.Parlay.create(parlayData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parlays'] });
      setParlayLegs([]);
      setStake("");
      setParlayName("");
    },
  });

  const deleteParlayMutation = useMutation({
    mutationFn: (id) => base44.entities.Parlay.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parlays'] });
    },
  });

  const addLeg = () => {
    setParlayLegs([...parlayLegs, { match_description: "", pick: "", odds: "", sport: "" }]);
  };

  const removeLeg = (index) => {
    setParlayLegs(parlayLegs.filter((_, i) => i !== index));
  };

  const updateLeg = (index, field, value) => {
    const newLegs = [...parlayLegs];
    newLegs[index][field] = value;
    setParlayLegs(newLegs);
  };

  // Calculate combined odds
  const calculateCombinedOdds = () => {
    if (parlayLegs.length === 0 || parlayLegs.some(leg => !leg.odds)) return null;

    let combinedDecimal = 1;
    parlayLegs.forEach(leg => {
      const odds = parseFloat(leg.odds);
      if (odds >= 0) {
        combinedDecimal *= (odds / 100) + 1;
      } else {
        combinedDecimal *= (100 / Math.abs(odds)) + 1;
      }
    });

    const stakeNum = parseFloat(stake) || 0;
    const payout = stakeNum * combinedDecimal;
    const profit = payout - stakeNum;

    let americanOdds;
    if (combinedDecimal >= 2) {
      americanOdds = `+${Math.round((combinedDecimal - 1) * 100)}`;
    } else {
      americanOdds = `-${Math.round(100 / (combinedDecimal - 1))}`;
    }

    return {
      americanOdds,
      payout: payout.toFixed(2),
      profit: profit.toFixed(2)
    };
  };

  const odds = calculateCombinedOdds();

  const handleSaveParlay = () => {
    if (!parlayName || parlayLegs.length < 2 || !stake) return;

    saveParlayMutation.mutate({
      parlay_name: parlayName,
      legs: parlayLegs,
      total_odds: odds.americanOdds,
      stake_amount: parseFloat(stake),
      potential_payout: parseFloat(odds.payout),
      legs_total: parlayLegs.length
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Sign in to build and save your parlays
            </p>
            <Button
              onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Parlay Builder</h1>
              <p className="text-gray-600">Build and track your multi-leg bets</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Parlay Builder */}
          <div>
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <CardTitle className="text-2xl">Build Your Parlay</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parlay Name
                  </label>
                  <Input
                    placeholder="e.g., Saturday NBA 3-Leg"
                    value={parlayName}
                    onChange={(e) => setParlayName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Parlay Legs ({parlayLegs.length})</h3>
                    <Button onClick={addLeg} size="sm" className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Leg
                    </Button>
                  </div>

                  <AnimatePresence>
                    {parlayLegs.map((leg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Card className="border border-purple-200 bg-purple-50/50">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-purple-600 text-white">Leg {index + 1}</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLeg(index)}
                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <Input
                              placeholder="Match (e.g., Lakers vs Celtics)"
                              value={leg.match_description}
                              onChange={(e) => updateLeg(index, 'match_description', e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="Pick (e.g., Lakers -5.5)"
                                value={leg.pick}
                                onChange={(e) => updateLeg(index, 'pick', e.target.value)}
                              />
                              <Input
                                placeholder="Odds (e.g., -110)"
                                value={leg.odds}
                                onChange={(e) => updateLeg(index, 'odds', e.target.value)}
                              />
                            </div>
                            <Input
                              placeholder="Sport (e.g., NBA)"
                              value={leg.sport}
                              onChange={(e) => updateLeg(index, 'sport', e.target.value)}
                            />
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {parlayLegs.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600">Add at least 2 legs to build your parlay</p>
                    </div>
                  )}
                </div>

                {parlayLegs.length >= 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Stake Amount ($)
                      </label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={stake}
                        onChange={(e) => setStake(e.target.value)}
                        className="h-12 text-lg"
                      />
                    </div>

                    {odds && stake && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300"
                      >
                        <h3 className="font-bold text-gray-900 mb-4">Parlay Summary</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Combined Odds:</span>
                            <span className="text-xl font-bold text-purple-600">{odds.americanOdds}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Stake:</span>
                            <span className="text-xl font-bold">${stake}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Profit if Win:</span>
                            <span className="text-xl font-bold text-green-600">+${odds.profit}</span>
                          </div>
                          <div className="flex justify-between border-t-2 border-purple-200 pt-3">
                            <span className="font-bold text-gray-900">Total Payout:</span>
                            <span className="text-2xl font-black text-purple-600">${odds.payout}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <Button
                      onClick={handleSaveParlay}
                      disabled={!parlayName || parlayLegs.length < 2 || !stake}
                      className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Save Parlay
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Saved Parlays */}
          <div>
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl">Saved Parlays</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
                  </div>
                ) : savedParlays.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No saved parlays yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedParlays.map((parlay, index) => (
                      <motion.div
                        key={parlay.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border hover:border-purple-300 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                  {parlay.parlay_name}
                                </h3>
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge className="bg-purple-600 text-white">
                                    {parlay.legs_total} Legs
                                  </Badge>
                                  <Badge variant="outline">{parlay.total_odds}</Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteParlayMutation.mutate(parlay.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>

                            <div className="space-y-2 mb-4">
                              {parlay.legs?.map((leg, idx) => (
                                <div key={idx} className="text-sm bg-gray-50 rounded p-2">
                                  <div className="font-semibold text-gray-900">{leg.match_description}</div>
                                  <div className="text-gray-600">{leg.pick} ({leg.odds})</div>
                                </div>
                              ))}
                            </div>

                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-sm text-gray-600">Stake: ${parlay.stake_amount}</div>
                                  <div className="text-2xl font-bold text-purple-600">
                                    ${parlay.potential_payout?.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-600">potential payout</div>
                                </div>
                                {parlay.result === 'pending' && (
                                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                                )}
                                {parlay.result === 'won' && (
                                  <Badge className="bg-green-100 text-green-800">Won</Badge>
                                )}
                                {parlay.result === 'lost' && (
                                  <Badge className="bg-red-100 text-red-800">Lost</Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}