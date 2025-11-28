import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Sparkles, Target, Brain } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";

// Import the content from existing pages
import MyInsightsContent from "@/components/hub/MyInsightsContent";
import PlayerStatsContent from "@/components/hub/PlayerStatsContent";
import TeamStatsContent from "@/components/hub/TeamStatsContent";
import AIPerformanceContent from "@/components/hub/AIPerformanceContent";
import TodaysPredictions from "@/components/predictions/TodaysPredictions";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";

function AnalysisHubContent() {
  const [activeTab, setActiveTab] = useState("predictions");

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 md:px-6">
        {/* Header - iPad optimized with proper spacing */}
        <div className="mb-6 md:mb-8 bg-black/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            ⚡ ANALYSIS HUB
          </h1>
          <p className="text-white/70 text-base md:text-lg">AI-powered sports statistics, analytics, and performance insights</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* iPad optimized: 5 tabs in single row with proper touch targets */}
          <TabsList className="grid w-full grid-cols-5 gap-1.5 md:gap-3 mb-6 md:mb-8 bg-black/40 backdrop-blur-sm p-2 md:p-3 rounded-xl border border-white/10">
            <TabsTrigger 
              value="predictions" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1 md:px-3 min-h-[48px] flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4 flex-shrink-0" />
              <span>AI</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1 md:px-3 min-h-[48px] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Insights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="players" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1 md:px-3 min-h-[48px] flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4 flex-shrink-0" />
              <span>Players</span>
            </TabsTrigger>
            <TabsTrigger 
              value="teams" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1 md:px-3 min-h-[48px] flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Teams</span>
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-xs md:text-sm py-3 px-1 md:px-3 min-h-[48px] flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4 flex-shrink-0" />
              <span>Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictions">
            <TodaysPredictions />
          </TabsContent>

          <TabsContent value="insights">
            <MyInsightsContent />
          </TabsContent>

          <TabsContent value="players">
            <PlayerStatsContent />
          </TabsContent>

          <TabsContent value="teams">
            <TeamStatsContent />
          </TabsContent>

          <TabsContent value="performance">
            <AIPerformanceContent />
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