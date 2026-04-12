import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, TrendingUp, Target, 
  Calendar, Trash2, CheckCircle, XCircle, Clock,
  BarChart3, PieChart, Filter, Search, Download, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function BetTrackerContent() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [_editingBet, setEditingBet] = useState(null);
  const [filterSport, setFilterSport] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [filterBetType, setFilterBetType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [activeView, setActiveView] = useState("bets");
  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [newBet, setNewBet] = useState({
    bet_type: "moneyline",
    sport: "",
    league: "",
    match_description: "",
    selection: "",
    odds: "",
    stake: "",
    sportsbook: "",
    event_date: "",
    notes: "",
    confidence: "medium",
    is_live_bet: false
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: bets = [], isLoading } = useQuery({
    queryKey: ['trackedBets', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.TrackedBet.filter(
        { created_by: currentUser.email },
        '-bet_date'
      );
    },
    enabled: !!currentUser?.email,
    refetchOnWindowFocus: true,
  });

  const createBetMutation = useMutation({
    mutationFn: (betData) => base44.entities.TrackedBet.create(betData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackedBets'] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const updateBetMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrackedBet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackedBets'] });
      setEditingBet(null);
    },
  });

  const deleteBetMutation = useMutation({
    mutationFn: (id) => base44.entities.TrackedBet.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackedBets'] }),
  });

  const resetForm = () => {
    setNewBet({
      bet_type: "moneyline",
      sport: "",
      league: "",
      match_description: "",
      selection: "",
      odds: "",
      stake: "",
      sportsbook: "",
      event_date: "",
      notes: "",
      confidence: "medium",
      is_live_bet: false
    });
  };

  const calculatePayout = (odds, stake) => {
    if (!odds || !stake) return { payout: 0, profit: 0 };
    const numOdds = parseFloat(odds);
    const numStake = parseFloat(stake);
    
    let profit;
    if (numOdds > 0) {
      profit = (numOdds / 100) * numStake;
    } else {
      profit = (100 / Math.abs(numOdds)) * numStake;
    }
    
    return {
      payout: numStake + profit,
      profit: profit,
      decimalOdds: numOdds > 0 ? (numOdds / 100) + 1 : (100 / Math.abs(numOdds)) + 1
    };
  };

  const handleSubmit = () => {
    const { payout, profit, decimalOdds } = calculatePayout(newBet.odds, newBet.stake);
    
    const betData = {
      ...newBet,
      odds: parseFloat(newBet.odds),
      stake: parseFloat(newBet.stake),
      decimal_odds: decimalOdds,
      potential_payout: payout,
      potential_profit: profit,
      bet_date: new Date().toISOString(),
      result: "pending"
    };

    createBetMutation.mutate(betData);
  };

  const handleUpdateResult = (bet, result) => {
    let actualProfit = 0;
    if (result === "won") {
      actualProfit = bet.potential_profit;
    } else if (result === "lost") {
      actualProfit = -bet.stake;
    } else if (result === "push") {
      actualProfit = 0;
    }

    updateBetMutation.mutate({
      id: bet.id,
      data: {
        result,
        actual_profit: actualProfit,
        settled_date: new Date().toISOString()
      }
    });
  };

  // Filter bets
  const filteredBets = useMemo(() => {
    return bets.filter(bet => {
      if (filterSport !== "all" && bet.sport !== filterSport) return false;
      if (filterResult !== "all" && bet.result !== filterResult) return false;
      if (filterBetType !== "all" && bet.bet_type !== filterBetType) return false;
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        return (
          bet.selection?.toLowerCase().includes(query) ||
          bet.match_description?.toLowerCase().includes(query) ||
          bet.sport?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [bets, filterSport, filterResult, filterBetType, debouncedSearch]);

  // Calculate stats
  const stats = useMemo(() => {
    const settled = bets.filter(b => b.result !== "pending" && b.result !== "void");
    const wins = settled.filter(b => b.result === "won");
    const losses = settled.filter(b => b.result === "lost");
    const totalStaked = settled.reduce((sum, b) => sum + (b.stake || 0), 0);
    const totalProfit = settled.reduce((sum, b) => sum + (b.actual_profit || 0), 0);
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
    const pendingBets = bets.filter(b => b.result === "pending");
    const pendingStake = pendingBets.reduce((sum, b) => sum + (b.stake || 0), 0);

    // Stats by sport
    const sportStats = {};
    settled.forEach(bet => {
      if (!sportStats[bet.sport]) {
        sportStats[bet.sport] = { wins: 0, losses: 0, profit: 0, staked: 0 };
      }
      sportStats[bet.sport].staked += bet.stake || 0;
      sportStats[bet.sport].profit += bet.actual_profit || 0;
      if (bet.result === "won") sportStats[bet.sport].wins++;
      if (bet.result === "lost") sportStats[bet.sport].losses++;
    });

    // Stats by bet type
    const betTypeStats = {};
    settled.forEach(bet => {
      if (!betTypeStats[bet.bet_type]) {
        betTypeStats[bet.bet_type] = { wins: 0, losses: 0, profit: 0, staked: 0 };
      }
      betTypeStats[bet.bet_type].staked += bet.stake || 0;
      betTypeStats[bet.bet_type].profit += bet.actual_profit || 0;
      if (bet.result === "won") betTypeStats[bet.bet_type].wins++;
      if (bet.result === "lost") betTypeStats[bet.bet_type].losses++;
    });

    return {
      totalBets: bets.length,
      settledBets: settled.length,
      wins: wins.length,
      losses: losses.length,
      winRate: settled.length > 0 ? (wins.length / settled.length) * 100 : 0,
      totalStaked,
      totalProfit,
      roi,
      pendingBets: pendingBets.length,
      pendingStake,
      sportStats,
      betTypeStats
    };
  }, [bets]);

  const uniqueSports = [...new Set(bets.map(b => b.sport).filter(Boolean))];

  const resultColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    won: "bg-green-100 text-green-800 border-green-300",
    lost: "bg-red-100 text-red-800 border-red-300",
    push: "bg-gray-100 text-gray-800 border-gray-300",
    void: "bg-gray-100 text-gray-600 border-gray-300"
  };

  const resultIcons = {
    pending: <Clock className="w-4 h-4" />,
    won: <CheckCircle className="w-4 h-4" />,
    lost: <XCircle className="w-4 h-4" />,
    push: <Target className="w-4 h-4" />,
    void: <XCircle className="w-4 h-4" />
  };

  // Calculate cumulative profit over time for chart
  const profitOverTime = useMemo(() => {
    const settled = bets
      .filter(b => b.result !== "pending" && b.result !== "void" && b.settled_date)
      .sort((a, b) => new Date(a.settled_date) - new Date(b.settled_date));
    
    let cumulative = 0;
    return settled.map(bet => {
      cumulative += bet.actual_profit || 0;
      return {
        date: format(new Date(bet.settled_date), 'MMM d'),
        profit: cumulative,
        betResult: bet.result
      };
    });
  }, [bets]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Sport', 'Type', 'Selection', 'Match', 'Odds', 'Stake', 'Result', 'Profit/Loss', 'Sportsbook', 'Notes'];
    const rows = filteredBets.map(bet => [
      format(new Date(bet.bet_date), 'yyyy-MM-dd HH:mm'),
      bet.sport || '',
      bet.bet_type || '',
      bet.selection || '',
      bet.match_description || '',
      bet.odds || '',
      bet.stake || '',
      bet.result || '',
      bet.actual_profit || '',
      bet.sportsbook || '',
      bet.notes || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bet-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export summary report
  const exportReport = () => {
    const report = `
BETTING PERFORMANCE REPORT
Generated: ${format(new Date(), 'MMMM d, yyyy')}
================================

OVERALL STATISTICS
------------------
Total Bets: ${stats.totalBets}
Settled Bets: ${stats.settledBets}
Win Rate: ${stats.winRate.toFixed(1)}%
Record: ${stats.wins}W - ${stats.losses}L
Total Staked: $${stats.totalStaked.toFixed(2)}
Total Profit: ${stats.totalProfit >= 0 ? '+' : ''}$${stats.totalProfit.toFixed(2)}
ROI: ${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}%
Pending Bets: ${stats.pendingBets} ($${stats.pendingStake.toFixed(2)})

PERFORMANCE BY SPORT
--------------------
${Object.entries(stats.sportStats).map(([sport, data]) => {
  const winRate = data.wins + data.losses > 0 ? (data.wins / (data.wins + data.losses)) * 100 : 0;
  const roi = data.staked > 0 ? (data.profit / data.staked) * 100 : 0;
  return `${sport}: ${data.wins}W-${data.losses}L | Win Rate: ${winRate.toFixed(1)}% | Profit: ${data.profit >= 0 ? '+' : ''}$${data.profit.toFixed(2)} | ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`;
}).join('\n')}

PERFORMANCE BY BET TYPE
-----------------------
${Object.entries(stats.betTypeStats).map(([type, data]) => {
  const winRate = data.wins + data.losses > 0 ? (data.wins / (data.wins + data.losses)) * 100 : 0;
  const roi = data.staked > 0 ? (data.profit / data.staked) * 100 : 0;
  return `${type}: ${data.wins}W-${data.losses}L | Win Rate: ${winRate.toFixed(1)}% | Profit: ${data.profit >= 0 ? '+' : ''}$${data.profit.toFixed(2)} | ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`;
}).join('\n')}

================================
Generated by Sports Wager Helper
    `.trim();
    
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `betting-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">Total Bets</div>
            <div className="text-2xl font-black text-gray-900">{stats.totalBets}</div>
            <div className="text-xs text-blue-600">{stats.pendingBets} pending</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">Win Rate</div>
            <div className="text-2xl font-black text-green-600">{stats.winRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">{stats.wins}W - {stats.losses}L</div>
          </CardContent>
        </Card>
        
        <Card className={`border-2 ${stats.totalProfit >= 0 ? 'border-emerald-200 bg-gradient-to-br from-emerald-50' : 'border-red-200 bg-gradient-to-br from-red-50'} to-white`}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">Total Profit</div>
            <div className={`text-2xl font-black ${stats.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">${stats.totalStaked.toFixed(0)} staked</div>
          </CardContent>
        </Card>
        
        <Card className={`border-2 ${stats.roi >= 0 ? 'border-purple-200 bg-gradient-to-br from-purple-50' : 'border-orange-200 bg-gradient-to-br from-orange-50'} to-white`}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">ROI</div>
            <div className={`text-2xl font-black ${stats.roi >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>
              {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Return on investment</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-2xl font-black text-yellow-600">${stats.pendingStake.toFixed(0)}</div>
            <div className="text-xs text-gray-600">{stats.pendingBets} bets open</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Stake</div>
            <div className="text-2xl font-black text-indigo-600">
              ${stats.settledBets > 0 ? (stats.totalStaked / stats.settledBets).toFixed(0) : 0}
            </div>
            <div className="text-xs text-gray-600">Per bet</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold">
                <Plus className="w-5 h-5 mr-2" />
                Log New Bet
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Log a New Bet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bet Type</Label>
                  <Select value={newBet.bet_type} onValueChange={(v) => setNewBet({...newBet, bet_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moneyline">Moneyline</SelectItem>
                      <SelectItem value="spread">Spread</SelectItem>
                      <SelectItem value="over_under">Over/Under</SelectItem>
                      <SelectItem value="parlay">Parlay</SelectItem>
                      <SelectItem value="prop">Prop Bet</SelectItem>
                      <SelectItem value="futures">Futures</SelectItem>
                      <SelectItem value="teaser">Teaser</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sport</Label>
                  <Select value={newBet.sport} onValueChange={(v) => setNewBet({...newBet, sport: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NBA">NBA</SelectItem>
                      <SelectItem value="NFL">NFL</SelectItem>
                      <SelectItem value="MLB">MLB</SelectItem>
                      <SelectItem value="NHL">NHL</SelectItem>
                      <SelectItem value="NCAAF">NCAAF</SelectItem>
                      <SelectItem value="NCAAB">NCAAB</SelectItem>
                      <SelectItem value="Soccer">Soccer</SelectItem>
                      <SelectItem value="UFC/MMA">UFC/MMA</SelectItem>
                      <SelectItem value="Tennis">Tennis</SelectItem>
                      <SelectItem value="Golf">Golf</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Match/Event</Label>
                <Input 
                  placeholder="e.g., Lakers vs Celtics"
                  value={newBet.match_description}
                  onChange={(e) => setNewBet({...newBet, match_description: e.target.value})}
                />
              </div>

              <div>
                <Label>Your Selection *</Label>
                <Input 
                  placeholder="e.g., Lakers -5.5, Over 220.5, Lakers ML"
                  value={newBet.selection}
                  onChange={(e) => setNewBet({...newBet, selection: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Odds (American) *</Label>
                  <Input 
                    type="number"
                    placeholder="-110 or +150"
                    value={newBet.odds}
                    onChange={(e) => setNewBet({...newBet, odds: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Stake ($) *</Label>
                  <Input 
                    type="number"
                    placeholder="100"
                    value={newBet.stake}
                    onChange={(e) => setNewBet({...newBet, stake: e.target.value})}
                  />
                </div>
              </div>

              {newBet.odds && newBet.stake && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Potential Payout:</span>
                    <span className="font-bold text-emerald-600">
                      ${calculatePayout(newBet.odds, newBet.stake).payout.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Potential Profit:</span>
                    <span className="font-bold text-emerald-600">
                      +${calculatePayout(newBet.odds, newBet.stake).profit.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sportsbook</Label>
                  <Select value={newBet.sportsbook} onValueChange={(v) => setNewBet({...newBet, sportsbook: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DraftKings">DraftKings</SelectItem>
                      <SelectItem value="FanDuel">FanDuel</SelectItem>
                      <SelectItem value="BetMGM">BetMGM</SelectItem>
                      <SelectItem value="Caesars">Caesars</SelectItem>
                      <SelectItem value="PointsBet">PointsBet</SelectItem>
                      <SelectItem value="BetRivers">BetRivers</SelectItem>
                      <SelectItem value="Bovada">Bovada</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Confidence</Label>
                  <Select value={newBet.confidence} onValueChange={(v) => setNewBet({...newBet, confidence: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Event Date</Label>
                <Input 
                  type="datetime-local"
                  value={newBet.event_date}
                  onChange={(e) => setNewBet({...newBet, event_date: e.target.value})}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Any notes about this bet..."
                  value={newBet.notes}
                  onChange={(e) => setNewBet({...newBet, notes: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="live_bet"
                  checked={newBet.is_live_bet}
                  onChange={(e) => setNewBet({...newBet, is_live_bet: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="live_bet" className="cursor-pointer">This is a live/in-play bet</Label>
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={!newBet.selection || !newBet.odds || !newBet.stake || !newBet.sport}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                Log Bet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          
          {/* Export Buttons */}
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            disabled={filteredBets.length === 0}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={exportReport}
            disabled={stats.settledBets === 0}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
          <TabsList>
            <TabsTrigger value="bets">
              <Calendar className="w-4 h-4 mr-1" />
              Bets
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <BarChart3 className="w-4 h-4 mr-1" />
              Analysis
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeView === "bets" && (
        <>
          {/* Filters */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Filters:</span>
                </div>
                
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search bets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterSport} onValueChange={setFilterSport}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    {uniqueSports.map(sport => (
                      <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBetType} onValueChange={setFilterBetType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="moneyline">Moneyline</SelectItem>
                    <SelectItem value="spread">Spread</SelectItem>
                    <SelectItem value="over_under">Over/Under</SelectItem>
                    <SelectItem value="parlay">Parlay</SelectItem>
                    <SelectItem value="prop">Prop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bets List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading your bets...</p>
            </div>
          ) : filteredBets.length === 0 ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="p-12 text-center">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                  alt="S.A.L. the Owl"
                  className="w-20 h-20 mx-auto rounded-2xl mb-4"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No bets found</h3>
                <p className="text-gray-600 mb-4">
                  {bets.length === 0 
                    ? "S.A.L. says: Track your bets to unlock powerful performance insights!"
                    : "Try adjusting your filters to see more results."}
                </p>
                {bets.length === 0 && (
                  <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Your First Bet
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredBets.map((bet, index) => (
                  <motion.div
                    key={bet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">{bet.sport}</Badge>
                              <Badge variant="outline" className="text-xs">{bet.bet_type}</Badge>
                              {bet.is_live_bet && (
                                <Badge className="bg-red-100 text-red-800 text-xs">LIVE</Badge>
                              )}
                              <Badge className={`${resultColors[bet.result]} text-xs flex items-center gap-1`}>
                                {resultIcons[bet.result]}
                                {bet.result.toUpperCase()}
                              </Badge>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">{bet.selection}</h3>
                            {bet.match_description && (
                              <p className="text-sm text-gray-600">{bet.match_description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                              <span>Odds: <strong className={bet.odds > 0 ? 'text-green-600' : 'text-gray-900'}>{bet.odds > 0 ? '+' : ''}{bet.odds}</strong></span>
                              <span>Stake: <strong>${bet.stake?.toFixed(2)}</strong></span>
                              <span>To Win: <strong className="text-emerald-600">${bet.potential_profit?.toFixed(2)}</strong></span>
                              {bet.sportsbook && <span>@ {bet.sportsbook}</span>}
                            </div>
                            {bet.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic">"{bet.notes}"</p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs text-gray-500">
                              {format(new Date(bet.bet_date), 'MMM d, yyyy h:mm a')}
                            </div>
                            
                            {bet.result === "pending" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-500 text-green-600 hover:bg-green-50"
                                  onClick={() => handleUpdateResult(bet, "won")}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Won
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500 text-red-600 hover:bg-red-50"
                                  onClick={() => handleUpdateResult(bet, "lost")}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Lost
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-400 text-gray-600 hover:bg-gray-50"
                                  onClick={() => handleUpdateResult(bet, "push")}
                                >
                                  Push
                                </Button>
                              </div>
                            ) : (
                              <div className={`text-lg font-bold ${bet.actual_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {bet.actual_profit >= 0 ? '+' : ''}{bet.actual_profit?.toFixed(2)}
                              </div>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteBetMutation.mutate(bet.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {activeView === "analysis" && (
        <div className="space-y-6">
          {/* Profit Over Time Chart */}
          {profitOverTime.length > 1 && (
            <Card className="border-2 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-gray-200">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Profit Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={profitOverTime}>
                      <defs>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                      <Tooltip 
                        formatter={(value) => [`$${value.toFixed(2)}`, 'Cumulative Profit']}
                        contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fill="url(#profitGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance by Sport */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                Performance by Sport
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {Object.keys(stats.sportStats).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No settled bets yet. Start tracking to see your performance!</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.sportStats).map(([sport, data]) => {
                    const winRate = data.wins + data.losses > 0 
                      ? (data.wins / (data.wins + data.losses)) * 100 
                      : 0;
                    const roi = data.staked > 0 ? (data.profit / data.staked) * 100 : 0;
                    
                    return (
                      <Card key={sport} className={`border-2 ${data.profit >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <CardContent className="p-4">
                          <h4 className="font-bold text-gray-900 mb-2">{sport}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Record:</span>
                              <span className="ml-2 font-bold">{data.wins}W-{data.losses}L</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Win Rate:</span>
                              <span className="ml-2 font-bold">{winRate.toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Profit:</span>
                              <span className={`ml-2 font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {data.profit >= 0 ? '+' : ''}${data.profit.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">ROI:</span>
                              <span className={`ml-2 font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance by Bet Type */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                Performance by Bet Type
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {Object.keys(stats.betTypeStats).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No settled bets yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.betTypeStats).map(([betType, data]) => {
                    const winRate = data.wins + data.losses > 0 
                      ? (data.wins / (data.wins + data.losses)) * 100 
                      : 0;
                    const roi = data.staked > 0 ? (data.profit / data.staked) * 100 : 0;
                    
                    const betTypeLabels = {
                      moneyline: "Moneyline",
                      spread: "Spread",
                      over_under: "Over/Under",
                      parlay: "Parlay",
                      prop: "Prop Bets",
                      futures: "Futures",
                      teaser: "Teaser"
                    };
                    
                    return (
                      <Card key={betType} className={`border-2 ${data.profit >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <CardContent className="p-4">
                          <h4 className="font-bold text-gray-900 mb-2">{betTypeLabels[betType] || betType}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Record:</span>
                              <span className="ml-2 font-bold">{data.wins}W-{data.losses}L</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Win Rate:</span>
                              <span className="ml-2 font-bold">{winRate.toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Profit:</span>
                              <span className={`ml-2 font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {data.profit >= 0 ? '+' : ''}${data.profit.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">ROI:</span>
                              <span className={`ml-2 font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Betting Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.settledBets > 0 ? (
                  <>
                    {stats.winRate >= 52.4 && (
                      <p className="text-green-700">✅ Your win rate of {stats.winRate.toFixed(1)}% is above the break-even threshold for -110 odds!</p>
                    )}
                    {stats.winRate < 52.4 && stats.winRate >= 50 && (
                      <p className="text-yellow-700">⚠️ Your win rate is {stats.winRate.toFixed(1)}%. You need ~52.4% to break even at -110 odds.</p>
                    )}
                    {stats.winRate < 50 && (
                      <p className="text-red-700">📉 Your win rate of {stats.winRate.toFixed(1)}% is below 50%. Consider being more selective with your bets.</p>
                    )}
                    {Object.entries(stats.sportStats).length > 1 && (
                      <p className="text-purple-700">
                        📊 Your most profitable sport is{' '}
                        <strong>
                          {Object.entries(stats.sportStats).sort((a, b) => b[1].profit - a[1].profit)[0][0]}
                        </strong>
                      </p>
                    )}
                    {stats.roi > 5 && (
                      <p className="text-emerald-700">🔥 Great ROI of {stats.roi.toFixed(1)}%! Keep up the disciplined betting!</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-600">Start logging and settling bets to see personalized insights about your betting patterns.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}