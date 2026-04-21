import { useState, useEffect, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Target, Brain, Loader2, ArrowLeft, Swords, BarChart3, Settings2, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import RequireAuth from "@/components/auth/RequireAuth";
import { usePlatform } from "@/components/hooks/usePlatform";

// Lazy load heavy content components
const MyInsightsContent     = lazy(() => import("@/components/hub/MyInsightsContent"));
const AIPerformanceContent  = lazy(() => import("@/components/hub/AIPerformanceContent"));
const TodaysPredictions     = lazy(() => import("@/components/predictions/TodaysPredictions"));
const MatchPreviewsContent  = lazy(() => import("@/components/analysis/MatchPreviewsContent"));
const HistoricalDataContent = lazy(() => import("@/components/analysis/HistoricalDataContent"));
const StrategyToolsContent  = lazy(() => import("@/components/analysis/StrategyToolsContent"));
const DataExportContent     = lazy(() => import("@/components/analysis/DataExportContent"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
  </div>
);

function AnalysisHubContent() {
  const [activeTab, setActiveTab] = useState("predictions");
  const { isNativeApp, isMobileScreen } = usePlatform();
  const isWeb = !isNativeApp && !isMobileScreen;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    // On mobile, 'players' and 'teams' are their own pages — redirect to predictions
    const mobileValidTabs = ['predictions', 'insights', 'performance'];
    const webValidTabs    = [...mobileValidTabs, 'matchpreview', 'historical', 'strategy', 'export'];
    const validTabs = isWeb ? webValidTabs : mobileValidTabs;
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [isWeb]);

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

        <div className="mb-6 bg-black/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            ⚡ ANALYSIS HUB
          </h1>
          <p className="text-white/70 text-base md:text-lg">AI-powered sports analytics and performance insights</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                value="performance"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Target className="w-4 h-4 flex-shrink-0" />
                <span>Stats</span>
              </TabsTrigger>

              {/* Web-only tabs */}
              {isWeb && (
                <>
                  <TabsTrigger
                    value="matchpreview"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Swords className="w-4 h-4 flex-shrink-0" />
                    <span>Match Preview</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="historical"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <BarChart3 className="w-4 h-4 flex-shrink-0" />
                    <span>Historical</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="strategy"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Settings2 className="w-4 h-4 flex-shrink-0" />
                    <span>Strategy Tools</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="export"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white text-white/70 text-xs py-2.5 px-3 min-h-[40px] flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 flex-shrink-0" />
                    <span>Data Export</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <TabsContent value="predictions">
            <Suspense fallback={<LoadingSpinner />}><TodaysPredictions /></Suspense>
          </TabsContent>
          <TabsContent value="insights">
            <Suspense fallback={<LoadingSpinner />}><MyInsightsContent /></Suspense>
          </TabsContent>
          <TabsContent value="performance">
            <Suspense fallback={<LoadingSpinner />}><AIPerformanceContent /></Suspense>
          </TabsContent>

          {isWeb && (
            <>
              <TabsContent value="matchpreview">
                <Suspense fallback={<LoadingSpinner />}><MatchPreviewsContent /></Suspense>
              </TabsContent>
              <TabsContent value="historical">
                <Suspense fallback={<LoadingSpinner />}><HistoricalDataContent /></Suspense>
              </TabsContent>
              <TabsContent value="strategy">
                <Suspense fallback={<LoadingSpinner />}><StrategyToolsContent /></Suspense>
              </TabsContent>
              <TabsContent value="export">
                <Suspense fallback={<LoadingSpinner />}><DataExportContent /></Suspense>
              </TabsContent>
            </>
          )}
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
