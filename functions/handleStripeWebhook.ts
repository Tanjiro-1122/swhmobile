import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    console.log('✅ Stripe webhook event:', event.type);

    // Initialize Base44 client with service role (no user auth needed for webhooks)
    const base44 = createClientFromRequest(req);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id || session.client_reference_id;
        const userEmail = session.metadata?.user_email || session.customer_email;

        if (!userId) {
          console.error('❌ No user ID in checkout session');
          break;
        }

        // Determine subscription type based on price/product
        let subscriptionType = 'free';
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = subscription.items.data[0]?.price.id;
          
          // Map price IDs to subscription types (you'll need to set these based on your Stripe prices)
          if (priceId?.includes('monthly') || priceId?.includes('premium')) {
            subscriptionType = 'premium_monthly';
          } else if (priceId?.includes('annual') || priceId?.includes('vip')) {
            subscriptionType = 'vip_annual';
          }
        } else if (session.mode === 'payment') {
          // One-time payment for VIP
          subscriptionType = 'vip_annual';
        }

        // Update user subscription
        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (users && users.length > 0) {
          const user = users[0];
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_type: subscriptionType,
            subscription_start_date: new Date().toISOString(),
            ...(subscriptionType === 'vip_annual' && {
              subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            })
          });
          console.log(`✅ Updated user ${userEmail} to ${subscriptionType}`);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userEmail = subscription.metadata?.user_email;

        if (!userEmail) {
          console.error('❌ No user email in subscription');
          break;
        }

        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (users && users.length > 0) {
          const user = users[0];
          
          // If subscription is canceled or expired, downgrade to free
          if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            await base44.asServiceRole.entities.User.update(user.id, {
              subscription_type: 'free',
              subscription_end_date: new Date().toISOString()
            });
            console.log(`✅ Downgraded user ${userEmail} to free tier`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userEmail = subscription.metadata?.user_email;

        if (userEmail) {
          console.log(`⚠️ Payment failed for user ${userEmail}`);
          // You could send an email notification here
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return Response.json({ 
      error: error.message || 'Webhook handler failed' 
    }, { status: 500 });
  }
});