import { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, BarChart3, Bell, Calculator, TrendingUp, Wallet, ClipboardList, Target, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import RequireAuth from "@/components/auth/RequireAuth";

// Lazy load heavy content components
const ParlayBuilderContent = lazy(() => import("@/components/poweruser/ParlayBuilderContent"));
const BettingCalculatorContent = lazy(() => import("@/components/poweruser/BettingCalculatorContent"));
const ROITrackerContent = lazy(() => import("@/components/poweruser/ROITrackerContent"));
const BankrollManagerContent = lazy(() => import("@/components/poweruser/BankrollManagerContent"));
const LiveOddsContent = lazy(() => import("@/components/hub/LiveOddsContent"));
const AlertsContent = lazy(() => import("@/components/hub/AlertsContent"));
const BetTrackerContent = lazy(() => import("@/components/hub/BetTrackerContent"));
const ValueBetFinderContent = lazy(() => import("@/components/hub/ValueBetFinderContent"));

// Loading fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
  </div>
);

function BettingHubContent() {
  const [activeTab, setActiveTab] = useState("tracker");

  return (
    <div className="overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="w-full flex justify-start mb-2">
            <Link to={createPageUrl('Dashboard')}>
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 -ml-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </Link>
        </div>
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
            <Suspense fallback={<LoadingSpinner />}>
              <BetTrackerContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="parlay">
            <Suspense fallback={<LoadingSpinner />}>
              <ParlayBuilderContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="odds">
            <Suspense fallback={<LoadingSpinner />}>
              <LiveOddsContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="alerts">
            <Suspense fallback={<LoadingSpinner />}>
              <AlertsContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="calculator">
            <Suspense fallback={<LoadingSpinner />}>
              <BettingCalculatorContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="roi">
            <Suspense fallback={<LoadingSpinner />}>
              <ROITrackerContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="bankroll">
            <Suspense fallback={<LoadingSpinner />}>
              <BankrollManagerContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="value">
            <Suspense fallback={<LoadingSpinner />}>
              <ValueBetFinderContent />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
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