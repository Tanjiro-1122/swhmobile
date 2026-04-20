import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { sportKey } = await req.json();
    const apiKey = Deno.env.get("ODDS_API_KEY") ?? Deno.env.get("ODDS_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured on the server.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!sportKey) {
        return new Response(JSON.stringify({ error: 'sportKey is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
    );

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: 'Failed to fetch odds from external API.', details: errorText }), { status: response.status, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});