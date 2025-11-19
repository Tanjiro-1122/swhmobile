import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    // Ensemble approach: Run multiple analysis perspectives
    const [statisticalAnalysis, momentumAnalysis, contextualAnalysis] = await Promise.all([
      // Analysis 1: Pure statistical model
      base44.integrations.Core.InvokeLLM({
        prompt: `STATISTICAL PREDICTION MODEL - Analyze: "${query}"
        
TODAY: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

You are a QUANTITATIVE sports analyst. Focus ONLY on hard numbers and statistical models.

REQUIRED DATA SOURCES (verify each):
1. StatMuse.com - Primary stats source
2. ESPN.com - Schedules, records
3. Official League Sites (NBA.com, NFL.com, etc.)
4. Basketball/Football-Reference.com - Historical data

STATISTICAL ANALYSIS FRAMEWORK:

1. ADVANCED METRICS (sport-specific):
   Basketball: TS%, eFG%, PER, BPM, VORP, Net Rating, Pace
   Football: DVOA, EPA, Success Rate, Pressure Rate, YAC
   Soccer: xG, xA, PPDA, Field Tilt, Pass Completion %
   Baseball: wOBA, FIP, WAR, wRC+, Hard Hit %

2. REGRESSION ANALYSIS:
   - Calculate win probability using logistic regression on:
     * Season win %
     * Home/Away splits
     * Last 10 games performance
     * Head-to-head historical data (last 3 years)
     * Rest days differential
     * Strength of schedule adjusted metrics

3. INJURY IMPACT QUANTIFICATION:
   - Quantify each injury's impact in win % points
   - Use replacement player statistics
   - Calculate team performance with/without injured player

4. SITUATIONAL FACTORS:
   - Back-to-back games: -4% win probability
   - 3rd game in 4 nights: -7% win probability
   - After long road trip (4+ games): -3% win probability
   - Playoff intensity factor (if applicable)

Return JSON with numeric confidence (0-100) based on statistical model strength.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            win_probability_home: { type: "number" },
            win_probability_away: { type: "number" },
            predicted_winner: { type: "string" },
            confidence_score: { type: "number" },
            key_stats: { type: "array", items: { type: "string" } },
            model_accuracy_estimate: { type: "number" }
          }
        }
      }),

      // Analysis 2: Momentum and form-based
      base44.integrations.Core.InvokeLLM({
        prompt: `MOMENTUM ANALYSIS MODEL - Analyze: "${query}"
        
You are a MOMENTUM specialist analyzing recent form, trends, and psychological factors.

MOMENTUM INDICATORS:

1. RECENT FORM (last 10 games):
   - Win/loss streaks
   - Scoring trends (increasing/decreasing)
   - Defensive performance trends
   - Clutch performance (games decided by <5 points/1 goal)

2. PSYCHOLOGICAL FACTORS:
   - Revenge game? (recent playoff loss, rivalry)
   - Confidence indicators (blowout wins vs close losses)
   - Pressure situations (must-win games)
   - Home crowd energy (attendance, noise level for playoffs)

3. LINEUP CHANGES:
   - New player acquisitions (games played together)
   - Coaching changes (system familiarity)
   - Chemistry indicators (assist rates, ball movement)

4. PERFORMANCE TRENDS:
   - Are they improving or declining? (regression analysis on last 20 games)
   - Home/away form divergence
   - Performance vs strong/weak opponents

Return JSON with momentum-adjusted confidence score.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            momentum_score_home: { type: "number" },
            momentum_score_away: { type: "number" },
            form_analysis: { type: "string" },
            confidence_score: { type: "number" },
            psychological_edge: { type: "string" }
          }
        }
      }),

      // Analysis 3: Contextual and situational
      base44.integrations.Core.InvokeLLM({
        prompt: `CONTEXTUAL ANALYSIS MODEL - Analyze: "${query}"
        
You are a CONTEXTUAL analyst examining game-specific circumstances.

CONTEXTUAL FACTORS:

1. WEATHER IMPACT (outdoor sports):
   - Temperature effects on performance
   - Wind impact on passing/kicking
   - Precipitation effects
   - Historical team performance in similar conditions

2. VENUE FACTORS:
   - Home court/field advantage strength (team-specific)
   - Altitude (if applicable)
   - Travel distance for away team
   - Time zone changes

3. SCHEDULE CONTEXT:
   - Days rest differential
   - Position in schedule (start/middle/end of season)
   - Playoff positioning implications (motivation)
   - Tanking considerations (if applicable)

4. MATCHUP-SPECIFIC ANALYSIS:
   - Stylistic advantages (pace, tempo, play style)
   - Defensive/offensive scheme matchups
   - Star player head-to-head performance
   - Referee/umpire tendencies (if data available)

Return JSON with contextual adjustment factors.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            contextual_adjustment: { type: "number" },
            venue_advantage: { type: "number" },
            schedule_impact: { type: "string" },
            matchup_edge: { type: "string" },
            confidence_score: { type: "number" }
          }
        }
      })
    ]);

    // Ensemble combination using weighted average
    const weights = {
      statistical: 0.50,  // Highest weight to pure stats
      momentum: 0.30,     // Moderate weight to form
      contextual: 0.20    // Lower weight to situational factors
    };

    // Combine win probabilities
    const ensembleHomeProbability = 
      (statisticalAnalysis.win_probability_home * weights.statistical) +
      (momentumAnalysis.momentum_score_home * weights.momentum) +
      (50 + contextualAnalysis.contextual_adjustment) * weights.contextual;

    const ensembleAwayProbability = 
      (statisticalAnalysis.win_probability_away * weights.statistical) +
      (momentumAnalysis.momentum_score_away * weights.momentum) +
      (50 - contextualAnalysis.contextual_adjustment) * weights.contextual;

    // Normalize to sum to 100
    const total = ensembleHomeProbability + ensembleAwayProbability;
    const normalizedHome = (ensembleHomeProbability / total) * 100;
    const normalizedAway = (ensembleAwayProbability / total) * 100;

    // Calculate ensemble confidence (average of model confidences)
    const ensembleConfidence = (
      statisticalAnalysis.confidence_score * weights.statistical +
      momentumAnalysis.confidence_score * weights.momentum +
      contextualAnalysis.confidence_score * weights.contextual
    );

    // Determine confidence level
    let confidenceLevel;
    if (ensembleConfidence >= 80) confidenceLevel = 'High';
    else if (ensembleConfidence >= 65) confidenceLevel = 'Medium';
    else confidenceLevel = 'Low';

    return Response.json({
      ensemble_result: {
        home_win_probability: Math.round(normalizedHome * 10) / 10,
        away_win_probability: Math.round(normalizedAway * 10) / 10,
        predicted_winner: normalizedHome > normalizedAway ? 
          statisticalAnalysis.predicted_winner : 
          (statisticalAnalysis.predicted_winner || '').split(' vs ')[1],
        confidence: confidenceLevel,
        confidence_numeric: Math.round(ensembleConfidence * 10) / 10
      },
      model_breakdown: {
        statistical: statisticalAnalysis,
        momentum: momentumAnalysis,
        contextual: contextualAnalysis
      },
      methodology: {
        weights_used: weights,
        models_combined: 3,
        approach: 'Weighted ensemble of statistical, momentum, and contextual models'
      }
    });

  } catch (error) {
    console.error('Enhanced prediction error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});