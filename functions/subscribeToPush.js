import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fcm_token, device_type } = await req.json();

        if (!fcm_token) {
            return Response.json({ error: 'FCM token is required' }, { status: 400 });
        }

        // Check if subscription already exists for this user
        const existing = await base44.entities.PushSubscription.filter({
            created_by: user.email,
            fcm_token: fcm_token
        });

        if (existing.length > 0) {
            // Update existing subscription
            await base44.entities.PushSubscription.update(existing[0].id, {
                is_active: true,
                last_used: new Date().toISOString(),
                device_type: device_type || 'web'
            });
        } else {
            // Create new subscription
            await base44.entities.PushSubscription.create({
                fcm_token: fcm_token,
                device_type: device_type || 'web',
                is_active: true,
                last_used: new Date().toISOString()
            });
        }

        return Response.json({ success: true, message: 'Push notification subscription saved' });
    } catch (error) {
        console.error('Subscribe to push error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});