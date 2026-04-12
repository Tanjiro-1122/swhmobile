import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Brain, DollarSign, Target, Shield, Zap, AlertTriangle, Calculator } from "lucide-react";
import { motion } from "framer-motion";

export default function StrategyToolsContent() {
  const [activeSection, setActiveSection] = useState("strategy");

  return (
    <div className="space-y-6">
      {/* Section Selector */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "strategy", label: "AI Strategy Builder", icon: Brain },
          { id: "bankroll", label: "Bankroll Calculator", icon: DollarSign },
          { id: "value", label: "Value Bet Finder", icon: Target },
        ].map(s => (
          <Button
            key={s.id}
            variant={activeSection === s.id ? "default" : "outline"}
            onClick={() => setActiveSection(s.id)}
            className={activeSection === s.id 
              ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0" 
              : "border-slate-600 text-slate-300 hover:bg-slate-700"}
          >
            <s.icon className="w-4 h-4 mr-2" />{s.label}
          </Button>
        ))}
      </div>

      {activeSection === "strategy" && <StrategyBuilder />}
      {activeSection === "bankroll" && <BankrollCalculator />}
      {activeSection === "value" && <ValueBetFinder />}
    </div>
  );
}

function StrategyBuilder() {
  const [riskProfile, setRiskProfile] = useState("moderate");
  const [sports, setSports] = useState([]);
  const [bankroll, setBankroll] = useState("1000");
  const [goals, setGoals] = useState("steady_growth");
  const [result, setResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    setResult(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional sports betting strategy advisor. Create a PERSONALIZED betting strategy based on:

Risk Profile: ${riskProfile}
Sports Focus: ${sports.length > 0 ? sports.join(', ') : 'All sports'}
Bankroll: $${bankroll}
Goal: ${goals}

Provide:
1. A personalized strategy name
2. Unit size recommendation (% of bankroll per bet)
3. Maximum daily bets
4. Bet types to focus on (moneyline, spread, totals, props)
5. When to increase/decrease bet size
6. Bankroll management rules (stop-loss, take-profit)
7. Sports-specific tips
8. Common mistakes to avoid
9. Weekly review checklist`,
      response_json_schema: {
        type: "object",
        properties: {
          strategy_name: { type: "string" },
          unit_size_percent: { type: "number" },
          unit_size_dollars: { type: "number" },
          max_daily_bets: { type: "number" },
          recommended_bet_types: { type: "array", items: { type: "object", properties: { type: { type: "string" }, description: { type: "string" }, priority: { type: "string" } } } },
          sizing_rules: { type: "array", items: { type: "object", properties: { condition: { type: "string" }, action: { type: "string" } } } },
          bankroll_rules: { type: "object", properties: { daily_stop_loss: { type: "string" }, weekly_stop_loss: { type: "string" }, take_profit: { type: "string" }, cool_down_rule: { type: "string" } } },
          sport_tips: { type: "array", items: { type: "object", properties: { sport: { type: "string" }, tip: { type: "string" } } } },
          mistakes_to_avoid: { type: "array", items: { type: "string" } },
          weekly_checklist: { type: "array", items: { type: "string" } }
        }
      }
    });
    setResult(res);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/70 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><Brain className="w-5 h-5 text-purple-400" /> Build Your Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Risk Profile</Label>
              <Select value={riskProfile} onValueChange={setRiskProfile}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative"><Shield className="w-3 h-3 inline mr-1" />Conservative</SelectItem>
                  <SelectItem value="moderate"><Target className="w-3 h-3 inline mr-1" />Moderate</SelectItem>
                  <SelectItem value="aggressive"><Zap className="w-3 h-3 inline mr-1" />Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Bankroll ($)</Label>
              <Input type="number" value={bankroll} onChange={e => setBankroll(e.target.value)} className="bg-slate-700/50 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Goal</Label>
              <Select value={goals} onValueChange={setGoals}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="steady_growth">Steady Growth</SelectItem>
                  <SelectItem value="aggressive_growth">Aggressive Growth</SelectItem>
                  <SelectItem value="preserve_capital">Preserve Capital</SelectItem>
                  <SelectItem value="maximize_fun">Maximize Entertainment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Primary Sports</Label>
              <Select value={sports[0] || ""} onValueChange={v => setSports([v])}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white"><SelectValue placeholder="All Sports" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NBA">NBA</SelectItem>
                  <SelectItem value="NFL">NFL</SelectItem>
                  <SelectItem value="MLB">MLB</SelectItem>
                  <SelectItem value="NHL">NHL</SelectItem>
                  <SelectItem value="Soccer">Soccer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generate} disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold">
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating Strategy...</> : <><Brain className="w-4 h-4 mr-2" />Generate My Strategy</>}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white text-xl">{result.strategy_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Numbers */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/70 rounded-lg p-3 text-center">
                  <p className="text-2xl font-black text-cyan-400">{result.unit_size_percent}%</p>
                  <p className="text-xs text-slate-400">Unit Size</p>
                  <p className="text-xs text-slate-500">${result.unit_size_dollars}/bet</p>
                </div>
                <div className="bg-slate-800/70 rounded-lg p-3 text-center">
                  <p className="text-2xl font-black text-purple-400">{result.max_daily_bets}</p>
                  <p className="text-xs text-slate-400">Max Daily Bets</p>
                </div>
                <div className="bg-slate-800/70 rounded-lg p-3 text-center">
                  <p className="text-2xl font-black text-amber-400">${bankroll}</p>
                  <p className="text-xs text-slate-400">Starting Bankroll</p>
                </div>
              </div>

              {/* Bet Types */}
              {result.recommended_bet_types?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Recommended Bet Types</h4>
                  {result.recommended_bet_types.map((bt, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3 mb-2">
                      <Badge className={bt.priority === "High" ? "bg-green-500/20 text-green-400" : bt.priority === "Medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-600 text-slate-300"}>{bt.priority}</Badge>
                      <div>
                        <p className="text-sm font-bold text-white">{bt.type}</p>
                        <p className="text-xs text-slate-400">{bt.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bankroll Rules */}
              {result.bankroll_rules && (
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Bankroll Rules</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(result.bankroll_rules).map(([key, val]) => (
                      <div key={key} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                        <p className="text-xs text-red-400 font-bold">{key.replace(/_/g, ' ').toUpperCase()}</p>
                        <p className="text-sm text-white mt-1">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mistakes to Avoid */}
              {result.mistakes_to_avoid?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-400" />Avoid These Mistakes</h4>
                  <div className="space-y-1">
                    {result.mistakes_to_avoid.map((m, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-amber-400 mt-0.5">•</span>{m}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function BankrollCalculator() {
  const [bankroll, setBankroll] = useState(1000);
  const [unitPct, setUnitPct] = useState([2]);
  const [odds, setOdds] = useState("-110");
  const [confidence, setConfidence] = useState([65]);

  const unitSize = bankroll * (unitPct[0] / 100);
  const americanOdds = parseInt(odds) || -110;
  const decimalOdds = americanOdds > 0 ? (americanOdds / 100) + 1 : (100 / Math.abs(americanOdds)) + 1;
  const impliedProb = americanOdds > 0 ? 100 / (americanOdds + 100) : Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  const potentialProfit = unitSize * (decimalOdds - 1);
  const ev = (confidence[0] / 100 * potentialProfit) - ((1 - confidence[0] / 100) * unitSize);
  const kellyPct = ((confidence[0] / 100) * (decimalOdds - 1) - (1 - confidence[0] / 100)) / (decimalOdds - 1);

  return (
    <Card className="bg-slate-800/70 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2"><Calculator className="w-5 h-5 text-green-400" /> Bankroll Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Total Bankroll ($)</Label>
            <Input type="number" value={bankroll} onChange={e => setBankroll(Number(e.target.value))} className="bg-slate-700/50 border-slate-600 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Odds (American)</Label>
            <Input value={odds} onChange={e => setOdds(e.target.value)} className="bg-slate-700/50 border-slate-600 text-white" placeholder="-110" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Unit Size: {unitPct[0]}% (${unitSize.toFixed(2)})</Label>
            <Slider value={unitPct} onValueChange={setUnitPct} min={1} max={10} step={0.5} className="mt-2" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Your Confidence: {confidence[0]}%</Label>
            <Slider value={confidence} onValueChange={setConfidence} min={40} max={95} step={1} className="mt-2" />
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-xl font-black text-white">${unitSize.toFixed(2)}</p>
            <p className="text-xs text-slate-400">Bet Size</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-xl font-black text-green-400">${potentialProfit.toFixed(2)}</p>
            <p className="text-xs text-slate-400">Potential Profit</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className={`text-xl font-black ${ev > 0 ? 'text-green-400' : 'text-red-400'}`}>${ev.toFixed(2)}</p>
            <p className="text-xs text-slate-400">Expected Value</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className={`text-xl font-black ${kellyPct > 0 ? 'text-cyan-400' : 'text-red-400'}`}>{(kellyPct * 100).toFixed(1)}%</p>
            <p className="text-xs text-slate-400">Kelly Criterion</p>
          </div>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-3 text-xs text-slate-400">
          <p><strong>Implied Probability:</strong> {(impliedProb * 100).toFixed(1)}% | <strong>Decimal Odds:</strong> {decimalOdds.toFixed(2)} | <strong>EV Positive:</strong> {ev > 0 ? '✅ Yes' : '❌ No'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ValueBetFinder() {
  const [sport, setSport] = useState("nba");
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const findValue = async () => {
    setIsSearching(true);
    setResults(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sharp sports bettor looking for VALUE BETS in ${sport.toUpperCase()} today (${new Date().toLocaleDateString()}).

Search for today's games and upcoming games. For each game, identify bets where the implied probability from odds is LOWER than your estimated true probability.

Find 3-5 value bets with:
- The specific bet (team, spread, total, or player prop)
- Current odds
- Implied probability from odds
- Your estimated true probability
- The edge (difference)
- Brief reasoning

Only suggest bets with a clear statistical edge.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          value_bets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                bet_description: { type: "string" },
                odds: { type: "string" },
                implied_probability: { type: "number" },
                estimated_probability: { type: "number" },
                edge: { type: "number" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              }
            }
          },
          market_notes: { type: "string" }
        }
      }
    });
    setResults(res);
    setIsSearching(false);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/70 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><Target className="w-5 h-5 text-green-400" /> AI Value Bet Finder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nba">NBA</SelectItem>
                <SelectItem value="nfl">NFL</SelectItem>
                <SelectItem value="mlb">MLB</SelectItem>
                <SelectItem value="nhl">NHL</SelectItem>
                <SelectItem value="soccer">Soccer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={findValue} disabled={isSearching} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold flex-1">
              {isSearching ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Scanning Markets...</> : <><Target className="w-4 h-4 mr-2" />Find Value Bets</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results?.value_bets?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {results.market_notes && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">{results.market_notes}</div>
          )}
          {results.value_bets.map((bet, i) => (
            <Card key={i} className="bg-slate-800/70 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-bold text-white">{bet.bet_description}</p>
                  <Badge className={`border ${bet.confidence === "High" ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"}`}>{bet.confidence}</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="text-center"><p className="text-sm font-bold text-white">{bet.odds}</p><p className="text-[10px] text-slate-500">Odds</p></div>
                  <div className="text-center"><p className="text-sm font-bold text-slate-300">{bet.implied_probability}%</p><p className="text-[10px] text-slate-500">Implied</p></div>
                  <div className="text-center"><p className="text-sm font-bold text-cyan-400">{bet.estimated_probability}%</p><p className="text-[10px] text-slate-500">True Prob</p></div>
                  <div className="text-center"><p className="text-sm font-bold text-green-400">+{bet.edge}%</p><p className="text-[10px] text-slate-500">Edge</p></div>
                </div>
                <p className="text-xs text-slate-400">{bet.reasoning}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
}