import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Lock,
  Loader2,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import DataExportConsentGate from "./DataExportConsentGate";
import DataExportOptions from "./DataExportOptions";

export default function DataExportContent() {
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const hasConsent = currentUser?.data_storage_consent === true;

  const consentMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        data_storage_consent: true,
        data_storage_consent_date: new Date().toISOString()
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
  });

  const revokeConsentMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        data_storage_consent: false,
        data_storage_consent_date: null
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!hasConsent) {
    return (
      <DataExportConsentGate 
        onAccept={() => consentMutation.mutate()} 
        isLoading={consentMutation.isPending} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Status Banner */}
      <Card className="border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-300 font-semibold text-sm">Data Storage Authorized</p>
                <p className="text-emerald-400/70 text-xs">
                  Consented on {currentUser?.data_storage_consent_date 
                    ? format(new Date(currentUser.data_storage_consent_date), 'MMMM d, yyyy') 
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Lock className="w-3 h-3 mr-1" />
                Encrypted
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => revokeConsentMutation.mutate()}
                disabled={revokeConsentMutation.isPending}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
              >
                {revokeConsentMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Trash2 className="w-3 h-3 mr-1" />
                )}
                Revoke Consent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <DataExportOptions userEmail={currentUser?.email} />
    </div>
  );
}