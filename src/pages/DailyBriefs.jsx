import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Newspaper, Star, TrendingUp, Cloudy } from "lucide-react";
import { usePlatform } from "@/components/hooks/usePlatform";


const BriefSection = ({ title, icon, children }) => (
  <div className="mb-6">
    <h3 className="text-xl font-bold text-slate-800 flex items-center mb-3">
      {icon}
      <span className="ml-2">{title}</span>
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const PickCard = ({ pick }) => (
  <Card className="bg-white">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-slate-900">{pick.pick}</p>
          <p className="text-sm text-slate-600">{pick.match} ({pick.sport})</p>
        </div>
        <Badge variant="outline">{pick.odds}</Badge>
      </div>
      <div className="flex items-center gap-2 mt-2">
         <Badge className={
            pick.confidence === 'High' ? 'bg-green-100 text-green-800' :
            pick.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
         }>
            {pick.confidence} Confidence
         </Badge>
      </div>
      <p className="text-sm text-slate-500 mt-3">{pick.reasoning}</p>
    </CardContent>
  </Card>
);


export default function DailyBriefsPage() {
  const { isDesktop } = usePlatform();

  const { data: briefs, isLoading, error } = useQuery({
    queryKey: ["bettingBriefs"],
    queryFn: () => base44.entities.BettingBrief.list("-brief_date", 10), // Get latest 10
    enabled: isDesktop, // Only fetch data on the web
  });

  if (!isDesktop) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-100 text-center p-8">
        <Newspaper className="w-16 h-16 text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Feature Not Available</h1>
        <p className="text-slate-600 mt-2">
          Daily Briefs are exclusively available on our website for a more detailed reading experience.
        </p>
      </div>
    );
  }

  const brief = briefs?.[0]; // Show the most recent brief

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-black text-slate-900">Daily Betting Briefs</h1>
          <p className="text-lg text-slate-600">Your AI-powered morning digest of the betting landscape.</p>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="font-bold">Error loading briefs</p>
                <p>{error.message}</p>
              </div>
            </div>
          </div>
        )}
        
        {brief && (
          <Card className="shadow-lg border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">{brief.title}</CardTitle>
              <p className="text-sm text-slate-500">
                {new Date(brief.brief_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-base text-slate-700 mb-8 p-4 bg-slate-100 rounded-lg">{brief.summary}</p>

              <BriefSection title="Top AI Picks" icon={<Star className="w-6 h-6 text-yellow-500" />}>
                {brief.top_picks?.map((pick, i) => <PickCard key={i} pick={pick} />)}
              </BriefSection>

              <BriefSection title="Significant Line Movements" icon={<TrendingUp className="w-6 h-6 text-blue-500" />}>
                {brief.line_movements?.map((move, i) => (
                  <Card key={i} className="bg-white"><CardContent className="p-4">
                    <p className="font-bold">{move.match}</p>
                    <p className="text-sm text-slate-600">{move.movement}</p>
                    <p className="text-sm text-slate-500 mt-1">{move.significance}</p>
                  </CardContent></Card>
                ))}
              </BriefSection>

              <BriefSection title="Key Injury Updates" icon={<AlertTriangle className="w-6 h-6 text-red-500" />}>
                 {brief.injury_updates?.map((injury, i) => (
                  <Card key={i} className="bg-white"><CardContent className="p-4">
                    <p className="font-bold">{injury.player} ({injury.team})</p>
                    <p className="text-sm text-slate-600">{injury.injury}</p>
                    <p className="text-sm text-slate-500 mt-1">{injury.impact}</p>
                  </CardContent></Card>
                ))}
              </BriefSection>
              
               <BriefSection title="Weather Alerts" icon={<Cloudy className="w-6 h-6 text-gray-500" />}>
                 {brief.weather_alerts?.map((weather, i) => (
                  <Card key={i} className="bg-white"><CardContent className="p-4">
                    <p className="font-bold">{weather.match}</p>
                    <p className="text-sm text-slate-600">{weather.conditions}</p>
                    <p className="text-sm text-slate-500 mt-1">{weather.impact}</p>
                  </CardContent></Card>
                ))}
              </BriefSection>
            </CardContent>
          </Card>
          )}
          </div>
          </div>
  );
}