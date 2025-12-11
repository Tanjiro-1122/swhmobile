import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Only admins can manually activate
    const admin = await base44.auth.me();
    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { user_id, subscription_type, reason, purchase_audit_id } = await req.json();
    
    if (!user_id || !subscription_type || !reason) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
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
      subscription_type,
      expires_at: expires_at?.toISOString()
    });
  } catch (error) {
    console.error('Manual activation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});