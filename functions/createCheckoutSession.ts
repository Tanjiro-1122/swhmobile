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

    const { priceId, mode } = await req.json();

    if (!priceId || !mode) {
      return Response.json({ 
        error: 'Missing required parameters: priceId and mode' 
      }, { status: 400 });
    }

    // Get the host from request to build proper URLs
    const url = new URL(req.url);
    const origin = url.origin;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      client_reference_id: user.id,
      payment_method_types: ['card'],
      mode: mode, // 'payment' for one-time, 'subscription' for recurring
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `https://sportswagerhelper.com/MyAccount?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://sportswagerhelper.com/Pricing?payment_cancelled=true`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
      },
      // For subscriptions, add subscription metadata
      ...(mode === 'subscription' && {
        subscription_data: {
          metadata: {
            user_id: user.id,
            user_email: user.email,
          },
        },
      }),
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('❌ Stripe Checkout Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});