import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Target,
  Heart,
  Wind,
  Sparkles,
  Crown,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

export default function BettingBriefs() {
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

  const isVIPorLegacy = currentUser?.subscription_type === 'vip_annual' || currentUser?.subscription_type === 'legacy';

  const { data: todaysBrief, isLoading, error } = useQuery({
    queryKey: ['todaysBrief'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const briefs = await base44.entities.BettingBrief.filter({ brief_date: today });
      return briefs.length > 0 ? briefs[0] : null;
    },
    enabled: isVIPorLegacy,
  });

  if (!isVIPorLegacy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">VIP Exclusive Feature</h2>
              <p className="text-xl text-gray-700 mb-6">
                Daily Betting Briefs are exclusively available to VIP Annual and Legacy members
              </p>
              <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">What You Get with Daily Briefs:</h3>
                <ul className="text-left space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span>AI-curated top 3-5 betting picks every day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    <span>Critical injury updates and their betting impact</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Sharp money indicators and line movement analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Wind className="w-5 h-5 text-blue-600" />
                    <span>Weather alerts for outdoor games</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    <span>Market insights and betting trends</span>
                  </li>
                </ul>
              </div>
              <a
                href="/Pricing"
                className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg transition-all"
              >
                <Crown className="w-5 h-5 inline mr-2" />
                Upgrade to VIP Annual - $149.99/year
              </a>
              <p className="text-sm text-gray-600 mt-4">Save 37% vs Premium Monthly + Get Daily Briefs</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-white font-medium">Loading today's brief...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !todaysBrief) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              <strong>No brief available for today yet.</strong><br />
              Our AI is working on generating today's betting insights. Please check back later or contact support if this persists.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const confidenceColors = {
    high: "bg-green-500",
    medium: "bg-yellow-500",
    low: "bg-orange-500"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-10 h-10 text-purple-400" />
            <div>
              <h1 className="text-4xl font-black text-white">{todaysBrief.title}</h1>
              <p className="text-gray-400 flex items-center gap-2 mt-1">
                <Badge className="bg-purple-600">VIP Exclusive</Badge>
                <span>{new Date(todaysBrief.brief_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="mb-8 border-2 border-purple-500/30 bg-slate-800/50">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600">
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-lg text-gray-300 leading-relaxed">{todaysBrief.summary}</p>
          </CardContent>
        </Card>

        {/* Top Picks */}
        {todaysBrief.top_picks && todaysBrief.top_picks.length > 0 && (
          <Card className="mb-8 border-2 border-green-500/30 bg-slate-800/50">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-6 h-6" />
                Top Picks of the Day
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4">
                {todaysBrief.top_picks.map((pick, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-900/50 rounded-lg p-5 border border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-600">#{idx + 1}</Badge>
                          <Badge variant="outline">{pick.sport}</Badge>
                          <Badge className={confidenceColors[pick.confidence?.toLowerCase()] || 'bg-gray-500'}>
                            {pick.confidence} Confidence
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-white">{pick.match}</h3>
                      </div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-4 mb-3 border border-green-500/30">
                      <div className="text-2xl font-black text-green-400 mb-1">{pick.pick}</div>
                      <div className="text-lg text-green-300">Odds: {pick.odds}</div>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{pick.reasoning}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Injury Updates */}
        {todaysBrief.injury_updates && todaysBrief.injury_updates.length > 0 && (
          <Card className="mb-8 border-2 border-red-500/30 bg-slate-800/50">
            <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Heart className="w-6 h-6" />
                Key Injury Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                {todaysBrief.injury_updates.map((injury, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-white">{injury.player}</h4>
                      <Badge className={
                        injury.impact === 'High' ? 'bg-red-500' :
                        injury.impact === 'Medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }>
                        {injury.impact} Impact
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{injury.team}</p>
                    <p className="text-gray-300">{injury.injury}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line Movements */}
        {todaysBrief.line_movements && todaysBrief.line_movements.length > 0 && (
          <Card className="mb-8 border-2 border-orange-500/30 bg-slate-800/50">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-yellow-600">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Significant Line Movements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {todaysBrief.line_movements.map((movement, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="font-bold text-white mb-1">{movement.match}</h4>
                    <p className="text-orange-400 font-semibold mb-1">{movement.movement}</p>
                    <p className="text-sm text-gray-300">{movement.significance}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sharp Money Indicators */}
        {todaysBrief.sharp_money_indicators && todaysBrief.sharp_money_indicators.length > 0 && (
          <Card className="mb-8 border-2 border-blue-500/30 bg-slate-800/50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Sharp Money Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-2">
                {todaysBrief.sharp_money_indicators.map((indicator, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-300">
                    <span className="text-blue-400 mt-1">💰</span>
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Weather Alerts */}
        {todaysBrief.weather_alerts && todaysBrief.weather_alerts.length > 0 && (
          <Card className="border-2 border-cyan-500/30 bg-slate-800/50">
            <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600">
              <CardTitle className="text-white flex items-center gap-2">
                <Wind className="w-6 h-6" />
                Weather Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {todaysBrief.weather_alerts.map((alert, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="font-bold text-white mb-1">{alert.match}</h4>
                    <p className="text-cyan-400 font-semibold mb-1">{alert.conditions}</p>
                    <p className="text-sm text-gray-300">{alert.impact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-6 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl">
          <p className="text-sm text-amber-200 text-center">
            <strong>⚠️ Responsible Gambling:</strong> These briefs are for informational purposes only. 
            Always gamble responsibly and never bet more than you can afford to lose.
          </p>
        </div>
      </div>
    </div>
  );
}