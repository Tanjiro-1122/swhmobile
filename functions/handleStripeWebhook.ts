import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-04-10',
});

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    );

    const base44 = createClientFromRequest(req, { useServiceRole: true });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_id, email } = session.metadata;
      const priceId = session.line_items?.data[0]?.price.id;

      let subscription_type = null;
      if (priceId === 'price_1SN2OGRrQjRM0rB2u6TnCiP8') {
        subscription_type = 'premium_monthly';
      } else if (priceId === 'price_1SN2OrRrQjRM0rB2FrP8gDYp') {
        subscription_type = 'vip_annual';
      }

      if (subscription_type && user_id) {
        await base44.entities.User.update(user_id, { subscription_type });
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});