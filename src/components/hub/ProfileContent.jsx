import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Crown, Calendar, Sparkles, Settings, Smartphone } from "lucide-react";

function getMergedUser(base44User) {
  // Pull mobile localStorage data — it's the source of truth for mobile users
  let localUser = null;
  try {
    const stored = localStorage.getItem('swh_user');
    if (stored) localUser = JSON.parse(stored);
  } catch {}

  // Merge: localStorage wins for name/email/tier, base44 fills the rest
  const merged = { ...(base44User || {}), ...(localUser || {}) };

  // If we have an apple_user_id, we're a mobile user — show real email if linked
  const appleUserId = localStorage.getItem('swh_apple_user_id') || merged.apple_user_id || '';
  const linkedEmail = localStorage.getItem('swh_email') || '';
  if (appleUserId && linkedEmail && !linkedEmail.includes('privaterelay')) {
    merged.email = linkedEmail;
  }

  // Full name from localStorage directly
  const storedName = localStorage.getItem('swh_full_name');
  if (storedName && storedName !== 'SWH User') merged.full_name = storedName;

  // Credits
  const storedCredits = localStorage.getItem('swh_search_credits');
  if (storedCredits) merged.search_credits = parseInt(storedCredits, 10);

  return merged;
}

export default function ProfileContent() {
  const { data: base44User, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const currentUser = getMergedUser(base44User);

  const isAdminEmail = (currentUser?.email || '').toLowerCase().includes('huertasfam');
  const appleUserId = localStorage.getItem('swh_apple_user_id') || currentUser?.apple_user_id || '';
  const isMobile = !!appleUserId;

  const getSubscriptionBadge = (type) => {
    if (isAdminEmail) return { label: 'ADMIN', color: 'bg-gradient-to-r from-red-500 to-orange-500 text-white' };
    switch (type) {
      case 'legacy':         return { label: 'LEGACY',       color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' };
      case 'vip_annual':     return { label: 'VIP ANNUAL',   color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' };
      case 'premium_monthly':return { label: 'PREMIUM',      color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' };
      case 'influencer':     return { label: 'INFLUENCER',   color: 'bg-gradient-to-r from-pink-500 to-red-500 text-white' };
      default:               return { label: 'FREE',         color: 'bg-gray-200 text-gray-700' };
    }
  };

  const subscription = getSubscriptionBadge(currentUser?.subscription_type);
  const isPaid = isAdminEmail || ['legacy','vip_annual','premium_monthly','influencer'].includes(currentUser?.subscription_type);

  // Member since — use earliest date available
  const memberSinceRaw = currentUser?.created_date || currentUser?.createdAt || null;
  const memberSince = memberSinceRaw
    ? new Date(memberSinceRaw).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  const creditsDisplay = isAdminEmail ? '∞ Unlimited' : (currentUser?.search_credits ?? 0);

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
        <CardHeader className="bg-white/10 border-b border-white/20">
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-6 h-6 text-blue-400" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {currentUser?.full_name || 'User'}
              </h2>
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{currentUser?.email || 'Not linked'}</span>
              </div>
              {isMobile && (
                <div className="flex items-center gap-2 text-lime-400/80 mb-3">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-xs">Mobile account {appleUserId ? '(Apple ID linked)' : ''}</span>
                </div>
              )}
              <Badge className={`${subscription.color} px-4 py-2 text-sm font-bold`}>
                <Crown className="w-4 h-4 mr-2" />
                {subscription.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Calendar className="w-7 h-7 mx-auto mb-1.5 text-blue-400" />
            <div className="text-xs text-white/70">Member Since</div>
            <div className="text-sm font-bold text-white">{memberSince}</div>
          </CardContent>
        </Card>

        <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-7 h-7 mx-auto mb-1.5 text-purple-400" />
            <div className="text-xs text-white/70">Plan</div>
            <div className="text-sm font-bold text-white">{subscription.label}</div>
          </CardContent>
        </Card>

        <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Settings className="w-7 h-7 mx-auto mb-1.5 text-lime-400" />
            <div className="text-xs text-white/70">Credits</div>
            <div className="text-sm font-bold text-lime-400">{creditsDisplay}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade CTA — only for non-paid */}
      {!isPaid && (
        <Card className="border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-xl font-bold text-black mb-2">Upgrade Your Account</h3>
            <p className="font-semibold text-black mb-4">Get unlimited access and exclusive features with VIP Annual</p>
            <Button
              onClick={() => window.location.href = '/Pricing'}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
            >
              <Crown className="w-4 h-4 mr-2" />
              View Pricing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
