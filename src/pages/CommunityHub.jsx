import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, BookOpen, Sparkles, Loader2 } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";


// Lazy load content components
const BettingBriefsContent = lazy(() => import("@/components/hub/BettingBriefsContent"));
const LearningCenterContent = lazy(() => import("@/components/hub/LearningCenterContent"));
const CommunityContent = lazy(() => import("@/components/hub/CommunityContent"));

// Loading fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
  </div>
);

function CommunityHubPage() {
  const [activeTab, setActiveTab] = useState("feeds");

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header - 8-point grid: 24px bottom margin, 16/24px padding */}
        <div className="mb-6 bg-black/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            💬 COMMUNITY & LEARNING
          </h1>
          <p className="text-white/70 text-base md:text-lg">Daily briefs, educational content, and community picks</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Horizontally scrollable tabs */}
          <div className="mb-6 -mx-4 px-4 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <TabsList className="inline-flex w-max min-w-full gap-1 bg-black/40 backdrop-blur-sm p-1.5 rounded-xl border border-white/10">
              <TabsTrigger 
                value="feeds" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>Feeds</span>
              </TabsTrigger>
              <TabsTrigger 
                value="learning" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span>Learn</span>
              </TabsTrigger>
              <TabsTrigger 
                value="community" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span>Community</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feeds">
            <Suspense fallback={<LoadingSpinner />}>
              <BettingBriefsContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="learning">
            <Suspense fallback={<LoadingSpinner />}>
              <LearningCenterContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="community">
            <Suspense fallback={<LoadingSpinner />}>
              <CommunityContent />
            </Suspense>
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