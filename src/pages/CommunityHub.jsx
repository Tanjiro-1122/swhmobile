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
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 md:px-6">
        {/* Header - iPad optimized */}
        <div className="mb-6 md:mb-8 bg-black/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            💬 COMMUNITY & LEARNING
          </h1>
          <p className="text-white/70 text-base md:text-lg">Daily briefs, educational content, and community picks</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1.5 md:gap-2 mb-6 md:mb-8 bg-black/40 backdrop-blur-sm p-2 md:p-3 rounded-xl border border-white/10 h-auto min-h-[56px]">
            <TabsTrigger 
              value="feeds" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs md:text-sm py-2.5 md:py-3 px-2 md:px-4 min-h-[44px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Feeds</span>
            </TabsTrigger>
            <TabsTrigger 
              value="learning" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-xs md:text-sm py-2.5 md:py-3 px-2 md:px-4 min-h-[44px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span>Learn</span>
            </TabsTrigger>
            <TabsTrigger 
              value="community" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-xs md:text-sm py-2.5 md:py-3 px-2 md:px-4 min-h-[44px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span>Community</span>
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