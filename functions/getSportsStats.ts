import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { withCache, generateCacheKey } from './utils/cache.js';

// Retry logic with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = initialDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

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
      return await retryWithBackoff(async () => {
        try {
          console.log('Calling InvokeLLM for sport:', sport);
          
          const llmResult = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true,
            response_json_schema: schema
          });
          
          console.log('LLM raw response:', JSON.stringify(llmResult, null, 2));
          
          // Validate the result has the expected structure
          if (!llmResult) {
            throw new Error('LLM returned null or undefined');
          }
          
          if (!llmResult.teams || !Array.isArray(llmResult.teams)) {
            throw new Error('LLM response missing teams array');
          }
          
          if (llmResult.teams.length === 0) {
            throw new Error('LLM returned empty teams array');
          }
          
          if (!llmResult.players || !Array.isArray(llmResult.players) || llmResult.players.length === 0) {
            console.warn('LLM response missing or empty players array');
          }
          
          console.log('Successfully fetched stats for:', sport, '- Teams:', llmResult.teams.length, 'Players:', llmResult.players?.length || 0);
          return llmResult;
          
        } catch (llmError) {
          console.error('LLM error for sport:', sport);
          console.error('Error message:', llmError.message);
          console.error('Error stack:', llmError.stack);
          throw new Error(`Failed to fetch ${sport} stats: ${llmError.message}`);
        }
      }, 3, 2000); // 3 retries with 2s initial delay
    }, 21600); // 6 hour cache
    
    return Response.json(result);

  } catch (error) {
    console.error('=== SPORTS STATS ERROR ===');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================');
    
    return Response.json({ 
      error: error.message || 'Failed to fetch sports stats',
      details: error.toString(),
      type: 'sports_stats_error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});