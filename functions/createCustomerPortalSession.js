import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { return_url } = await req.json();

        // Get user's Stripe customer ID from their email
        // Stripe automatically creates customers by email when they subscribe
        const customers = await stripe.customers.list({
            email: user.email,
            limit: 1
        });

        if (customers.data.length === 0) {
            return Response.json({ 
                error: 'No subscription found. You may be on a free plan or your subscription was not found.' 
            }, { status: 404 });
        }

        const customer = customers.data[0];

        // Create a Customer Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: return_url || 'https://sportswagerhelper.com/Profile'
        });

        return Response.json({ 
            success: true, 
            url: session.url 
        });
    } catch (error) {
        console.error('Create customer portal session error:', error);
        return Response.json({ 
            error: error.message || 'Failed to create portal session' 
        }, { status: 500 });
    }
});