import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Zap, Target, Star, RefreshCw, Bookmark } from "lucide-react";
import { motion } from "framer-motion";

const sportOptions = [
  { value: "nba", label: "NBA Basketball" },
  { value: "nfl", label: "NFL Football" },
  { value: "mlb", label: "MLB Baseball" },
  { value: "nhl", label: "NHL Hockey" },
  { value: "soccer", label: "Soccer" },
];

export default function ValueBetFinderContent() {
  const [selectedSport, setSelectedSport] = useState("nba");
  const [isSearching, setIsSearching] = useState(false);
  const [valueBets, setValueBets] = useState([]);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: savedOdds = [] } = useQuery({
    queryKey: ['savedOdds', currentUser?.email],
    queryFn: () => base44.entities.SavedOdds.filter({ created_by: currentUser?.email }),
    enabled: !!currentUser?.email,
  });

  const saveBetMutation = useMutation({
    mutationFn: (bet) => base44.entities.SavedOdds.create({
      match_description: bet.match,
      sport: bet.sport,
      bet_type: bet.bet_type,
      market_description: bet.pick,
      current_odds: bet.odds,
      best_available_odds: bet.odds,
      best_sportsbook: bet.sportsbook,
      is_value_bet: true,
      value_score: bet.value_score,
      ai_analysis: {
        recommendation: bet.recommendation,
        confidence: bet.confidence,
        reasoning: bet.reasoning,
        expected_value: bet.expected_value
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedOdds'] });
    }
  });

  const findValueBets = async () => {
    setIsSearching(true);
    setValueBets([]);

    try {
      const sportLabel = sportOptions.find(s => s.value === selectedSport)?.label || selectedSport;
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a sports betting analyst AI. Find 5 potential VALUE BETS for ${sportLabel} games happening in the next 3 days.

A value bet is when the true probability of an outcome is higher than what the odds suggest.

For each value bet, provide:
1. The match/game
2. The specific pick (team, spread, or over/under)
3. Realistic American odds (like -110, +150, etc.)
4. The sportsbook offering these odds
5. Your estimated true win probability (as percentage)
6. The implied probability from odds
7. Expected value percentage
8. A value score from 1-100
9. Confidence level (Low, Medium, High)
10. Brief reasoning (2-3 sentences)

Focus on realistic, actionable picks with positive expected value.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            value_bets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  match: { type: "string" },
                  pick: { type: "string" },
                  bet_type: { type: "string" },
                  odds: { type: "number" },
                  sportsbook: { type: "string" },
                  true_probability: { type: "number" },
                  implied_probability: { type: "number" },
                  expected_value: { type: "number" },
                  value_score: { type: "number" },
                  confidence: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (response?.value_bets) {
        setValueBets(response.value_bets.map(bet => ({
          ...bet,
          sport: selectedSport,
          recommendation: bet.value_score >= 70 ? "strong_buy" : bet.value_score >= 50 ? "buy" : "hold"
        })));
      }
    } catch (error) {
      console.error("Error finding value bets:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getValueScoreColor = (score) => {
    if (score >= 80) return "from-emerald-500 to-green-600";
    if (score >= 60) return "from-blue-500 to-cyan-600";
    if (score >= 40) return "from-yellow-500 to-orange-500";
    return "from-gray-500 to-gray-600";
  };

  const getConfidenceBadge = (confidence) => {
    const colors = {
      High: "bg-green-500/20 text-green-400 border-green-500/30",
      Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Low: "bg-red-500/20 text-red-400 border-red-500/30"
    };
    return colors[confidence] || colors.Medium;
  };

  const isBetSaved = (bet) => {
    return savedOdds.some(s => 
      s.match_description === bet.match && 
      s.market_description === bet.pick
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            AI Value Bet Finder
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Find bets where AI analysis suggests better odds than sportsbooks offer
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card className="border-2 border-white/20 bg-black/40 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select Sport" />
              </SelectTrigger>
              <SelectContent>
                {sportOptions.map(sport => (
                  <SelectItem key={sport.value} value={sport.value}>
                    {sport.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={findValueBets}
              disabled={isSearching}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Odds...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Find Value Bets
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 relative mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-yellow-500/30 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-white font-semibold">Analyzing odds across sportsbooks...</p>
          <p className="text-white/60 text-sm">Finding value opportunities</p>
        </div>
      )}

      {!isSearching && valueBets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              Found {valueBets.length} Value Bets
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={findValueBets}
              className="text-white/60 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {valueBets.map((bet, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-2 border-white/20 bg-black/40 backdrop-blur-sm overflow-hidden hover:border-yellow-500/50 transition-all">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Value Score */}
                    <div className={`lg:w-32 p-4 bg-gradient-to-br ${getValueScoreColor(bet.value_score)} flex flex-col items-center justify-center`}>
                      <div className="text-4xl font-black text-white">{bet.value_score}</div>
                      <div className="text-xs text-white/80 font-semibold">VALUE SCORE</div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getConfidenceBadge(bet.confidence)}>
                              {bet.confidence} Confidence
                            </Badge>
                            <Badge className="bg-white/10 text-white/80 border-white/20">
                              {bet.bet_type}
                            </Badge>
                          </div>
                          <h4 className="text-lg font-bold text-white">{bet.match}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-bold">{bet.pick}</span>
                            <span className="text-white/60">@</span>
                            <span className="text-emerald-400 font-bold">
                              {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                            </span>
                          </div>
                          <p className="text-white/50 text-sm mt-1">{bet.sportsbook}</p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => saveBetMutation.mutate(bet)}
                          disabled={isBetSaved(bet) || saveBetMutation.isPending}
                          className={isBetSaved(bet) 
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" 
                            : "border-white/30 text-white hover:bg-white/10"
                          }
                        >
                          <Bookmark className="w-4 h-4 mr-1" />
                          {isBetSaved(bet) ? "Saved" : "Save"}
                        </Button>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-white/5 rounded-lg">
                        <div className="text-center">
                          <div className="text-xs text-white/50">True Prob</div>
                          <div className="text-lg font-bold text-emerald-400">{bet.true_probability}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-white/50">Implied Prob</div>
                          <div className="text-lg font-bold text-white/80">{bet.implied_probability}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-white/50">Expected Value</div>
                          <div className={`text-lg font-bold ${bet.expected_value > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {bet.expected_value > 0 ? '+' : ''}{bet.expected_value}%
                          </div>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div className="mt-3 p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-semibold text-white/70">AI Analysis</span>
                        </div>
                        <p className="text-white/80 text-sm">{bet.reasoning}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!isSearching && valueBets.length === 0 && (
        <Card className="border-2 border-dashed border-white/20 bg-black/20">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-white/30" />
            <h3 className="text-xl font-bold text-white mb-2">Find Value Bets</h3>
            <p className="text-white/60 max-w-md mx-auto">
              Select a sport and click "Find Value Bets" to discover opportunities where 
              AI analysis suggests better winning chances than the odds imply.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p className="text-amber-200 text-xs text-center">
          ⚠️ Value bets are AI-generated suggestions for informational purposes only. 
          Always do your own research and bet responsibly.
        </p>
      </div>
    </div>
  );
}