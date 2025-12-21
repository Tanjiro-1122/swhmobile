import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@^14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

const getOrCreateCustomer = async (base44, user) => {
  // 1. Check for existing customer ID on the user object
  if (user.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(user.stripe_customer_id);
      if (customer && !customer.deleted) {
        return customer;
      }
    } catch (error) {
      // Customer might not exist in Stripe anymore, proceed to create
      console.warn('Could not retrieve Stripe customer, creating a new one.', error.message);
    }
  }

  // 2. Look for a customer in Stripe by email
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  if (customers.data.length > 0) {
    const customer = customers.data[0];
    // 3. Update Base44 user with the found customer ID
    await base44.auth.updateMe({ stripe_customer_id: customer.id });
    return customer;
  }

  // 4. Create a new customer in Stripe
  const newCustomer = await stripe.customers.create({
    email: user.email,
    name: user.full_name,
    metadata: {
      base44_user_id: user.id,
    },
  });

  // 5. Update Base44 user with the new customer ID
  await base44.auth.updateMe({ stripe_customer_id: newCustomer.id });

  return newCustomer;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { priceId, mode, trial } = await req.json();
    
    // Get app host URL from env or use production URL
    const appHostUrl = Deno.env.get('APP_HOST_URL') || 'https://sportswagerhelper.com';

    const customer = await getOrCreateCustomer(base44, user);
    
    if (mode === 'subscription') {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        price: priceId,
        status: 'all',
      });

      const activeOrTrialingSubs = subscriptions.data.filter(sub => ['active', 'trialing', 'past_due'].includes(sub.status));
      
      if (activeOrTrialingSubs.length > 0) {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customer.id,
          return_url: `${appHostUrl}/MyAccount?tab=plan`,
        });
        return new Response(JSON.stringify({ url: portalSession.url, already_subscribed: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${Deno.env.get('APP_HOST_URL')}/MyAccount?tab=plan&payment_success=true`,
      cancel_url: `${Deno.env.get('APP_HOST_URL')}/Pricing?payment_cancelled=true`,
      customer: customer.id,
      metadata: {
        base44_user_id: user.id,
      },
      ...(mode === 'subscription' && {
        customer_update: {
            address: 'auto',
            name: 'auto',
        },
      }),
    };

 

    const session = await stripe.checkout.sessions.create(sessionParams);
    
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});