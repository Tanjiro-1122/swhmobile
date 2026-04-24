
import { useState } from "react";
import { createPageUrl } from "@/utils";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Plus, Calendar, Trophy, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from 'react-router-dom';

function ROITrackerContent() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBet, setNewBet] = useState({
    bet_type: "spread",
    match_description: "",
    odds: "",
    stake_amount: "",
    bet_date: new Date().toISOString().split('T')[0],
    game_date: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: bets, isLoading } = useQuery({
    queryKey: ['userBets', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.UserBet.filter(
        { created_by: currentUser.email },
        '-bet_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const createBetMutation = useMutation({
    mutationFn: (betData) => base44.entities.UserBet.create(betData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBets'] });
      setDialogOpen(false);
      setNewBet({
        bet_type: "spread",
        match_description: "",
        odds: "",
        stake_amount: "",
        bet_date: new Date().toISOString().split('T')[0],
        game_date: "",
        notes: ""
      });
    },
  });

  const updateBetMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserBet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBets'] });
    },
  });

  // Calculate potential payout based on American odds
  const calculatePayout = (stake, odds) => {
    const stakeNum = parseFloat(stake);
    const oddsNum = parseFloat(odds);
    
    if (isNaN(stakeNum) || isNaN(oddsNum) || stakeNum <= 0) return 0;

    if (oddsNum >= 0) {
      return stakeNum + (stakeNum * oddsNum) / 100;
    } else {
      return stakeNum + (stakeNum * 100) / Math.abs(oddsNum);
    }
  };

  const handleAddBet = () => {
    const potentialPayout = calculatePayout(newBet.stake_amount, newBet.odds);
    createBetMutation.mutate({
      ...newBet,
      potential_payout: potentialPayout,
      stake_amount: parseFloat(newBet.stake_amount)
    });
  };

  const markBetResult = (bet, result) => {
    const actualPayout = result === 'won' ? bet.potential_payout : 
                        result === 'push' ? bet.stake_amount : 0;
    
    updateBetMutation.mutate({
      id: bet.id,
      data: {
        result: result,
        actual_payout: actualPayout
      }
    });
  };

  // Calculate statistics
  const calculateStats = () => {
    const wonBets = bets.filter(b => b.result === 'won');
    const lostBets = bets.filter(b => b.result === 'lost');
    const pendingBets = bets.filter(b => b.result === 'pending');
    
    const totalWagered = bets.reduce((sum, bet) => sum + (bet.stake_amount || 0), 0);
    const totalReturned = bets.reduce((sum, bet) => sum + (bet.actual_payout || 0), 0);
    const totalProfit = totalReturned - totalWagered;
    const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;
    const winRate = (wonBets.length + lostBets.length) > 0 
      ? (wonBets.length / (wonBets.length + lostBets.length)) * 100 
      : 0;

    return {
      totalBets: bets.length,
      wonBets: wonBets.length,
      lostBets: lostBets.length,
      pendingBets: pendingBets.length,
      totalWagered,
      totalReturned,
      totalProfit,
      roi,
      winRate
    };
  };

  const stats = calculateStats();

  const getResultColor = (result) => {
    switch(result) {
      case 'won': return 'bg-green-100 text-green-800 border-green-300';
      case 'lost': return 'bg-red-100 text-red-800 border-red-300';
      case 'push': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
      {/* Back to Dashboard */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
      </div>
      <button
        onClick={() => navigate(createPageUrl("Dashboard"))}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#888", fontSize: 14, padding: "12px 16px 4px",
          fontWeight: 500
        }}
      >
        ← Back
      </button>
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Sign in to track your betting history and ROI
            </p>
            <Button
              onClick={() => window.location.href = '/Splash'}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">ROI Tracker</h1>
                <p className="text-gray-600">Track your bets and analyze performance</p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Bet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Add New Bet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bet Type
                      </label>
                      <Select value={newBet.bet_type} onValueChange={(value) => setNewBet({...newBet, bet_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spread">Spread</SelectItem>
                          <SelectItem value="moneyline">Moneyline</SelectItem>
                          <SelectItem value="over_under">Over/Under</SelectItem>
                          <SelectItem value="parlay">Parlay</SelectItem>
                          <SelectItem value="prop">Prop Bet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Odds
                      </label>
                      <Input
                        placeholder="-110 or +150"
                        value={newBet.odds}
                        onChange={(e) => setNewBet({...newBet, odds: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Match/Description
                    </label>
                    <Input
                      placeholder="Lakers -5.5 vs Celtics"
                      value={newBet.match_description}
                      onChange={(e) => setNewBet({...newBet, match_description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Stake Amount ($)
                      </label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={newBet.stake_amount}
                        onChange={(e) => setNewBet({...newBet, stake_amount: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Game Date
                      </label>
                      <Input
                        type="date"
                        value={newBet.game_date}
                        onChange={(e) => setNewBet({...newBet, game_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="Why did you make this bet?"
                      value={newBet.notes}
                      onChange={(e) => setNewBet({...newBet, notes: e.target.value})}
                    />
                  </div>

                  {newBet.stake_amount && newBet.odds && (
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <div className="flex justify-between">
                        <span className="font-semibold">Potential Payout:</span>
                        <span className="text-xl font-bold text-emerald-600">
                          ${calculatePayout(newBet.stake_amount, newBet.odds).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleAddBet}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                    disabled={!newBet.match_description || !newBet.odds || !newBet.stake_amount || isNaN(parseFloat(newBet.stake_amount)) || isNaN(parseFloat(newBet.odds))}
                  >
                    Add Bet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Total Bets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gray-900">{stats.totalBets}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.wonBets}W - {stats.lostBets}L - {stats.pendingBets}P
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">
                  {stats.winRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.wonBets} wins / {stats.wonBets + stats.lostBets} completed
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className={`border-2 ${stats.totalProfit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Total Profit/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  ${stats.totalWagered.toFixed(2)} wagered
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className={`border-2 ${stats.roi >= 0 ? 'border-emerald-200' : 'border-red-200'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${stats.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Return on Investment
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bets List */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl">Betting History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
                <p className="text-gray-600 mt-4">Loading your bets...</p>
              </div>
            ) : bets.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Bets Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start tracking your bets to analyze your performance
                </p>
                <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  Add Your First Bet
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bets.map((bet, index) => (
                  <motion.div
                    key={bet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border hover:border-emerald-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">{bet.bet_type}</Badge>
                              <Badge className={getResultColor(bet.result)}>
                                {bet.result.toUpperCase()}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {bet.match_description}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(bet.bet_date), 'MMM d, yyyy')}
                              </span>
                              <span>Odds: {bet.odds}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">Stake</div>
                            <div className="text-2xl font-bold text-gray-900">
                              ${bet.stake_amount}
                            </div>
                            {bet.result !== 'pending' && (
                              <div className={`text-sm font-semibold mt-2 ${
                                bet.actual_payout > bet.stake_amount ? 'text-green-600' : 
                                bet.actual_payout < bet.stake_amount ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {bet.actual_payout > bet.stake_amount ? '+' : ''}{bet.actual_payout !== bet.stake_amount ? (bet.actual_payout - bet.stake_amount).toFixed(2) : '0.00'}
                              </div>
                            )}
                          </div>
                        </div>

                        {bet.notes && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700">{bet.notes}</p>
                          </div>
                        )}

                        {bet.result === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => markBetResult(bet, 'won')}
                            >
                              Mark as Won
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => markBetResult(bet, 'push')}
                            >
                              Push
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-red-600 hover:bg-red-700"
                              onClick={() => markBetResult(bet, 'lost')}
                            >
                              Mark as Lost
                            </Button>
                          </div>
                        )}
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
  );
}

export default function ROITracker() {
  return (
    <RequireAuth pageName="ROI Tracker">
      <ROITrackerContent />
    </RequireAuth>
  );
}
