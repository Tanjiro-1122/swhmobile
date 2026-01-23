import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@^14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth is optional for donations
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      // User not logged in - that's OK for donations
    }

    const { amount, tierName } = await req.json();
    
    if (!amount || amount < 1) {
      return new Response(JSON.stringify({ error: 'Invalid donation amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get app host URL from env or use production URL
    const appHostUrl = Deno.env.get('APP_HOST_URL') || 'https://sportswagerhelper.com';

    // Create a one-time payment session for donation
    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Donation - ${tierName || 'Support Sports Wager Helper'}`,
              description: 'Voluntary donation to support development. Does not unlock any features.',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appHostUrl}/SupportUs?donation_success=true&amount=${amount}`,
      cancel_url: `${appHostUrl}/SupportUs?donation_cancelled=true`,
      metadata: {
        type: 'donation',
        tier_name: tierName || 'custom',
        base44_user_id: user?.id || 'anonymous',
        user_email: user?.email || 'anonymous',
      },
      // Pre-fill email if user is logged in
      ...(user?.email && { customer_email: user.email }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Donation session error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});