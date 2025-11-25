import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, BarChart3, Bell, Calculator, TrendingUp, Wallet, ClipboardList } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";

// Import content components
import ParlayBuilderContent from "@/components/poweruser/ParlayBuilderContent";
import BettingCalculatorContent from "@/components/poweruser/BettingCalculatorContent";
import ROITrackerContent from "@/components/poweruser/ROITrackerContent";
import BankrollManagerContent from "@/components/poweruser/BankrollManagerContent";
import LiveOddsContent from "@/components/hub/LiveOddsContent";
import AlertsContent from "@/components/hub/AlertsContent";
import BetTrackerContent from "@/components/hub/BetTrackerContent";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";

function BettingHubContent() {
  const [activeTab, setActiveTab] = useState("tracker");

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            🎯 BETTING TOOLS
          </h1>
          <p className="text-white/70 text-lg">Track bets, build parlays, and manage your bankroll</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-8 bg-black/40 backdrop-blur-sm p-2 rounded-xl border border-white/10">
            <TabsTrigger 
              value="tracker" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white"
            >
              <ClipboardList className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">Bet Tracker</span>
              <span className="lg:hidden">Track</span>
            </TabsTrigger>
            <TabsTrigger 
              value="parlay" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Zap className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">Parlay Builder</span>
              <span className="lg:hidden">Parlay</span>
            </TabsTrigger>
            <TabsTrigger 
              value="odds" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">Live Odds</span>
              <span className="lg:hidden">Odds</span>
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
            >
              <Bell className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">Alerts</span>
              <span className="lg:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calculator" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white"
            >
              <Calculator className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">Calculator</span>
              <span className="lg:hidden">Calc</span>
            </TabsTrigger>
            <TabsTrigger 
              value="roi" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">ROI Tracker</span>
              <span className="lg:hidden">ROI</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bankroll" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <Wallet className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">Bankroll</span>
              <span className="lg:hidden">Bank</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracker">
            <BetTrackerContent />
          </TabsContent>

          <TabsContent value="parlay">
            <ParlayBuilderContent />
          </TabsContent>

          <TabsContent value="odds">
            <LiveOddsContent />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsContent />
          </TabsContent>

          <TabsContent value="calculator">
            <BettingCalculatorContent />
          </TabsContent>

          <TabsContent value="roi">
            <ROITrackerContent />
          </TabsContent>

          <TabsContent value="bankroll">
            <BankrollManagerContent />
          </TabsContent>
        </Tabs>
      </div>
      <FloatingDashboardButton />
    </div>
  );
}

export default function BettingHub() {
  return (
    <RequireAuth pageName="Betting Tools">
      <BettingHubContent />
    </RequireAuth>
  );
}