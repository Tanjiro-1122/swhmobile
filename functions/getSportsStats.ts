import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { sport, prompt, schema } = body;

    console.log('[getSportsStats] Request for sport:', sport);

    if (!sport || !prompt) {
      return Response.json({ 
        error: 'Missing required fields',
        received: { sport: !!sport, prompt: !!prompt }
      }, { status: 400 });
    }

    const llmRequest = {
      prompt: prompt + `\n\nCRITICAL: Use The Odds API and current sports data sources. Return accurate ${new Date().getFullYear()} season stats.`,
      add_context_from_internet: true,
      response_json_schema: schema
    };

    const llmResponse = await base44.integrations.Core.InvokeLLM(llmRequest);
    
    let result = llmResponse?.data || llmResponse;
    
    if (!result.teams) result.teams = [];
    if (!result.players) result.players = [];

    console.log(`[getSportsStats] Success: ${sport} - teams=${result.teams.length}, players=${result.players.length}`);

    return Response.json({
      data: result,
      fetched_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[getSportsStats] Error:', error);
    return Response.json({
      error: error?.message || 'Failed to fetch sports stats',
      details: String(error)
    }, { status: 500 });
  }
});