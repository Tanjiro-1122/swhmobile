import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { match_description, sport, league, bet_type, market_description, current_odds, opening_odds, odds_history } = await req.json();

    console.log(`🎯 Analyzing odds value for: ${match_description} - ${market_description}`);

    // Use AI to analyze if this is a value bet
    const analysisPrompt = `You are an expert sports betting analyst specializing in identifying value bets through odds analysis and market inefficiencies.

MATCH INFORMATION:
- Match: ${match_description}
- Sport: ${sport}
- League: ${league}
- Bet Type: ${bet_type}
- Market: ${market_description}

ODDS DATA:
- Current Odds: ${current_odds} (American format)
- Opening Odds: ${opening_odds || 'Not available'}
- Odds History: ${odds_history && odds_history.length > 0 ? JSON.stringify(odds_history) : 'Limited history'}

ODDS MOVEMENT ANALYSIS:
${opening_odds ? `Odds have moved from ${opening_odds} to ${current_odds} (${current_odds > opening_odds ? 'more favorable' : 'less favorable'})` : 'Opening odds not available'}

YOUR TASK:
Analyze whether this represents a VALUE BET opportunity. Consider:

1. **Odds Movement**: Sharp vs public money (sharp money causes significant line movement)
2. **Market Efficiency**: Is this line mispriced compared to true probability?
3. **Timing**: Are we getting better odds than we should?
4. **Historical Patterns**: Does odds history suggest value?

REAL-TIME DATA REQUIREMENTS:
- Use current betting market data if available
- Check recent team/player performance on StatMuse
- Look for sharp money indicators (reverse line movement)
- Identify if public is heavily on one side

VALUE BET CRITERIA:
- Expected Value (EV) > 5% = Strong value
- EV 2-5% = Moderate value
- EV 0-2% = Slight value
- EV < 0% = No value

Return a JSON object with:

1. **recommendation**: "strong_buy" (high confidence value), "buy" (moderate value), "hold" (fair price), or "avoid" (negative value)
2. **confidence**: 0-100 score (how confident you are in this assessment)
3. **reasoning**: 2-3 sentences explaining your analysis with specific stats/factors
4. **expected_value**: Calculated EV percentage (can be negative)
5. **is_value_bet**: boolean (true if EV > 2%)
6. **value_score**: 0-100 overall value score
7. **key_factors**: array of 3-5 specific factors that influenced your decision
8. **risk_level**: "low", "medium", or "high"
9. **comparable_odds**: What odds SHOULD this bet have based on your analysis

CRITICAL RULES:
- Be conservative with "strong_buy" recommendations (only use for clear value)
- Consider implied probability vs actual probability
- Sharp money movement is a strong indicator
- If odds are moving against public sentiment, that's often sharp money
- Don't recommend bets just because odds moved favorably

Return valid JSON only.`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          recommendation: { 
            type: "string",
            enum: ["strong_buy", "buy", "hold", "avoid"]
          },
          confidence: { type: "number" },
          reasoning: { type: "string" },
          expected_value: { type: "number" },
          is_value_bet: { type: "boolean" },
          value_score: { type: "number" },
          key_factors: {
            type: "array",
            items: { type: "string" }
          },
          risk_level: { 
            type: "string",
            enum: ["low", "medium", "high"]
          },
          comparable_odds: { type: "string" }
        },
        required: ["recommendation", "confidence", "reasoning", "expected_value", "is_value_bet", "value_score"]
      }
    });

    console.log('✅ Odds analysis complete');

    return Response.json({
      success: true,
      analysis,
      analyzed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error analyzing odds:', error);
    return Response.json({ 
      error: 'Failed to analyze odds value', 
      details: error.message 
    }, { status: 500 });
  }
});