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
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 bg-black/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            🎯 TRACKING TOOLS
          </h1>
          <p className="text-white/70 text-base md:text-lg">Track performance, analyze odds, and manage your analytics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile: 4 cols x 2 rows, Tablet/iPad: 8 cols single row for better use of screen width */}
          <TabsList className="grid w-full grid-cols-8 gap-1 md:gap-2 mb-6 bg-black/40 backdrop-blur-sm p-1.5 md:p-2 rounded-xl border border-white/10 overflow-x-auto">
            <TabsTrigger 
              value="tracker" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1.5 md:px-2 min-h-[48px] flex items-center justify-center gap-1.5"
            >
              <ClipboardList className="w-4 h-4 flex-shrink-0" />
              <span>Track</span>
            </TabsTrigger>
            <TabsTrigger 
              value="parlay" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1.5 md:px-2 min-h-[48px] flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span>Multi</span>
            </TabsTrigger>
            <TabsTrigger 
              value="odds" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1.5 md:px-2 min-h-[48px] flex items-center justify-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              <span>Odds</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calculator" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1.5 md:px-2 min-h-[48px] flex items-center justify-center gap-1.5"
            >
              <Calculator className="w-4 h-4 flex-shrink-0" />
              <span>Calc</span>
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1.5 md:px-2 min-h-[48px] flex items-center justify-center gap-1.5"
            >
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span>Alerts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="roi" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1.5 md:px-2 min-h-[48px] flex items-center justify-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span>Perf</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bankroll" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1.5 md:px-2 min-h-[48px] flex items-center justify-center gap-1.5"
            >
              <Wallet className="w-4 h-4 flex-shrink-0" />
              <span>Budget</span>
            </TabsTrigger>
            <TabsTrigger 
              value="value" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1.5 md:px-2 min-h-[48px] flex items-center justify-center gap-1.5"
            >
              <Target className="w-4 h-4 flex-shrink-0" />
              <span>Value</span>
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