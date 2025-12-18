import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-04-10',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { priceId, mode } = await req.json();

    if (!priceId || !mode) {
      return new Response(JSON.stringify({ error: 'priceId and mode are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const successUrl = `${Deno.env.get('BASE44_APP_URL')}/Dashboard?payment_success=true`;
    const cancelUrl = `${Deno.env.get('BASE44_APP_URL')}/Pricing?payment_cancelled=true`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        email: user.email,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});