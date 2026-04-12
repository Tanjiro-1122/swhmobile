import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  User,
  Shield,
  AlertTriangle
} from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Credit pack product IDs and the credits they represent
const CREDIT_PACK_MAPPING = {
  'com.sportswagerhelper.credits.25': 25,
  'com.sportswagerhelper.credits.60': 60,
  'com.sportswagerhelper.credits.100': 100
};

const isCreditPackProduct = (productId) => productId && productId in CREDIT_PACK_MAPPING;

export default function AdminPurchaseAudit() {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchTransactionId, setSearchTransactionId] = useState("");
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [manualActivationReason, setManualActivationReason] = useState("");
  const [selectedSubscriptionType, setSelectedSubscriptionType] = useState("premium_monthly");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await base44.auth.me(),
  });

  const { data: audits, isLoading } = useQuery({
    queryKey: ['purchase-audits', searchEmail],
    queryFn: async () => {
      const query = searchEmail ? { user_email: searchEmail } : {};
      return await base44.entities.PurchaseAudit.filter(query, '-created_date', 100);
    },
  });

  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => await base44.entities.User.list('-created_date', 200),
  });

  const manualActivateMutation = useMutation({
    mutationFn: async ({ userId, subscriptionType, reason, auditId, productId }) => {
      const payload = {
        user_id: userId,
        reason,
        purchase_audit_id: auditId,
        product_id: productId,
      };
      // Only include subscription_type when this isn't a credit pack purchase
      if (!isCreditPackProduct(productId)) {
        payload.subscription_type = subscriptionType;
      }
      return await base44.functions.invoke('manuallyActivateSubscription', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-audits'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setSelectedAudit(null);
      setManualActivationReason("");
    },
  });

  const handleManualActivate = () => {
    if (!selectedAudit || !manualActivationReason) return;

    // For subscription-type activations, a subscription tier must be selected
    if (!isCreditPackProduct(selectedAudit.product_id) && !selectedSubscriptionType) {
      alert('Please select a subscription type');
      return;
    }
    
    const user = users?.find(u => u.email === selectedAudit.user_email);
    if (!user) {
      alert('User not found');
      return;
    }

    manualActivateMutation.mutate({
      userId: user.id,
      subscriptionType: selectedSubscriptionType,
      reason: manualActivationReason,
      auditId: selectedAudit.id,
      productId: selectedAudit.product_id,
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      verified: { icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      failed: { icon: XCircle, color: 'bg-red-100 text-red-800' },
      manually_activated: { icon: Shield, color: 'bg-blue-100 text-blue-800' },
      refunded: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' }
    };
    const { icon: Icon, color } = config[status] || config.pending;
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const trimmedTxSearch = searchTransactionId.trim().toLowerCase();
  const displayedAudits = trimmedTxSearch
    ? audits?.filter((a) => {
        const txId = (a.transaction_id || "").toLowerCase();
        const token = (a.purchase_token || "").toLowerCase();
        return txId.includes(trimmedTxSearch) || token.includes(trimmedTxSearch);
      })
    : audits;

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-gray-600">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="max-w-7xl mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Purchase Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6 flex-wrap">
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by user email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by transaction / order ID..."
                  value={searchTransactionId}
                  onChange={(e) => setSearchTransactionId(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => { setSearchEmail(""); setSearchTransactionId(""); }} variant="outline">
                Clear
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : !displayedAudits || displayedAudits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No purchase records found</div>
            ) : (
              <div className="space-y-4">
                {displayedAudits.map((audit) => (
                  <Card key={audit.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold">{audit.user_email || 'Unknown'}</span>
                            {getStatusBadge(audit.status)}
                            <Badge variant="outline">{audit.platform}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div><strong>Product:</strong> {audit.product_id}</div>
                            <div><strong>Transaction:</strong> {audit.transaction_id || audit.purchase_token?.substring(0, 20) + '...' || 'N/A'}</div>
                            {audit.amount && <div><strong>Amount:</strong> ${audit.amount.toFixed(2)}</div>}
                            {audit.granted_subscription && <div><strong>Granted:</strong> {audit.granted_subscription}</div>}
                            {audit.granted_credits && <div><strong>Credits:</strong> {audit.granted_credits}</div>}
                          </div>

                          {audit.error_message && (
                            <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800 mb-2">
                              <strong>Error:</strong> {audit.error_message}
                            </div>
                          )}

                          {audit.manually_activated_by && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-800 mb-2">
                              <strong>Manually activated by:</strong> {audit.manually_activated_by}
                              <br />
                              <strong>Reason:</strong> {audit.manual_activation_reason}
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            Created: {new Date(audit.created_date).toLocaleString()}
                          </div>
                        </div>

                        {audit.status === 'failed' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedAudit(audit)}
                            className="ml-4"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Manual Activate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Activation Dialog */}
        <Dialog open={!!selectedAudit} onOpenChange={() => setSelectedAudit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isCreditPackProduct(selectedAudit?.product_id)
                  ? 'Manually Grant Credits'
                  : 'Manually Activate Subscription'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <strong>User:</strong> {selectedAudit?.user_email}
              </div>
              <div>
                <strong>Product:</strong> {selectedAudit?.product_id}
              </div>

              {isCreditPackProduct(selectedAudit?.product_id) ? (
                <div className="bg-cyan-50 border border-cyan-200 rounded p-3 text-sm text-cyan-800">
                  <strong>Credits to grant:</strong> {CREDIT_PACK_MAPPING[selectedAudit?.product_id]} search credits
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Subscription Type</label>
                  <Select value={selectedSubscriptionType} onValueChange={setSelectedSubscriptionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium_monthly">Premium Monthly</SelectItem>
                      <SelectItem value="vip_annual">VIP Annual</SelectItem>
                      <SelectItem value="legacy">Legacy (Lifetime)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason for Manual {isCreditPackProduct(selectedAudit?.product_id) ? 'Credit Grant' : 'Activation'}
                </label>
                <Textarea
                  value={manualActivationReason}
                  onChange={(e) => setManualActivationReason(e.target.value)}
                  placeholder="Explain why manual activation is needed (e.g., 'Payment verified via bank statement', 'Apple receipt validation failed but purchase confirmed')..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAudit(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleManualActivate}
                disabled={!manualActivationReason || manualActivateMutation.isPending}
              >
                {manualActivateMutation.isPending
                  ? 'Processing...'
                  : isCreditPackProduct(selectedAudit?.product_id)
                    ? `Grant ${CREDIT_PACK_MAPPING[selectedAudit?.product_id]} Credits`
                    : 'Activate Subscription'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}