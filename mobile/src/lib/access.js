const UNLIMITED_TIERS = new Set([
  'premium_monthly',
  'vip_annual',
  'legacy',
  'influencer',
]);

export function getAccessModel(account) {
  const tier = String(account?.subscriptionType || account?.profile?.subscription_type || 'free')
    .toLowerCase();
  const isUnlimited = account?.isPro === true || UNLIMITED_TIERS.has(tier);
  const credits = Number(account?.searchCredits ?? account?.credits ?? 0);

  return {
    accessType: isUnlimited ? 'unlimited' : 'credits',
    isUnlimited,
    tier,
    searchCredits: Math.max(0, Number.isFinite(credits) ? credits : 0),
    label: isUnlimited ? 'Unlimited searches' : `${Math.max(0, credits)} search credits`,
  };
}

export function formatPlanName(account) {
  const rawTier = account?.subscriptionType || account?.profile?.subscription_type || '';
  const tier = String(rawTier || 'free').toLowerCase();
  if (account?.isPro && (!rawTier || tier === 'free')) return 'Premium';
  const labels = {
    free: 'Free',
    premium_monthly: 'Premium',
    vip_annual: 'VIP Unrestricted',
    legacy: 'Legacy',
    influencer: 'Influencer',
  };
  return labels[tier] || tier.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
