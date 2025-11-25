import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, BookOpen, Sparkles } from "lucide-react";
import RequireAuth from "../components/auth/RequireAuth";

import BettingBriefsContent from "../components/hub/BettingBriefsContent";
import LearningCenterContent from "../components/hub/LearningCenterContent";
import CommunityContent from "../components/hub/CommunityContent";

function CommunityHubPage() {
  const [activeTab, setActiveTab] = useState("feeds");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Community & Learning</h1>
          <p className="text-gray-600 text-lg">Daily briefs, educational content, and community picks</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white p-2 rounded-xl shadow-md">
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