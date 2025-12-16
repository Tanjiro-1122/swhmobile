import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { withCache, generateCacheKey } from './utils/cache.ts';

// Retry logic with exponential backoff
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3, initialDelay = 1000) {
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

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      console.warn('No JSON body or invalid JSON:', e?.message || e);
      body = {};
    }

    const { sport, prompt, schema, requireAuth = false, max_tokens = 1200 } = (body as any);

    if (requireAuth) {
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!sport || !prompt) {
      return Response.json({ error: 'Missing required fields: sport and prompt' }, { status: 400 });
    }

    console.log('Fetching sports stats for:', sport);

    // Generate cache key based on sport and current date (daily refresh)
    const cacheKey = generateCacheKey('sportsStats', {
      sport,
      date: new Date().toISOString().split('T')[0],
    });

    const cacheTypeToUse = 'teamStats';

    const result = await withCache(cacheTypeToUse, cacheKey, async () => {
      return await retryWithBackoff(async () => {
        try {
          console.log('Calling InvokeLLM for sport:', sport);

          const llmRequest: any = {
            prompt,
            add_context_from_internet: true,
            max_tokens,
          };

          if (schema) {
            llmRequest.response_json_schema = schema;
          }

          const llmResponse = await base44.integrations.Core.InvokeLLM(llmRequest);
          console.log('Raw InvokeLLM response:', JSON.stringify(llmResponse, null, 2));

          // LLM response payload might be under .data, .output, or directly returned.
          const llmResult = llmResponse?.data ?? llmResponse?.output ?? llmResponse;

          if (!llmResult) {
            throw new Error('LLM returned an empty result');
          }

          // Validate basic expected structure
          if (!llmResult.teams || !Array.isArray(llmResult.teams) || llmResult.teams.length === 0) {
            throw new Error('LLM response missing or empty teams array');
          }

          // players may be optional for some sports, warn but don't fail
          if (!llmResult.players || !Array.isArray(llmResult.players) || llmResult.players.length === 0) {
            console.warn('LLM response missing or empty players array');
          }

          console.log(`Successfully fetched stats for ${sport}: teams=${llmResult.teams.length}, players=${llmResult.players?.length ?? 0}`);

          // Standardize returned shape so frontend can access response.data
          return {
            data: llmResult,
            raw: llmResponse,
            fetched_at: new Date().toISOString(),
          };
        } catch (llmError) {
          console.error('LLM error for sport:', sport, llmError);
          throw llmError;
        }
      }, 3, 2000);
    });

    return Response.json(result, { status: 200 });

  } catch (error: any) {
    console.error('=== SPORTS STATS ERROR ===');
    console.error('Error:', error);
    console.error('Message:', error?.message);
    console.error('Stack:', error?.stack);
    console.error('========================');

    return Response.json({
      error: error?.message || 'Failed to fetch sports stats',
      details: String(error),
      type: 'sports_stats_error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
});