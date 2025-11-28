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
                {/* Horizontally scrollable tabs on mobile */}
                <div className="mb-6 -mx-4 px-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <TabsList className="inline-flex w-max min-w-full gap-1 bg-black/40 backdrop-blur-sm p-1.5 rounded-xl border border-white/10">
              <TabsTrigger 
                value="tracker" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <ClipboardList className="w-4 h-4 flex-shrink-0" />
                <span>Track</span>
              </TabsTrigger>
              <TabsTrigger 
                value="parlay" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Zap className="w-4 h-4 flex-shrink-0" />
                <span>Multi</span>
              </TabsTrigger>
              <TabsTrigger 
                value="odds" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span>Odds</span>
              </TabsTrigger>
              <TabsTrigger 
                value="calculator" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Calculator className="w-4 h-4 flex-shrink-0" />
                <span>Calc</span>
              </TabsTrigger>
              <TabsTrigger 
                value="alerts" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Bell className="w-4 h-4 flex-shrink-0" />
                <span>Alerts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="roi" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>Perf</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bankroll" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Wallet className="w-4 h-4 flex-shrink-0" />
                <span>Budget</span>
              </TabsTrigger>
              <TabsTrigger 
                value="value" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Target className="w-4 h-4 flex-shrink-0" />
                <span>Value</span>
              </TabsTrigger>
            </TabsList>
          </div>

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