import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { withCache, generateCacheKey } from './utils/cache.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();
    
    // Generate cache key based on query
    const cacheKey = generateCacheKey('teamStats', { 
      query: query.toLowerCase().trim()
    });
    
    // Use cache wrapper for team stats
    const result = await withCache('teamStats', cacheKey, async () => {
      return await base44.integrations.Core.InvokeLLM({
        prompt: `Search for team: "${query}"
Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Return: team name, sport, league, current record, season averages, last 5 games with scores, next game prediction, key players, injuries, strengths, weaknesses.

If no next game scheduled, say TBD.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            team_name: { type: "string" },
            sport: { type: "string" },
            league: { type: "string" },
            current_record: { type: "object" },
            season_averages: { type: "object" },
            last_five_games: { type: "array", items: { type: "object" } },
            form: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            key_players: { type: "array", items: { type: "string" } },
            injuries: { type: "array", items: { type: "object" } },
            next_game: {
              type: "object",
              properties: {
                opponent: { type: "string" },
                date: { type: "string" },
                location: { type: "string" },
                predicted_outcome: { type: "string" },
                predicted_score: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              }
            }
          },
          required: ["team_name", "sport"]
        }
      });
    });
    
    return Response.json(result);

  } catch (error) {
    console.error('Team stats error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});