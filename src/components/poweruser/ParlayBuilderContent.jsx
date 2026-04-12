import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export default function ParlayBuilderContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newParlay, setNewParlay] = useState({
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
      setNewParlay({
        parlay_name: "",
        legs: [{ match_description: "", pick: "", odds: "", sport: "" }],
        stake_amount: ""
      });
    },
  });

  const deleteParlayMutation = useMutation({
    mutationFn: (id) => base44.entities.Parlay.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parlays'] });
    },
  });

  const americanToDecimal = (american) => {
    const num = parseFloat(american);
    if (num >= 0) {
      return (num / 100) + 1;
    } else {
      return (100 / Math.abs(num)) + 1;
    }
  };

  const calculateParlayOdds = (legs) => {
    let combinedDecimal = 1;
    legs.forEach(leg => {
      if (leg.odds) {
        const decimal = americanToDecimal(leg.odds);
        combinedDecimal *= decimal;
      }
    });
    
    if (combinedDecimal >= 2) {
      return `+${Math.round((combinedDecimal - 1) * 100)}`;
    } else {
      return `-${Math.round(100 / (combinedDecimal - 1))}`;
    }
  };

  const calculatePayout = (stake, odds) => {
    const stakeNum = parseFloat(stake);
    const oddsNum = parseFloat(odds.replace('+', ''));
    
    if (odds.startsWith('+')) {
      return stakeNum + (stakeNum * oddsNum) / 100;
    } else {
      return stakeNum + (stakeNum * 100) / Math.abs(oddsNum);
    }
  };

  const addLeg = () => {
    setNewParlay({
      ...newParlay,
      legs: [...newParlay.legs, { match_description: "", pick: "", odds: "", sport: "" }]
    });
  };

  const removeLeg = (index) => {
    const newLegs = newParlay.legs.filter((_, i) => i !== index);
    setNewParlay({ ...newParlay, legs: newLegs });
  };

  const updateLeg = (index, field, value) => {
    const newLegs = [...newParlay.legs];
    newLegs[index][field] = value;
    setNewParlay({ ...newParlay, legs: newLegs });
  };

  const handleCreateParlay = () => {
    const totalOdds = calculateParlayOdds(newParlay.legs);
    const potentialPayout = calculatePayout(newParlay.stake_amount, totalOdds);
    
    createParlayMutation.mutate({
      ...newParlay,
      total_odds: totalOdds,
      stake_amount: parseFloat(newParlay.stake_amount),
      potential_payout: potentialPayout,
      legs_total: newParlay.legs.length
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-black text-gray-900 mb-2">Multi-Pick Analyzer</CardTitle>
              <p className="text-gray-600">Build and track your multi-pick combinations</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-12 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  New Multi-Pick
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Build Your Multi-Pick</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Combination Name
                    </label>
                    <Input
                      placeholder="Sunday NBA 3-Leg"
                      value={newParlay.parlay_name}
                      onChange={(e) => setNewParlay({...newParlay, parlay_name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Picks</h3>
                      <Button onClick={addLeg} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Pick
                      </Button>
                    </div>

                    {newParlay.legs.map((leg, index) => (
                      <Card key={index} className="bg-gray-50 border-2 border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge>Pick {index + 1}</Badge>
                            {newParlay.legs.length > 1 && (
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stake Amount ($)
                    </label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newParlay.stake_amount}
                      onChange={(e) => setNewParlay({...newParlay, stake_amount: e.target.value})}
                    />
                  </div>

                  {newParlay.stake_amount && newParlay.legs.every(leg => leg.odds) && (
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-semibold">Combined Odds:</span>
                            <span className="text-xl font-bold text-purple-600">
                              {calculateParlayOdds(newParlay.legs)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Potential Payout:</span>
                            <span className="text-2xl font-bold text-green-600">
                              ${calculatePayout(newParlay.stake_amount, calculateParlayOdds(newParlay.legs)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={handleCreateParlay}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    disabled={!newParlay.parlay_name || !newParlay.stake_amount || newParlay.legs.some(leg => !leg.odds)}
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Create Multi-Pick
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Parlays List */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
            <p className="text-gray-600 mt-4">Loading your parlays...</p>
          </div>
        ) : parlays.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Multi-Picks Yet</h3>
              <p className="text-gray-600 mb-6">
                Build your first multi-pick to track combinations together
              </p>
              <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600">
                Create Your First Multi-Pick
              </Button>
            </CardContent>
          </Card>
        ) : (
          parlays.map((parlay, index) => (
            <motion.div
              key={parlay.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">{parlay.parlay_name}</CardTitle>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className="bg-purple-600 text-white">{parlay.legs.length} Picks</Badge>
                        <Badge className={`${
                          parlay.result === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          parlay.result === 'won' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {parlay.result?.toUpperCase() || 'PENDING'}
                        </Badge>
                        <span className="text-sm text-gray-600">Odds: {parlay.total_odds}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteParlayMutation.mutate(parlay.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 mb-6">
                    {parlay.legs.map((leg, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{leg.match_description}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium text-purple-600">{leg.pick}</span> • {leg.odds}
                          </div>
                        </div>
                        <Badge variant="outline">{leg.sport}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Stake</div>
                      <div className="text-2xl font-bold text-gray-900">${parlay.stake_amount}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Potential Payout</div>
                      <div className="text-2xl font-bold text-green-600">${parlay.potential_payout?.toFixed(2)}</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Potential Profit</div>
                      <div className="text-2xl font-bold text-purple-600">
                        ${(parlay.potential_payout - parlay.stake_amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}