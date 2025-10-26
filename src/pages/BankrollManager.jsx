import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, Plus, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function BankrollManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    entry_type: "deposit",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ['bankrollEntries', currentUser?.email],
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

  const createEntryMutation = useMutation({
    mutationFn: (entryData) => base44.entities.BankrollEntry.create(entryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankrollEntries'] });
      setDialogOpen(false);
      setNewEntry({
        entry_type: "deposit",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id) => base44.entities.BankrollEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankrollEntries'] });
    },
  });

  // Calculate current bankroll
  const calculateBankroll = () => {
    let total = 0;
    entries.forEach(entry => {
      if (entry.entry_type === 'deposit' || entry.entry_type === 'win') {
        total += entry.amount;
      } else if (entry.entry_type === 'withdrawal' || entry.entry_type === 'loss') {
        total -= entry.amount;
      }
    });
    return total;
  };

  const currentBankroll = calculateBankroll();

  const handleAddEntry = () => {
    const amount = parseFloat(newEntry.amount);
    const newBankroll = currentBankroll + 
      (newEntry.entry_type === 'deposit' || newEntry.entry_type === 'win' ? amount : -amount);

    createEntryMutation.mutate({
      ...newEntry,
      amount: amount,
      current_bankroll: newBankroll,
      date: new Date(newEntry.date).toISOString()
    });
  };

  // Calculate statistics
  const stats = {
    totalDeposits: entries.filter(e => e.entry_type === 'deposit').reduce((sum, e) => sum + e.amount, 0),
    totalWithdrawals: entries.filter(e => e.entry_type === 'withdrawal').reduce((sum, e) => sum + e.amount, 0),
    totalWins: entries.filter(e => e.entry_type === 'win').reduce((sum, e) => sum + e.amount, 0),
    totalLosses: entries.filter(e => e.entry_type === 'loss').reduce((sum, e) => sum + e.amount, 0),
  };

  const netProfit = stats.totalWins - stats.totalLosses;
  const roi = stats.totalDeposits > 0 ? (netProfit / stats.totalDeposits) * 100 : 0;

  const getEntryTypeColor = (type) => {
    switch(type) {
      case 'deposit': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'withdrawal': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'win': return 'bg-green-100 text-green-800 border-green-300';
      case 'loss': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEntryTypeIcon = (type) => {
    switch(type) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      case 'win': return '✅';
      case 'loss': return '❌';
      default: return '💵';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Sign in to track your bankroll and manage your betting funds
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
                <p className="text-gray-600">Track deposits, withdrawals, wins, and losses</p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
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
                        <SelectItem value="win">✅ Win</SelectItem>
                        <SelectItem value="loss">❌ Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount ($)
                    </label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newEntry.amount}
                      onChange={(e) => setNewEntry({...newEntry, amount: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <Textarea
                      placeholder="Add notes about this transaction..."
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                    />
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Current Bankroll
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${currentBankroll >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${currentBankroll.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-2 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">
                  ${stats.totalWins.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-2 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Total Losses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-600">
                  ${stats.totalLosses.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className={`border-2 ${netProfit >= 0 ? 'border-emerald-200' : 'border-red-200'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Net Profit/Loss
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  ROI: {roi.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Transactions List */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
                <p className="text-gray-600 mt-4">Loading transactions...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start tracking your betting bankroll by adding your first transaction
                </p>
                <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  Add First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border hover:border-emerald-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-4xl">
                              {getEntryTypeIcon(entry.entry_type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={getEntryTypeColor(entry.entry_type)}>
                                  {entry.entry_type.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {format(new Date(entry.date), 'MMM d, yyyy')}
                                </span>
                              </div>
                              {entry.description && (
                                <p className="text-gray-700">{entry.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-3xl font-bold ${
                              entry.entry_type === 'deposit' || entry.entry_type === 'win' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {entry.entry_type === 'deposit' || entry.entry_type === 'win' ? '+' : '-'}
                              ${entry.amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Balance: ${entry.current_bankroll.toFixed(2)}
                            </div>
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

        {/* Bankroll Tips */}
        <Card className="mt-8 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 Bankroll Management Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Never Risk More Than 5%</h4>
                  <p className="text-sm text-gray-600">Keep individual bets between 1-5% of your total bankroll to survive losing streaks.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Separate Bankroll from Personal Funds</h4>
                  <p className="text-sm text-gray-600">Keep your betting money completely separate from living expenses.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Withdraw Profits Regularly</h4>
                  <p className="text-sm text-gray-600">Take out 25-50% of profits monthly to protect your earnings.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Track Everything</h4>
                  <p className="text-sm text-gray-600">Log every deposit, withdrawal, win, and loss to understand your true performance.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}