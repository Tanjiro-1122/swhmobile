import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, Plus, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BankrollManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    entry_type: "deposit",
    amount: "",
    description: ""
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ['bankroll', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.BankrollEntry.filter(
        { created_by: currentUser.email },
        '-date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const addEntryMutation = useMutation({
    mutationFn: (entryData) => base44.entities.BankrollEntry.create(entryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankroll'] });
      setDialogOpen(false);
      setNewEntry({
        entry_type: "deposit",
        amount: "",
        description: ""
      });
    },
  });

  const handleAddEntry = () => {
    const amount = parseFloat(newEntry.amount);
    const currentBankroll = entries[0]?.current_bankroll || 0;
    
    let newBankroll;
    if (newEntry.entry_type === 'deposit' || newEntry.entry_type === 'win') {
      newBankroll = currentBankroll + amount;
    } else {
      newBankroll = currentBankroll - amount;
    }

    addEntryMutation.mutate({
      ...newEntry,
      amount: amount,
      current_bankroll: newBankroll,
      date: new Date().toISOString()
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Sign in to track your bankroll and betting finances
            </p>
            <Button
              onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentBankroll = entries[0]?.current_bankroll || 0;
  const initialBankroll = entries[entries.length - 1]?.current_bankroll || 0;
  const totalProfit = currentBankroll - initialBankroll;
  const roi = initialBankroll > 0 ? ((totalProfit / initialBankroll) * 100).toFixed(1) : 0;

  const deposits = entries.filter(e => e.entry_type === 'deposit').reduce((sum, e) => sum + e.amount, 0);
  const withdrawals = entries.filter(e => e.entry_type === 'withdrawal').reduce((sum, e) => sum + e.amount, 0);
  const wins = entries.filter(e => e.entry_type === 'win').reduce((sum, e) => sum + e.amount, 0);
  const losses = entries.filter(e => e.entry_type === 'loss').reduce((sum, e) => sum + e.amount, 0);

  // Chart data
  const chartData = [...entries].reverse().map(entry => ({
    date: format(new Date(entry.date), 'MMM d'),
    bankroll: entry.current_bankroll
  }));

  const getEntryIcon = (type) => {
    switch(type) {
      case 'deposit': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'withdrawal': return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'win': return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case 'loss': return <DollarSign className="w-5 h-5 text-orange-600" />;
      default: return null;
    }
  };

  const getEntryColor = (type) => {
    switch(type) {
      case 'deposit': return 'bg-green-100 text-green-800 border-green-300';
      case 'withdrawal': return 'bg-red-100 text-red-800 border-red-300';
      case 'win': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'loss': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const recommendedUnitSize = (currentBankroll * 0.02).toFixed(2);
  const maxBet = (currentBankroll * 0.05).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Bankroll Manager</h1>
                <p className="text-gray-600">Track your betting finances</p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-2xl">Add Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Transaction Type
                    </label>
                    <Select value={newEntry.entry_type} onValueChange={(value) => setNewEntry({...newEntry, entry_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">💰 Deposit</SelectItem>
                        <SelectItem value="withdrawal">💸 Withdrawal</SelectItem>
                        <SelectItem value="win">🎉 Bet Win</SelectItem>
                        <SelectItem value="loss">😔 Bet Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount ($)
                    </label>
                    <Input
                      type="number"
                      placeholder="100.00"
                      value={newEntry.amount}
                      onChange={(e) => setNewEntry({...newEntry, amount: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <Textarea
                      placeholder="e.g., Lakers bet payout, Initial deposit"
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Current Bankroll:</span>
                      <span className="text-2xl font-bold text-emerald-600">${currentBankroll.toFixed(2)}</span>
                    </div>
                    {newEntry.amount && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-200">
                        <span className="text-sm font-semibold text-gray-700">New Bankroll:</span>
                        <span className="text-2xl font-bold text-gray-900">
                          ${((newEntry.entry_type === 'deposit' || newEntry.entry_type === 'win') 
                            ? currentBankroll + parseFloat(newEntry.amount)
                            : currentBankroll - parseFloat(newEntry.amount)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleAddEntry}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                    disabled={!newEntry.amount}
                  >
                    Add Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Current Bankroll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-600">${currentBankroll.toFixed(2)}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={totalProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
                </Badge>
                <span className="text-xs text-gray-500">vs start</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi >= 0 ? '+' : ''}{roi}%
              </div>
              <div className="text-sm text-gray-600 mt-2">Return on Investment</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Total Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">+${wins.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mt-2">From {entries.filter(e => e.entry_type === 'win').length} bets</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Total Losses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">-${losses.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mt-2">From {entries.filter(e => e.entry_type === 'loss').length} bets</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <Card className="border-2 border-gray-200 mb-8">
            <CardHeader>
              <CardTitle>Bankroll History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bankroll" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Betting Guidelines */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Recommended Bet Sizing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border-2 border-emerald-300">
                <div className="text-sm text-gray-600 mb-1">Conservative (2% rule)</div>
                <div className="text-3xl font-bold text-emerald-600">${recommendedUnitSize}</div>
                <div className="text-xs text-gray-500 mt-1">per bet</div>
              </div>
              <div className="p-4 bg-white rounded-lg border-2 border-yellow-300">
                <div className="text-sm text-gray-600 mb-1">Aggressive (5% rule)</div>
                <div className="text-3xl font-bold text-yellow-600">${maxBet}</div>
                <div className="text-xs text-gray-500 mt-1">maximum per bet</div>
              </div>
              <div className="p-4 bg-white rounded-lg border-2 border-blue-300">
                <div className="text-sm text-gray-600 mb-1">Max Units</div>
                <div className="text-3xl font-bold text-blue-600">{Math.floor(currentBankroll / parseFloat(recommendedUnitSize))}</div>
                <div className="text-xs text-gray-500 mt-1">available units</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>Tip:</strong> Never risk more than 2-5% of your bankroll on a single bet. This protects you from going broke during losing streaks.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h3>
                <p className="text-gray-600 mb-6">
                  Add your first deposit to start tracking your bankroll
                </p>
                <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  Add First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-gray-200">
                        {getEntryIcon(entry.entry_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={getEntryColor(entry.entry_type)}>
                            {entry.entry_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {format(new Date(entry.date), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {entry.description && (
                          <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        entry.entry_type === 'deposit' || entry.entry_type === 'win' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {entry.entry_type === 'deposit' || entry.entry_type === 'win' ? '+' : '-'}
                        ${entry.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Balance: ${entry.current_bankroll.toFixed(2)}
                      </div>
                    </div>
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