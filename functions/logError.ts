import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        
        // Errors can occur for non-authenticated users, so we get the user but don't require it.
        const user = await base44.auth.me().catch(() => null);

        const {
            error_type = 'frontend',
            severity = 'error',
            function_name,
            error_message,
            error_stack,
            context
        } = await req.json();

        if (!function_name || !error_message) {
            return new Response(JSON.stringify({ error: 'function_name and error_message are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // Use asServiceRole to ensure errors are always logged, regardless of user permissions.
        await base44.asServiceRole.entities.ErrorLog.create({
            error_type,
            severity,
            function_name,
            error_message,
            error_stack,
            user_email: user?.email || 'anonymous',
            context,
            resolved: false,
        });

        return new Response(JSON.stringify({ success: true, message: 'Error logged' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });

    } catch (e) {
        // This catch is for errors within the logError function itself.
        console.error('Error in logError function:', e);
        return new Response(JSON.stringify({ success: false, error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
});