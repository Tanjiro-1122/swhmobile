import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function decodeAppleToken(token: string): { sub: string; email?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { identityToken, email, fullName, creditsAmount, productId, source } = body;

    if (!identityToken) {
      return Response.json({ error: 'identityToken required' }, { status: 400, headers: corsHeaders() });
    }

    const tokenPayload = decodeAppleToken(identityToken);
    if (!tokenPayload?.sub) {
      return Response.json({ error: 'Invalid identity token' }, { status: 400, headers: corsHeaders() });
    }

    const appleUserId = tokenPayload.sub;
    const userEmail = email || tokenPayload.email || null;
    const userName = fullName || null;

    // Find or create user
    let user: any = null;

    try {
      const existing = await base44.asServiceRole.entities.User.filter({ apple_user_id: appleUserId });
      if (existing && existing.length > 0) user = existing[0];
    } catch {}

    if (!user && userEmail) {
      try {
        const byEmail = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (byEmail && byEmail.length > 0) {
          user = await base44.asServiceRole.entities.User.update(byEmail[0].id, {
            apple_user_id: appleUserId,
            full_name: userName || byEmail[0].full_name,
          });
        }
      } catch {}
    }

    if (!user) {
      user = await base44.asServiceRole.entities.User.create({
        email: userEmail || `${appleUserId}@privaterelay.appleid.com`,
        full_name: userName || 'SWH User',
        apple_user_id: appleUserId,
        subscription_type: 'free',
        search_credits: 5,
        monthly_free_lookups_used: 0,
        role: 'user',
      });
    }

    // If this came from a purchase flow, apply the credits
    if (source === 'post_purchase' && creditsAmount && productId) {
      const existingCredits = user.search_credits || 0;
      user = await base44.asServiceRole.entities.User.update(user.id, {
        search_credits: existingCredits + Number(creditsAmount),
      });
    }

    const sessionToken = await base44.asServiceRole.auth.createSessionToken(user.id);

    return Response.json({
      success: true,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        apple_user_id: user.apple_user_id,
        subscription_type: user.subscription_type,
        search_credits: user.search_credits || 0,
        monthly_free_lookups_used: user.monthly_free_lookups_used || 0,
      },
    }, { headers: corsHeaders() });

  } catch (err: any) {
    console.error('appleSignIn error:', err);
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
});
