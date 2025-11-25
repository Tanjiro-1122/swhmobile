import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has VIP access
        const hasAccess = user.subscription_type === 'legacy' || user.subscription_type === 'vip_annual';
        
        if (!hasAccess) {
            return Response.json({ error: 'VIP access required' }, { status: 403 });
        }

        const apiKey = Deno.env.get("THE_ODDS_API_KEY");
        
        if (!apiKey) {
            return Response.json({ error: 'API key not configured' }, { status: 500 });
        }

        return Response.json({ apiKey });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});