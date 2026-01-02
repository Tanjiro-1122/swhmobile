import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all influencer accounts
    const influencers = await base44.asServiceRole.entities.User.filter({ 
      subscription_type: 'influencer' 
    });

    if (!influencers || influencers.length === 0) {
      return Response.json({ 
        message: 'No influencer accounts found',
        expired: 0 
      });
    }

    const now = new Date();
    const expiredUsers = [];

    for (const influencer of influencers) {
      // Check if subscription_expiry_date has passed
      if (influencer.subscription_expiry_date) {
        const expiryDate = new Date(influencer.subscription_expiry_date);
        
        if (now > expiryDate) {
          // Expire this influencer account
          await base44.asServiceRole.entities.User.update(influencer.id, {
            subscription_type: 'free',
            subscription_status: 'inactive'
          });
          expiredUsers.push(influencer.email);
        }
      } else {
        // No expiry date set - check created_date (7 days from creation)
        const createdDate = new Date(influencer.created_date);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        if (createdDate < sevenDaysAgo) {
          await base44.asServiceRole.entities.User.update(influencer.id, {
            subscription_type: 'free',
            subscription_status: 'inactive'
          });
          expiredUsers.push(influencer.email);
        }
      }
    }

    return Response.json({ 
      message: `Expired ${expiredUsers.length} influencer account(s)`,
      expired: expiredUsers.length,
      expiredUsers 
    });

  } catch (error) {
    console.error('Expire influencer accounts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});