import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const today = new Date().toISOString().split('T')[0];

        // Check if brief already exists for today
        const existingBrief = await base44.asServiceRole.entities.BettingBrief.filter({
            brief_date: today
        });

        if (existingBrief.length > 0) {
            return Response.json({ 
                success: true, 
                message: 'Brief already exists for today',
                brief: existingBrief[0]
            });
        }

        // Generate comprehensive daily brief using AI
        const briefData = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a professional sports betting analyst. Create a comprehensive daily betting brief for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.

REQUIRED SECTIONS:

1. EXECUTIVE SUMMARY (3-4 sentences):
   - Overall betting landscape for today
   - Market sentiment
   - Key themes to watch

2. TOP PICKS (3-5 picks):
   For each pick provide:
   - Sport and league
   - Match (Team A vs Team B)
   - Specific pick (e.g., "Lakers -5.5", "Over 225.5", "Mahomes Over 2.5 TDs")
   - Current odds (realistic odds like -110, +150, etc.)
   - Confidence level (High/Medium/Low)
   - 2-3 sentence reasoning with specific stats

3. KEY INJURY UPDATES (3-5 updates):
   - Player name and team
   - Injury type and status
   - Impact on betting (High/Medium/Low)

4. SIGNIFICANT LINE MOVEMENTS (2-3 movements):
   - Which game/bet
   - How the line moved (e.g., "Moved from -3.5 to -5.5")
   - Why it's significant

5. SHARP MONEY INDICATORS (3-4 indicators):
   - Where professional bettors are placing money
   - Specific games and bet types

6. WEATHER ALERTS (if applicable):
   - Outdoor games affected by weather
   - Conditions and betting impact

Use REAL, CURRENT data from the internet. Search for:
- Today's game schedules from ESPN, CBS Sports
- Current odds from major sportsbooks
- Recent injury reports from team websites
- Weather forecasts for outdoor stadiums

Return comprehensive JSON with all sections filled.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    summary: { type: "string" },
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
                            }
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
                            }
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
                            }
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
                            }
                        }
                    }
                },
                required: ["summary", "top_picks"]
            }
        });

        // Create the brief in database
        const brief = await base44.asServiceRole.entities.BettingBrief.create({
            brief_date: today,
            title: `Daily Betting Brief - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
            summary: briefData.summary,
            top_picks: briefData.top_picks || [],
            injury_updates: briefData.injury_updates || [],
            line_movements: briefData.line_movements || [],
            sharp_money_indicators: briefData.sharp_money_indicators || [],
            weather_alerts: briefData.weather_alerts || []
        });

        return Response.json({ 
            success: true, 
            message: 'Daily brief generated successfully',
            brief: brief
        });
    } catch (error) {
        console.error('Generate daily brief error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});