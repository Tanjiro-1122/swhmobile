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

function AnalysisHubContent() {
  const [activeTab, setActiveTab] = useState("insights");

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
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-black/40 backdrop-blur-sm p-2 rounded-xl border border-white/10">
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">My Insights</span>
              <span className="sm:hidden">Insights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="players" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
            >
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Player Stats</span>
              <span className="sm:hidden">Players</span>
            </TabsTrigger>
            <TabsTrigger 
              value="teams" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Team Stats</span>
              <span className="sm:hidden">Teams</span>
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">AI Performance</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
          </TabsList>

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