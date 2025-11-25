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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            ⚡ ANALYSIS HUB
          </h1>
          <p className="text-white/70 text-lg">AI-powered insights for players, teams, and predictions</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1 mb-8 bg-black/40 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl border border-white/10 h-auto">
            <TabsTrigger 
              value="predictions" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">AI</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Insights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="players" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Players</span>
            </TabsTrigger>
            <TabsTrigger 
              value="teams" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Teams</span>
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-xs sm:text-sm py-2 px-1 sm:px-3 col-span-3 sm:col-span-1"
            >
              <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Stats</span>
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