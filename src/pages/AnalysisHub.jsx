import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Sparkles, Target, Brain, Loader2 } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";

// Lazy load heavy content components
const MyInsightsContent = lazy(() => import("@/components/hub/MyInsightsContent"));
const PlayerStatsContent = lazy(() => import("@/components/hub/PlayerStatsContent"));
const TeamStatsContent = lazy(() => import("@/components/hub/TeamStatsContent"));
const AIPerformanceContent = lazy(() => import("@/components/hub/AIPerformanceContent"));
const TodaysPredictions = lazy(() => import("@/components/predictions/TodaysPredictions"));

// Loading fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
  </div>
);

function AnalysisHubContent() {
  const [activeTab, setActiveTab] = useState("predictions");

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header - 8-point grid: 24px bottom margin, 16/24px padding */}
        <div className="mb-6 bg-black/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            ⚡ ANALYSIS HUB
          </h1>
          <p className="text-white/70 text-base md:text-lg">AI-powered sports statistics, analytics, and performance insights</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Horizontally scrollable tabs */}
          <div className="mb-6 -mx-4 px-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <TabsList className="inline-flex w-max min-w-full gap-1 bg-black/40 backdrop-blur-sm p-1.5 rounded-xl border border-white/10">
              <TabsTrigger 
                value="predictions" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Brain className="w-4 h-4 flex-shrink-0" />
                <span>AI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>Insights</span>
              </TabsTrigger>
              <TabsTrigger 
                value="players" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <User className="w-4 h-4 flex-shrink-0" />
                <span>Players</span>
              </TabsTrigger>
              <TabsTrigger 
                value="teams" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Teams</span>
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Target className="w-4 h-4 flex-shrink-0" />
                <span>Stats</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="predictions">
            <Suspense fallback={<LoadingSpinner />}>
              <TodaysPredictions />
            </Suspense>
          </TabsContent>

          <TabsContent value="insights">
            <Suspense fallback={<LoadingSpinner />}>
              <MyInsightsContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="players">
            <Suspense fallback={<LoadingSpinner />}>
              <PlayerStatsContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="teams">
            <Suspense fallback={<LoadingSpinner />}>
              <TeamStatsContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="performance">
            <Suspense fallback={<LoadingSpinner />}>
              <AIPerformanceContent />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
      <FloatingDashboardButton />
    </div>
  );
}

export default function AnalysisHub() {
  return (
    <RequireAuth pageName="Analysis Hub">
      <AnalysisHubContent />
    </RequireAuth>
  );
}