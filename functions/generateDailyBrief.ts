import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { favoriteSports = [], favoriteLeagues = [] } = await req.json().catch(() => ({}));

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const CACHE_HOURS = 24; // Only generate 1 brief per day

    // Check if brief already exists for today and is still valid
    const existingBriefs = await base44.entities.BettingBrief.filter(
      { brief_date: today },
      '-created_date',
      1
    );

    if (existingBriefs && existingBriefs.length > 0) {
      // Check if the brief was created within the last 12 hours
      const briefCreated = new Date(existingBriefs[0].created_date);
      const hoursSinceCreation = (now - briefCreated) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < CACHE_HOURS) {
        return Response.json({ 
          message: 'Brief already exists for today',
          brief: existingBriefs[0]
        });
      }
    }

    // Build personalized prompt based on user preferences
    let sportsFilter = '';
    if (favoriteSports.length > 0) {
      sportsFilter = `\n\nIMPORTANT: Focus primarily on these sports: ${favoriteSports.join(', ')}. Prioritize games and picks from these sports.`;
    }
    if (favoriteLeagues.length > 0) {
      sportsFilter += `\nFor soccer, prioritize these leagues: ${favoriteLeagues.join(', ')}.`;
    }

    // Generate brief using AI
    const briefData = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional sports betting analyst. Generate a comprehensive daily betting brief for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.

${sportsFilter}

Your brief should include:

1. EXECUTIVE SUMMARY (2-3 sentences)
   - Overall betting landscape for the day
   - Key themes and market trends
   - Best opportunities

2. TOP 3-5 PICKS (most confident bets)
   For each pick provide:
   - Sport (NBA, NFL, MLB, Premier League, etc.)
   - Match (e.g., "Lakers vs Celtics")
   - Pick (e.g., "Lakers -7.5", "Over 220.5", "Celtics ML")
   - Odds (e.g., "-110", "+150")
   - Confidence (High/Medium/Low)
   - Reasoning (2-3 sentences with specific stats)

3. KEY INJURY UPDATES (3-5 most impactful)
   - Player name
   - Team
   - Injury description
   - Impact on betting (High/Medium/Low)

4. SIGNIFICANT LINE MOVEMENTS (3-5)
   - Match
   - Movement description (e.g., "Spread moved from -6.5 to -8")
   - Significance/reasoning

5. SHARP MONEY INDICATORS (3-5 bullet points)
   - Where professional bettors are placing money
   - Reverse line movement examples
   - High-value plays

6. WEATHER ALERTS (if applicable - outdoor sports only)
   - Match
   - Conditions (temperature, wind, rain, etc.)
   - Impact on totals/gameplay

Use REAL DATA from today's actual games. If you don't have internet access to real games, note this in the summary.

Return structured JSON data.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          title: { 
            type: "string",
            description: "Brief title (e.g., 'Daily Betting Brief - January 15, 2025')"
          },
          summary: { 
            type: "string",
            description: "Executive summary of the day's betting landscape"
          },
          top_picks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sport: { type: "string" },
                match: { type: "string" },
                pick: { type: "string" },
                odds: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              },
              required: ["sport", "match", "pick", "odds", "confidence", "reasoning"]
            }
          },
          injury_updates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                player: { type: "string" },
                team: { type: "string" },
                injury: { type: "string" },
                impact: { type: "string" }
              },
              required: ["player", "team", "injury", "impact"]
            }
          },
          line_movements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                match: { type: "string" },
                movement: { type: "string" },
                significance: { type: "string" }
              },
              required: ["match", "movement", "significance"]
            }
          },
          sharp_money_indicators: {
            type: "array",
            items: { type: "string" }
          },
          weather_alerts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                match: { type: "string" },
                conditions: { type: "string" },
                impact: { type: "string" }
              },
              required: ["match", "conditions", "impact"]
            }
          }
        },
        required: ["title", "summary", "top_picks"]
      }
    });

    // Save brief to database
    const newBrief = await base44.entities.BettingBrief.create({
      brief_date: today,
      ...briefData
    });

    return Response.json({ 
      message: 'Brief generated successfully',
      brief: newBrief
    });
  } catch (error) {
    console.error('❌ Generate Brief Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate brief' 
    }, { status: 500 });
  }
});