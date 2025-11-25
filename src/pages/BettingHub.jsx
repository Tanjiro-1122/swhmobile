import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, BarChart3, Bell, Calculator, TrendingUp, Wallet, ClipboardList, Target } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";

// Import content components
import ParlayBuilderContent from "@/components/poweruser/ParlayBuilderContent";
import BettingCalculatorContent from "@/components/poweruser/BettingCalculatorContent";
import ROITrackerContent from "@/components/poweruser/ROITrackerContent";
import BankrollManagerContent from "@/components/poweruser/BankrollManagerContent";
import LiveOddsContent from "@/components/hub/LiveOddsContent";
import AlertsContent from "@/components/hub/AlertsContent";
import BetTrackerContent from "@/components/hub/BetTrackerContent";
import ValueBetFinderContent from "@/components/hub/ValueBetFinderContent";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";

function BettingHubContent() {
  const [activeTab, setActiveTab] = useState("tracker");

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            🎯 TRACKING TOOLS
          </h1>
          <p className="text-white/70 text-lg">Track performance, analyze odds, and manage your analytics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 gap-1 mb-8 bg-black/40 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl border border-white/10 h-auto">
            <TabsTrigger 
              value="tracker" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2"
            >
              <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="truncate">Track</span>
            </TabsTrigger>
            <TabsTrigger 
              value="parlay" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2"
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="truncate">Multi</span>
            </TabsTrigger>
            <TabsTrigger 
              value="odds" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2"
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="truncate">Odds</span>
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2"
            >
              <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="truncate">Alerts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calculator" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2"
            >
              <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="truncate">Calc</span>
            </TabsTrigger>
            <TabsTrigger 
              value="roi" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2"
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="truncate">Perf</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bankroll" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2"
            >
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="truncate">Budget</span>
            </TabsTrigger>
            <TabsTrigger 
              value="value" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2"
            >
              <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="truncate">Value</span>
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

          <TabsContent value="value">
            <ValueBetFinderContent />
          </TabsContent>
        </Tabs>
      </div>
      <FloatingDashboardButton />
    </div>
  );
}

export default function BettingHub() {
  return (
    <RequireAuth pageName="Tracking Tools">
      <BettingHubContent />
    </RequireAuth>
  );
}