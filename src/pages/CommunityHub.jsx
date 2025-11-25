import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, BookOpen, Sparkles } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";

import BettingBriefsContent from "@/components/hub/BettingBriefsContent";
import LearningCenterContent from "@/components/hub/LearningCenterContent";
import CommunityContent from "@/components/hub/CommunityContent";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";

function CommunityHubPage() {
  const [activeTab, setActiveTab] = useState("feeds");

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            💬 COMMUNITY & LEARNING
          </h1>
          <p className="text-white/70 text-lg">Daily briefs, educational content, and community picks</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-black/40 backdrop-blur-sm p-2 rounded-xl border border-white/10">
            <TabsTrigger 
              value="feeds" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Daily Feeds</span>
              <span className="sm:hidden">Feeds</span>
            </TabsTrigger>
            <TabsTrigger 
              value="learning" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Learning Center</span>
              <span className="sm:hidden">Learn</span>
            </TabsTrigger>
            <TabsTrigger 
              value="community" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feeds">
            <BettingBriefsContent />
          </TabsContent>

          <TabsContent value="learning">
            <LearningCenterContent />
          </TabsContent>

          <TabsContent value="community">
            <CommunityContent />
          </TabsContent>
        </Tabs>
      </div>
      <FloatingDashboardButton />
    </div>
  );
}

export default function CommunityHub() {
  return (
    <RequireAuth pageName="Community & Learning">
      <CommunityHubPage />
    </RequireAuth>
  );
}