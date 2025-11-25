import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Lock, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ODDS_API_KEY = "224417b8b53239d049559bbba6ba98ff";

export default function LiveOddsContent() {
  const [selectedSport, setSelectedSport] = useState("basketball_nba");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const hasAccess = currentUser?.subscription_type === 'legacy' || currentUser?.subscription_type === 'vip_annual';

  const sportOptions = [
    { key: "basketball_nba", label: "NBA" },
    { key: "americanfootball_nfl", label: "NFL" },
    { key: "baseball_mlb", label: "MLB" },
    { key: "icehockey_nhl", label: "NHL" },
    { key: "soccer_usa_mls", label: "MLS" },
  ];

  if (!hasAccess) {
    return (
      <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3">
            🔒 VIP Feature
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Live odds comparison is an exclusive feature for <strong>Legacy</strong> and <strong>VIP Annual</strong> members.
            Upgrade to get real-time odds from top sportsbooks!
          </p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">Includes: DraftKings, FanDuel, BetMGM & more</span>
          </div>
          <Link to={createPageUrl("Pricing")}>
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold px-8 py-6 text-lg">
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to VIP
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="w-6 h-6 text-yellow-500" />
        <p className="text-white/80 font-semibold">
          VIP Access • Live odds from top sportsbooks
        </p>
      </div>

      <Tabs value={selectedSport} onValueChange={setSelectedSport}>
        <TabsList className="bg-black/40 p-1 border border-white/20">
          {sportOptions.map((sport) => (
            <TabsTrigger 
              key={sport.key} 
              value={sport.key} 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-white/70"
            >
              {sport.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {sportOptions.map((sport) => (
          <TabsContent key={sport.key} value={sport.key} className="mt-4">
            <Card className="border-2 border-white/20 bg-black/40 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <iframe
                  title={`${sport.label} Odds Widget`}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  src={`https://widget.the-odds-api.com/v1/sports/${sport.key}/events/?accessKey=${ODDS_API_KEY}&bookmakerKeys=draftkings,fanduel,betmgm,pointsbet,caesars&oddsFormat=american&markets=h2h,spreads,totals&marketNames=h2h:Moneyline,spreads:Spreads,totals:Over/Under`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}