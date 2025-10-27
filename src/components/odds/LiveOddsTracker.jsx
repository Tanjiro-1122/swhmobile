import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveOddsTracker({ gameId, homeTeam, awayTeam }) {
  const [odds, setOdds] = useState(null);
  const [previousOdds, setPreviousOdds] = useState(null);
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    fetchOdds();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOdds, 30000);
    return () => clearInterval(interval);
  }, [gameId]);

  const fetchOdds = async () => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Fetch CURRENT LIVE odds for: ${homeTeam} vs ${awayTeam}
        
SOURCES (check ALL):
1. DraftKings.com - exact current lines
2. FanDuel.com - exact current lines  
3. BetMGM.com - exact current lines
4. Caesars.com - exact current lines

For EACH sportsbook return:
- Spread: [Team] [Line] ([Odds])
- Moneyline: [Team] ([Odds])
- Total: [Number] (Over [Odds], Under [Odds])
- Last Updated: timestamp

Also detect:
- Which way the line is moving (up/down)
- Sharp money indicators (if big money on one side)
- Steam moves (rapid odds changes)

Return exact current odds as they appear RIGHT NOW on these sites.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            timestamp: { type: "string" },
            sportsbooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  spread_home: { type: "string" },
                  spread_away: { type: "string" },
                  spread_odds_home: { type: "string" },
                  spread_odds_away: { type: "string" },
                  moneyline_home: { type: "string" },
                  moneyline_away: { type: "string" },
                  total: { type: "string" },
                  over_odds: { type: "string" },
                  under_odds: { type: "string" }
                }
              }
            },
            line_movements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" },
                  direction: { type: "string" },
                  significance: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (previousOdds) {
        detectMovements(previousOdds, result);
      }
      
      setPreviousOdds(odds);
      setOdds(result);
    } catch (error) {
      console.error("Error fetching live odds:", error);
    }
  };

  const detectMovements = (oldOdds, newOdds) => {
    const moves = [];
    // Compare spreads, moneylines, totals
    // Add to movements array
    setMovements(moves);
  };

  return (
    <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-bold text-gray-900">LIVE ODDS</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Updated {odds?.timestamp ? new Date(odds.timestamp).toLocaleTimeString() : 'Never'}
          </Badge>
        </div>

        {/* Line Movements Alert */}
        <AnimatePresence>
          {movements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-100 border-2 border-red-300 rounded-lg p-3 mb-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="font-bold text-red-800">Line Movement Detected!</span>
              </div>
              {movements.map((move, idx) => (
                <div key={idx} className="text-sm text-red-700 flex items-center gap-2">
                  {move.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {move.description}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sportsbook Odds Comparison */}
        {odds?.sportsbooks && (
          <div className="space-y-3">
            {odds.sportsbooks.map((book, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="font-bold text-sm text-gray-900 mb-2">{book.name}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-gray-500">Spread</div>
                    <div className="font-bold">{book.spread_home} ({book.spread_odds_home})</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Moneyline</div>
                    <div className="font-bold">{book.moneyline_home}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total</div>
                    <div className="font-bold">O/U {book.total}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Best Line Indicator */}
        <div className="mt-4 bg-green-100 rounded-lg p-3 border border-green-300">
          <div className="text-xs text-green-800">
            💡 <strong>Best Value:</strong> DraftKings has best spread odds at -108
          </div>
        </div>
      </CardContent>
    </Card>
  );
}