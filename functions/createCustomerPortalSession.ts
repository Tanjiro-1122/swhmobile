import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    // Initialize Base44 client and authenticate
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the host from request to build proper return URL
    const url = new URL(req.url);
    const origin = url.origin;

    // Find or create Stripe customer for this user
    let customer;
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      // Create new customer if doesn't exist
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          user_email: user.email,
        },
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/Profile`,
    });

    return Response.json({ 
      url: session.url 
    });
  } catch (error) {
    console.error('❌ Customer Portal Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create portal session' 
    }, { status: 500 });
  }
});