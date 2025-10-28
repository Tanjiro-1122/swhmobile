import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, Plus, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function BankrollManagerContent() {
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
    const newBankrollAfterThis = currentBankroll +
      (newEntry.entry_type === 'deposit' || newEntry.entry_type === 'win' ? amount : -amount);

    createEntryMutation.mutate({
      ...newEntry,
      amount: amount,
      current_bankroll: newBankrollAfterThis,
      date: new Date(newEntry.date).toISOString()
    });
  };

  const stats = {
    totalDeposits: entries.filter(e => e.entry_type === 'deposit').reduce((sum, e) => sum + e.amount, 0),
    totalWithdrawals: entries.filter(e => e.entry_type === 'withdrawal').reduce((sum, e) => sum + e.amount, 0),
    totalWins: entries.filter(e => e.entry_type === 'win').reduce((sum, e) => sum + e.amount, 0),
    totalLosses: entries.filter(e => e.entry_type === 'loss').reduce((sum, e) => sum + e.amount, 0),
  };

  const netProfit = stats.totalWins - stats.totalLosses;
  const roi = stats.totalDeposits > 0 ? (netProfit / stats.totalDeposits) * 100 : 0;

  const getTierBadge = (type) => {
    switch(type) {
      case 'deposit':
        return <Badge className="bg-blue-500 text-white font-bold">💰 DEPOSIT</Badge>;
      case 'withdrawal':
        return <Badge className="bg-purple-500 text-white font-bold">💸 WITHDRAWAL</Badge>;
      case 'win':
        return <Badge className="bg-green-500 text-white font-bold">✅ WIN</Badge>;
      case 'loss':
        return <Badge className="bg-red-500 text-white font-bold">❌ LOSS</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTierIcon = (type) => {
    switch(type) {
      case 'deposit':
        return <Plus className="w-8 h-8 text-blue-600" />;
      case 'withdrawal':
        return <TrendingDown className="w-8 h-8 text-purple-600" />;
      case 'win':
        return <TrendingUp className="w-8 h-8 text-green-600" />;
      case 'loss':
        return <TrendingDown className="w-8 h-8 text-red-600" />;
      default:
        return <DollarSign className="w-8 h-8 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-black text-gray-900 mb-2">Bankroll Manager</CardTitle>
              <p className="text-gray-600">Track deposits, withdrawals, wins, and losses</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 px-6">
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
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    disabled={!newEntry.amount}
                  >
                    Add Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 border-emerald-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-700 font-bold flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Current Bankroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-black ${currentBankroll >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${currentBankroll.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-2 border-green-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-700 font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-green-600">
                ${stats.totalWins.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-2 border-red-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-700 font-bold flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Total Losses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-red-600">
                ${stats.totalLosses.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className={`border-2 ${netProfit >= 0 ? 'border-emerald-200' : 'border-red-200'} bg-white`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-700 font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Net Profit/Loss
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
              </div>
              <div className="text-sm text-gray-700 mt-1 font-semibold">
                ROI: {roi.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transactions List */}
      <Card className="border-2 border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Transaction History</CardTitle>
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
              <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-green-600 to-emerald-600">
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
                  <Card className="border-2 border-gray-200 hover:border-emerald-300 transition-colors bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                            {getTierIcon(entry.entry_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getTierBadge(entry.entry_type)}
                              <span className="text-sm text-gray-700 flex items-center gap-1 font-semibold">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(entry.date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {entry.description && (
                              <p className="text-gray-800 font-medium">{entry.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-3xl font-black ${
                            entry.entry_type === 'deposit' || entry.entry_type === 'win'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {entry.entry_type === 'deposit' || entry.entry_type === 'win' ? '+' : '-'}
                            ${entry.amount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-700 mt-1 font-semibold">
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
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-black text-gray-900">
            💡 Bankroll Management Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-lg">1</span>
              </div>
              <div>
                <h4 className="font-black text-gray-900 mb-1 text-lg">Never Risk More Than 5%</h4>
                <p className="text-sm text-gray-700 font-medium">Keep individual bets between 1-5% of your total bankroll to survive losing streaks.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-lg">2</span>
              </div>
              <div>
                <h4 className="font-black text-gray-900 mb-1 text-lg">Separate Bankroll from Personal Funds</h4>
                <p className="text-sm text-gray-700 font-medium">Keep your betting money completely separate from living expenses.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-lg">3</span>
              </div>
              <div>
                <h4 className="font-black text-gray-900 mb-1 text-lg">Withdraw Profits Regularly</h4>
                <p className="text-sm text-gray-700 font-medium">Take out 25-50% of profits monthly to protect your earnings.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-lg">4</span>
              </div>
              <div>
                <h4 className="font-black text-gray-900 mb-1 text-lg">Track Everything</h4>
                <p className="text-sm text-gray-700 font-medium">Log every deposit, withdrawal, win, and loss to understand your true performance.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}