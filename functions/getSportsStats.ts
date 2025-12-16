import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { sport, prompt, schema } = body;

    if (!sport || !prompt) {
      return Response.json({ error: 'Missing required fields: sport and prompt' }, { status: 400 });
    }

    console.log('[getSportsStats] Request for sport:', sport);

    const wrapperPrompt = `
You are a sports statistics agent with live web access. Search official league sites (ESPN, NFL.com, NBA.com, MLB.com, NHL.com), StatMuse, Basketball-Reference, Pro-Football-Reference, FBref/WhoScored, or other credible sources to return accurate current stats.

SPORT: ${sport}
INSTRUCTIONS: Return JSON matching the provided response schema. Be concise and factual.

USER_PROMPT:
${prompt}
`;

    const llmRequest = {
      prompt: wrapperPrompt,
      add_context_from_internet: true,
      max_tokens: 1500,
    };

    if (schema) {
      llmRequest.response_json_schema = schema;
    }

    console.log('[getSportsStats] Calling InvokeLLM...');
    const llmResponse = await base44.integrations.Core.InvokeLLM(llmRequest);

    console.log('[getSportsStats] LLM response received');

    if (!llmResponse) {
      console.error('[getSportsStats] Empty llmResponse');
      return Response.json({ error: 'Empty response from LLM' }, { status: 502 });
    }

    if (llmResponse.error || (llmResponse.status && llmResponse.status >= 400)) {
      console.error('[getSportsStats] LLM error:', llmResponse.error || llmResponse);
      return Response.json({ 
        error: llmResponse.error || 'LLM returned error', 
        details: llmResponse 
      }, { status: 502 });
    }

    const responsePayload = llmResponse;

    console.log('[getSportsStats] Success - returning data');
    return Response.json(responsePayload, {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  } catch (err) {
    console.error('[getSportsStats] Unexpected error:', err);
    return Response.json(
      { 
        error: err.message || String(err),
        stack: err.stack 
      },
      { status: 500 }
    );
  }
});