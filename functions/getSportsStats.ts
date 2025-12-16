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
    
    // Generate cache key based on sport and current date (stats refresh daily)
    const cacheKey = generateCacheKey('sportsStats', { 
      sport,
      date: new Date().toISOString().split('T')[0] // Cache per day
    });
    
    // Use cache wrapper for sports stats - 30 minute TTL since standings change slowly
    const result = await withCache('sportsStats', cacheKey, async () => {
      return await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: schema
      });
    });
    
    return Response.json(result);

  } catch (error) {
    console.error('Sports stats error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});