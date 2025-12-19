import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@^14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
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

    // Create service role client for admin operations
    const base44 = createClientFromRequest(req);
    const base44Admin = base44.asServiceRole;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Get the user ID from metadata (set during checkout creation)
      const base44UserId = session.metadata?.base44_user_id;
      
      if (!base44UserId) {
        console.error('No base44_user_id in session metadata');
        return new Response(JSON.stringify({ received: true, error: 'No user ID' }), { status: 200 });
      }

      // Retrieve the full session with line items expanded
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'line_items.data.price'],
      });

      const priceId = fullSession.line_items?.data[0]?.price?.id;

      let subscription_type = null;
      if (priceId === 'price_1SN2OGRrQjRM0rB2u6TnCiP8') {
        subscription_type = 'premium_monthly';
      } else if (priceId === 'price_1SN2OrRrQjRM0rB2FrP8gDYp') {
        subscription_type = 'vip_annual';
      }

      if (subscription_type) {
        console.log(`Updating user ${base44UserId} to ${subscription_type}`);
        await base44Admin.entities.User.update(base44UserId, { subscription_type });
      }
    }
    
    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      // Find user by stripe_customer_id
      const users = await base44Admin.entities.User.filter({ stripe_customer_id: customerId });
      if (users.length > 0) {
        await base44Admin.entities.User.update(users[0].id, { subscription_type: 'free' });
        console.log(`Subscription cancelled for user ${users[0].id}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});