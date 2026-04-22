
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import RequireAuth from "../components/auth/RequireAuth";
import { useNavigate } from 'react-router-dom';

function ParlayBuilderContent() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentParlay, setCurrentParlay] = useState({
    parlay_name: "",
    legs: [{ match_description: "", pick: "", odds: "", sport: "" }],
    stake_amount: ""
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: parlays, isLoading } = useQuery({
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

  const createParlayMutation = useMutation({
    mutationFn: (parlayData) => base44.entities.Parlay.create(parlayData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parlays'] });
      setDialogOpen(false);
      setCurrentParlay({
        parlay_name: "",
        legs: [{ match_description: "", pick: "", odds: "", sport: "" }],
        stake_amount: ""
      });
    },
  });

  const updateParlayMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Parlay.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parlays'] });
    },
  });

  const addLeg = () => {
    setCurrentParlay({
      ...currentParlay,
      legs: [...currentParlay.legs, { match_description: "", pick: "", odds: "", sport: "" }]
    });
  };

  const removeLeg = (index) => {
    const newLegs = currentParlay.legs.filter((_, i) => i !== index);
    setCurrentParlay({
      ...currentParlay,
      legs: newLegs.length > 0 ? newLegs : [{ match_description: "", pick: "", odds: "", sport: "" }]
    });
  };

  const updateLeg = (index, field, value) => {
    const newLegs = [...currentParlay.legs];
    newLegs[index][field] = value;
    setCurrentParlay({
      ...currentParlay,
      legs: newLegs
    });
  };

  const calculateParlayOdds = (legs) => {
    let combinedDecimal = 1;
    
    legs.forEach(leg => {
      if (!leg.odds) return;
      const num = parseFloat(leg.odds);
      // Convert American odds to decimal odds
      // Positive odds (e.g., +150) => 1 + (odds / 100)
      // Negative odds (e.g., -110) => 1 + (100 / |odds|)
      const decimal = num >= 0 ? (num / 100) + 1 : (100 / Math.abs(num)) + 1;
      combinedDecimal *= decimal;
    });
    
    // Convert combined decimal odds back to American odds
    if (combinedDecimal >= 2) { // Positive American odds
      return `+${Math.round((combinedDecimal - 1) * 100)}`;
    } else { // Negative American odds
      return `-${Math.round(100 / (combinedDecimal - 1))}`;
    }
  };

  const calculatePayout = (stake, odds) => {
    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0) return 0;

    // Remove any sign for parsing, then convert to number
    const oddsStr = String(odds).replace('+', '');
    const oddsNum = parseFloat(oddsStr);

    if (isNaN(oddsNum)) return 0;
    
    if (oddsNum >= 0) { // Positive odds (+150)
      return stakeNum + (stakeNum * oddsNum) / 100;
    } else { // Negative odds (-110)
      return stakeNum + (stakeNum * 100) / Math.abs(oddsNum);
    }
  };

  const handleSaveParlay = () => {
    const validLegs = currentParlay.legs.filter(leg => 
      leg.match_description && leg.pick && leg.odds
    );

    if (validLegs.length < 2) {
      alert('Parlay needs at least 2 legs!');
      return;
    }

    if (!currentParlay.parlay_name || !currentParlay.stake_amount) {
      alert('Please fill in parlay name and stake amount!');
      return;
    }

    const totalOdds = calculateParlayOdds(validLegs);
    const potentialPayout = calculatePayout(currentParlay.stake_amount, totalOdds);

    createParlayMutation.mutate({
      parlay_name: currentParlay.parlay_name,
      legs: validLegs,
      total_odds: totalOdds,
      stake_amount: parseFloat(currentParlay.stake_amount),
      potential_payout: potentialPayout,
      legs_total: validLegs.length,
      created_by: currentUser?.email, // Ensure created_by is set
      result: 'pending', // Initialize result
      legs_won: 0, // Initialize legs_won
    });
  };

  const markLegResult = (parlay, legIndex, won) => {
    const newLegs = [...parlay.legs];
    newLegs[legIndex].result = won ? 'won' : 'lost';
    
    const legsWon = newLegs.filter(leg => leg.result === 'won').length;
    const allResolved = newLegs.every(leg => leg.result);
    
    let parlayResult = 'pending';
    if (newLegs.some(leg => leg.result === 'lost')) {
      parlayResult = 'lost';
    } else if (allResolved && legsWon === parlay.legs_total) {
      parlayResult = 'won';
    }

    updateParlayMutation.mutate({
      id: parlay.id,
      data: {
        legs: newLegs,
        legs_won: legsWon,
        result: parlayResult
      }
    });
  };

  const currentOdds = calculateParlayOdds(currentParlay.legs);
  const estimatedPayout = currentParlay.stake_amount ? calculatePayout(currentParlay.stake_amount, currentOdds) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Parlay Builder</h1>
                <p className="text-gray-600">Combine multiple bets for bigger payouts</p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 h-12 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Build Parlay
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Build Your Parlay</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Parlay Name
                    </label>
                    <Input
                      placeholder="Sunday NBA 3-Leg Parlay"
                      value={currentParlay.parlay_name}
                      onChange={(e) => setCurrentParlay({...currentParlay, parlay_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Parlay Legs ({currentParlay.legs.length})</h3>
                      <Button onClick={addLeg} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Leg
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {currentParlay.legs.map((leg, index) => (
                        <Card key={index} className="border-2 border-purple-100">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge className="bg-purple-100 text-purple-800">Leg {index + 1}</Badge>
                              {currentParlay.legs.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeLeg(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="Match (e.g., Lakers vs Celtics)"
                                value={leg.match_description}
                                onChange={(e) => updateLeg(index, 'match_description', e.target.value)}
                              />
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
                              <Input
                                placeholder="Sport (e.g., NBA)"
                                value={leg.sport}
                                onChange={(e) => updateLeg(index, 'sport', e.target.value)}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stake Amount ($)
                    </label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={currentParlay.stake_amount}
                      onChange={(e) => setCurrentParlay({...currentParlay, stake_amount: e.target.value})}
                    />
                  </div>

                  {currentParlay.stake_amount && currentParlay.legs.every(leg => leg.odds) && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Combined Odds</div>
                          <div className="text-2xl font-bold text-purple-600">{currentOdds}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Potential Payout</div>
                          <div className="text-2xl font-bold text-green-600">${estimatedPayout.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Stake</div>
                          <div className="text-2xl font-bold text-gray-900">${parseFloat(currentParlay.stake_amount).toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Potential Profit</div>
                          <div className="text-2xl font-bold text-emerald-600">
                            ${(estimatedPayout - parseFloat(currentParlay.stake_amount)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSaveParlay}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Save Parlay
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Parlays List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
              <p className="text-gray-600 mt-4">Loading parlays...</p>
            </div>
          ) : parlays.length === 0 ? (
            <Card className="border-2 border-purple-100">
              <CardContent className="py-16 text-center">
                <Zap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Parlays Yet</h3>
                <p className="text-gray-600 mb-6">
                  Build your first parlay to combine multiple bets for bigger payouts
                </p>
                <Button onClick={() => setDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                  Build First Parlay
                </Button>
              </CardContent>
            </Card>
          ) : (
            parlays.map((parlay, index) => (
              <motion.div
                key={parlay.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-gray-900">{parlay.parlay_name}</CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={
                            parlay.result === 'won' ? 'bg-green-100 text-green-800 border-green-300' :
                            parlay.result === 'lost' ? 'bg-red-100 text-red-800 border-red-300' :
                            'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }>
                            {parlay.result?.toUpperCase() || 'PENDING'}
                          </Badge>
                          <Badge variant="outline">
                            {parlay.legs_won || 0} / {parlay.legs_total} Legs Hit
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800">
                            {parlay.total_odds} Odds
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Potential Payout</div>
                        <div className="text-3xl font-bold text-purple-600">
                          ${parlay.potential_payout.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Stake: ${parlay.stake_amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {parlay.legs.map((leg, legIndex) => (
                        <div key={legIndex} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">Leg {legIndex + 1}</Badge>
                              {leg.sport && <Badge className="bg-blue-100 text-blue-800">{leg.sport}</Badge>}
                              {leg.result && (
                                <Badge className={leg.result === 'won' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {leg.result === 'won' ? '✅ Won' : '❌ Lost'}
                                </Badge>
                              )}
                            </div>
                            <div className="font-bold text-gray-900">{leg.match_description}</div>
                            <div className="text-sm text-gray-600">{leg.pick} ({leg.odds})</div>
                          </div>
                          {parlay.result === 'pending' && !leg.result && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => markLegResult(parlay, legIndex, true)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Won
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => markLegResult(parlay, legIndex, false)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Lost
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Parlay Tips */}
        <Card className="mt-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 Parlay Betting Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">⚠️</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Higher Risk, Higher Reward</h4>
                  <p className="text-sm text-gray-600">All legs must win for the parlay to pay out. One loss = entire parlay lost.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2-3</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Keep Leg Count Low</h4>
                  <p className="text-sm text-gray-600">2-3 leg parlays have better win probability than 5+ leg parlays.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">✅</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Correlated Picks</h4>
                  <p className="text-sm text-gray-600">Avoid legs that depend on each other (e.g., same game player props + total).</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">💰</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Bet Smaller Amounts</h4>
                  <p className="text-sm text-gray-600">Since parlays are riskier, bet smaller percentages of your bankroll (0.5-2%).</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ParlayBuilder() {
  return (
    <RequireAuth pageName="Parlay Builder">
      <ParlayBuilderContent />
    </RequireAuth>
  );
}
