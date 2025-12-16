import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { withCache, generateCacheKey } from './utils/cache.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sport, prompt, schema } = await req.json();
    
    console.log('Fetching sports stats for:', sport);
    
    // Generate cache key based on sport and current date (stats refresh daily)
    const cacheKey = generateCacheKey('sportsStats', { 
      sport,
      date: new Date().toISOString().split('T')[0] // Cache per day
    });
    
    // Use cache wrapper for sports stats - 6 hour TTL
    const result = await withCache('sportsStats', cacheKey, async () => {
      try {
        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: schema
        });
        
        // Validate the result has the expected structure
        if (!llmResult || !llmResult.teams || !Array.isArray(llmResult.teams) || llmResult.teams.length === 0) {
          console.error('Invalid LLM response structure for sport:', sport);
          throw new Error(`Failed to fetch valid stats for ${sport}`);
        }
        
        console.log('Successfully fetched stats for:', sport, '- Teams:', llmResult.teams.length, 'Players:', llmResult.players?.length || 0);
        return llmResult;
        
      } catch (llmError) {
        console.error('LLM error for sport:', sport, llmError);
        throw llmError;
      }
    }, 21600); // 6 hour cache
    
    return Response.json(result);

  } catch (error) {
    console.error('Sports stats error:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Failed to fetch sports stats',
      details: error.toString(),
      type: 'sports_stats_error'
    }, { status: 500 });
  }
});