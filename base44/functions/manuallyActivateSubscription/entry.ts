import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Credit pack product IDs and the number of credits they grant
const CREDIT_PACK_MAPPING: Record<string, number> = {
  'com.sportswagerhelper.credits.25': 25,
  'com.sportswagerhelper.credits.60': 60,
  'com.sportswagerhelper.credits.100': 100
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Only admins can manually activate
    const admin = await base44.auth.me();
    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { user_id, subscription_type, reason, purchase_audit_id, product_id } = await req.json();
    
    if (!user_id || !reason) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine whether this is a credit grant or a subscription activation
    // by looking up the product_id in the credit pack mapping.
    const creditsToGrant: number | undefined = product_id ? CREDIT_PACK_MAPPING[product_id] : undefined;
    const isCreditsGrant = creditsToGrant !== undefined && creditsToGrant > 0;

    if (!isCreditsGrant && !subscription_type) {
      return Response.json({ error: 'Missing subscription_type or credit grant info' }, { status: 400 });
    }

    if (isCreditsGrant) {
      // Fetch the current user to read their existing credit balance
      const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
      const user = users?.[0];
      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const currentCredits: number = user.search_credits || 0;
      const newCredits = currentCredits + creditsToGrant;

      // Grant credits to the user
      await base44.asServiceRole.entities.User.update(user_id, {
        search_credits: newCredits
      });

      // Update purchase audit record if provided
      if (purchase_audit_id) {
        await base44.asServiceRole.entities.PurchaseAudit.update(purchase_audit_id, {
          status: 'manually_activated',
          manually_activated_by: admin.email,
          manual_activation_reason: reason,
          granted_credits: creditsToGrant
        });
      }

      // Log the manual credit grant
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'iap',
        severity: 'info',
        function_name: 'manuallyActivateSubscription',
        error_message: `Admin ${admin.email} manually granted ${creditsToGrant} credits to user ${user_id} (was ${currentCredits}, now ${newCredits})`,
        context: { user_id, credits_granted: creditsToGrant, product_id, reason, purchase_audit_id }
      });

      return Response.json({
        success: true,
        type: 'credits',
        credits_granted: creditsToGrant,
        new_balance: newCredits
      });
    }

    // --- Subscription activation path ---
    // Calculate expiry based on subscription type
    let expires_at = null;
    if (subscription_type === 'premium_monthly') {
      expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else if (subscription_type === 'vip_annual') {
      expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }
    
    // Update user subscription
    await base44.asServiceRole.entities.User.update(user_id, {
      subscription_type,
      subscription_expires_at: expires_at?.toISOString()
    });
    
    // Update purchase audit if provided
    if (purchase_audit_id) {
      await base44.asServiceRole.entities.PurchaseAudit.update(purchase_audit_id, {
        status: 'manually_activated',
        manually_activated_by: admin.email,
        manual_activation_reason: reason,
        granted_subscription: subscription_type
      });
    }
    
    // Log the manual activation
    await base44.asServiceRole.entities.ErrorLog.create({
      error_type: 'iap',
      severity: 'info',
      function_name: 'manuallyActivateSubscription',
      error_message: `Admin ${admin.email} manually activated ${subscription_type} for user ${user_id}`,
      context: { user_id, subscription_type, reason, purchase_audit_id }
    });
    
    return Response.json({ 
      success: true,
      type: 'subscription',
      subscription_type,
      expires_at: expires_at?.toISOString()
    });
  } catch (error) {
    console.error('Manual activation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});