import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Lightweight retry helper
async function retryWithBackoff(fn: () => Promise<any>, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      const backoffMs = delay * Math.pow(2, i);
      console.log(`[getSportsStats] Retry ${i + 1}/${retries} after ${backoffMs}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
}

Deno.serve(async (req) => {
  // Health check endpoint
  if (req.method === 'GET') {
    return Response.json({
      status: 'ok',
      function: 'getSportsStats',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }, { status: 200 });
  }

  try {
    const base44 = createClientFromRequest(req);

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      console.warn('[getSportsStats] No JSON body or invalid JSON:', e?.message);
      body = {};
    }

    // Debug mode - return static data to test frontend wiring
    if (body.debug === true) {
      console.log('[getSportsStats] Debug mode - returning static data');
      return Response.json({
        data: {
          sport: body.sport || 'nba',
          season: '2024-2025',
          teams: [
            { rank: 1, name: 'Test Team', wins: 10, losses: 5, winPct: '0.667', pointsFor: '115', pointsAgainst: '108', streak: 'W3', division: 'Test Div' }
          ],
          players: [
            { rank: 1, name: 'Test Player', team: 'Test Team', position: 'PG', stat1Label: 'PPG', stat1Value: '25', stat2Label: 'APG', stat2Value: '8', stat3Label: 'RPG', stat3Value: '5', gamesPlayed: 15 }
          ]
        },
        debug: true,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }

    const { sport, prompt, schema, requireAuth = false, max_tokens = 1500 } = body;

    console.log('[getSportsStats] Request:', { sport, promptLength: prompt?.length, hasSchema: !!schema, requireAuth });

    if (requireAuth) {
      try {
        const user = await base44.auth.me();
        if (!user) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } catch (authErr) {
        console.error('[getSportsStats] Auth error:', authErr);
        return Response.json({ error: 'Authentication failed', details: String(authErr) }, { status: 401 });
      }
    }

    if (!sport || !prompt) {
      return Response.json({ 
        error: 'Missing required fields: sport and prompt',
        received: { sport: !!sport, prompt: !!prompt }
      }, { status: 400 });
    }

    console.log('[getSportsStats] Fetching stats for:', sport);

    const result = await retryWithBackoff(async () => {
        console.log('[getSportsStats] Calling InvokeLLM...');

        // Enhance prompt with explicit source instructions
        const enhancedPrompt = `${prompt}

CRITICAL: Search and aggregate data from ALL available sources:
- ESPN.com, official league sites (NBA.com, NFL.com, MLB.com, NHL.com)
- Sports-Reference sites (Basketball-Reference, Pro-Football-Reference, etc.)
- The Odds API and sportsbooks (FanDuel, DraftKings, BetMGM) for current odds/lines
- TheScore, Bleacher Report for latest news
- TeamRankings, FantasyPros for advanced analytics
- Use CURRENT ${new Date().getFullYear()} season data

Provide the most accurate, up-to-date information available.`;

        const llmRequest: any = {
          prompt: enhancedPrompt,
          add_context_from_internet: true,
          max_tokens,
        };

        if (schema) {
          llmRequest.response_json_schema = schema;
        }

        let llmResponse;
        try {
          llmResponse = await base44.integrations.Core.InvokeLLM(llmRequest);
          console.log('[getSportsStats] LLM response type:', typeof llmResponse);
          console.log('[getSportsStats] LLM response keys:', Object.keys(llmResponse || {}));
        } catch (llmErr) {
          console.error('[getSportsStats] InvokeLLM error:', llmErr);
          throw new Error(`InvokeLLM failed: ${llmErr.message || String(llmErr)}`);
        }

        // Parse response - try multiple possible structures
        let llmResult;
        if (llmResponse?.data) {
          llmResult = llmResponse.data;
        } else if (llmResponse?.output) {
          llmResult = llmResponse.output;
        } else if (llmResponse?.choices?.[0]?.message?.content) {
          // OpenAI-style response
          try {
            llmResult = JSON.parse(llmResponse.choices[0].message.content);
          } catch {
            llmResult = llmResponse.choices[0].message.content;
          }
        } else if (typeof llmResponse === 'object' && llmResponse !== null) {
          llmResult = llmResponse;
        } else {
          throw new Error('LLM returned unexpected response structure');
        }

        if (!llmResult) {
          throw new Error('LLM returned empty result');
        }

        console.log('[getSportsStats] Parsed result type:', typeof llmResult);
        console.log('[getSportsStats] Parsed result keys:', Object.keys(llmResult || {}));

        // Validate teams (required)
        if (!llmResult.teams || !Array.isArray(llmResult.teams)) {
          console.warn('[getSportsStats] Missing or invalid teams array, attempting to fix...');
          llmResult.teams = llmResult.teams || [];
        }

        if (llmResult.teams.length === 0) {
          throw new Error('LLM response has empty teams array');
        }

        // Validate players (optional, just warn)
        if (!llmResult.players || !Array.isArray(llmResult.players) || llmResult.players.length === 0) {
          console.warn('[getSportsStats] Missing or empty players array - will show empty in UI');
          llmResult.players = llmResult.players || [];
        }

        console.log(`[getSportsStats] Success: ${sport} - teams=${llmResult.teams.length}, players=${llmResult.players.length}`);

        return {
          data: llmResult,
          fetched_at: new Date().toISOString(),
        };
      }, 3, 2000);

    return Response.json(result, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[getSportsStats] ===== ERROR =====');
    console.error('[getSportsStats] Error name:', error?.name);
    console.error('[getSportsStats] Error message:', error?.message);
    console.error('[getSportsStats] Error stack:', error?.stack);
    console.error('[getSportsStats] Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('[getSportsStats] ====================');

    return Response.json({
      error: error?.message || 'Failed to fetch sports stats',
      type: error?.name || 'sports_stats_error',
      details: error?.stack || String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
});