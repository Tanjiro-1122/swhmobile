import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Search, Shield } from "lucide-react";
import { motion } from "framer-motion";

const ODDS_API_KEY = "4961807ff18b92da83549a2e55ab8f64";

export default function OddsVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  const verifyOdds = async () => {
    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      // Step 1: Fetch live odds from API
      const oddsResponse = await fetch(
        `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm`
      );

      if (!oddsResponse.ok) {
        throw new Error("Failed to fetch odds from API");
      }

      const oddsData = await oddsResponse.json();

      if (oddsData.length === 0) {
        setError("No NBA games available right now. Try again when games are scheduled.");
        setIsVerifying(false);
        return;
      }

      // Get first 3 games for verification
      const gamesToVerify = oddsData.slice(0, 3);

      // Step 2: Use AI with internet access to verify odds
      const verificationPrompt = `You are verifying live sports betting odds accuracy.

CURRENT DATE/TIME: ${new Date().toLocaleString()}

I have odds from The Odds API. Please verify these against ACTUAL current odds from DraftKings, FanDuel, and BetMGM websites.

GAMES TO VERIFY:
${gamesToVerify.map((game, idx) => `
Game ${idx + 1}: ${game.home_team} vs ${game.away_team}
Commence Time: ${new Date(game.commence_time).toLocaleString()}

The Odds API Data:
${game.bookmakers.map(book => `
  ${book.title}:
  ${book.markets[0].outcomes.map(o => `    ${o.name}: ${o.price > 0 ? '+' : ''}${o.price}`).join('\n')}
`).join('\n')}
`).join('\n')}

VERIFICATION TASK:
1. Search for CURRENT odds on DraftKings.com, FanDuel.com, and BetMGM.com
2. Compare API odds vs actual website odds
3. For each game, report:
   - Is the data accurate? (within ±10 points is acceptable due to line movement)
   - What are the ACTUAL current odds on each site?
   - Any discrepancies?
   - Data freshness (is the game starting soon? are odds still available?)

Return detailed comparison showing API vs Reality for each bookmaker.`;

      const aiVerification = await base44.integrations.Core.InvokeLLM({
        prompt: verificationPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            verification_timestamp: { type: "string" },
            overall_accuracy: {
              type: "string",
              enum: ["highly_accurate", "mostly_accurate", "some_discrepancies", "inaccurate", "unable_to_verify"]
            },
            games: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  game: { type: "string" },
                  commence_time: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["verified_accurate", "minor_differences", "major_discrepancies", "unable_to_verify"]
                  },
                  bookmaker_comparisons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        bookmaker: { type: "string" },
                        api_odds: { type: "object" },
                        actual_odds: { type: "object" },
                        match: { type: "boolean" },
                        difference: { type: "string" }
                      }
                    }
                  },
                  notes: { type: "string" }
                }
              }
            },
            summary: { type: "string" },
            recommendations: { type: "string" }
          }
        }
      });

      setVerificationResult(aiVerification);

    } catch (err) {
      console.error("Verification error:", err);
      setError(err.message || "Failed to verify odds. Please try again.");
    }

    setIsVerifying(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "verified_accurate":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "minor_differences":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "major_discrepancies":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "verified_accurate":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "minor_differences":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "major_discrepancies":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Odds Accuracy Verification</h1>
              <p className="text-slate-400">Verify The Odds API data against real sportsbook websites</p>
            </div>
          </div>
        </motion.div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 mt-1" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-2">How This Works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fetches current NBA odds from The Odds API</li>
                  <li>AI searches DraftKings, FanDuel, and BetMGM websites</li>
                  <li>Compares API data vs actual website odds</li>
                  <li>Reports accuracy and any discrepancies</li>
                </ul>
                <p className="mt-3 text-xs">
                  ⚠️ Note: Odds change frequently. Small differences (±10 points) are normal due to line movement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verify Button */}
        <div className="mb-8 text-center">
          <Button
            onClick={verifyOdds}
            disabled={isVerifying}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white text-lg px-8 py-6"
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                Verifying Odds Accuracy...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-3" />
                Verify Live Odds Now
              </>
            )}
          </Button>
          {isVerifying && (
            <p className="text-sm text-slate-400 mt-3">
              This may take 30-60 seconds while AI checks multiple sportsbook websites...
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50">
            <XCircle className="w-4 h-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Verification Results */}
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Accuracy */}
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  Overall Accuracy Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`text-lg px-4 py-2 ${
                    verificationResult.overall_accuracy === 'highly_accurate' ? 'bg-green-500' :
                    verificationResult.overall_accuracy === 'mostly_accurate' ? 'bg-blue-500' :
                    verificationResult.overall_accuracy === 'some_discrepancies' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {verificationResult.overall_accuracy.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-slate-400">
                    Verified at: {new Date(verificationResult.verification_timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                  <p className="text-white text-sm leading-relaxed">{verificationResult.summary}</p>
                </div>

                {verificationResult.recommendations && (
                  <Alert className="bg-blue-500/10 border-blue-500/30">
                    <AlertTriangle className="w-4 h-4 text-blue-400" />
                    <AlertDescription className="text-blue-300 text-sm">
                      <strong>Recommendations:</strong> {verificationResult.recommendations}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Individual Game Verifications */}
            {verificationResult.games?.map((game, idx) => (
              <Card key={idx} className="bg-slate-800/90 border-slate-700">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white mb-2">{game.game}</CardTitle>
                      <div className="text-sm text-slate-400">
                        Game Time: {new Date(game.commence_time).toLocaleString()}
                      </div>
                    </div>
                    <Badge className={getStatusColor(game.status)}>
                      {getStatusIcon(game.status)}
                      <span className="ml-2">{game.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {game.bookmaker_comparisons?.map((comp, compIdx) => (
                      <div key={compIdx} className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-white">{comp.bookmaker}</div>
                          {comp.match ? (
                            <Badge className="bg-green-500/20 text-green-400">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Match
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Different
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-slate-500 mb-1">The Odds API:</div>
                            <pre className="text-slate-300 text-xs bg-slate-800 p-2 rounded">
                              {JSON.stringify(comp.api_odds, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <div className="text-slate-500 mb-1">Actual Website:</div>
                            <pre className="text-slate-300 text-xs bg-slate-800 p-2 rounded">
                              {JSON.stringify(comp.actual_odds, null, 2)}
                            </pre>
                          </div>
                        </div>

                        {comp.difference && (
                          <div className="mt-3 text-xs text-slate-400">
                            📊 Difference: {comp.difference}
                          </div>
                        )}
                      </div>
                    ))}

                    {game.notes && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300">
                        <strong>Notes:</strong> {game.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}