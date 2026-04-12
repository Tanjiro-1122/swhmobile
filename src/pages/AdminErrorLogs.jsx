import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle,
  Info,
  AlertTriangle,
  XOctagon,
  CheckCircle,
  Search,
  Shield
} from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminErrorLogs() {
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedError, setSelectedError] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await base44.auth.me(),
  });

  const { data: errors, isLoading } = useQuery({
    queryKey: ['error-logs', filterType, filterSeverity],
    queryFn: async () => {
      let query = {};
      if (filterType !== 'all') query.error_type = filterType;
      if (filterSeverity !== 'all') query.severity = filterSeverity;
      
      return await base44.entities.ErrorLog.filter(query, '-created_date', 100);
    },
  });

  const markResolvedMutation = useMutation({
    mutationFn: async ({ errorId, notes }) => {
      return await base44.entities.ErrorLog.update(errorId, {
        resolved: true,
        resolution_notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      setSelectedError(null);
      setResolutionNotes("");
    },
  });

  const getSeverityIcon = (severity) => {
    const config = {
      info: { icon: Info, color: 'text-blue-500' },
      warning: { icon: AlertTriangle, color: 'text-yellow-500' },
      error: { icon: AlertCircle, color: 'text-red-500' },
      critical: { icon: XOctagon, color: 'text-red-700' }
    };
    const { icon: Icon, color } = config[severity] || config.error;
    return <Icon className={`w-5 h-5 ${color}`} />;
  };

  const getSeverityBadge = (severity) => {
    const config = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900 font-bold'
    };
    return <Badge className={config[severity]}>{severity}</Badge>;
  };

  const getTypeBadge = (type) => {
    const config = {
      auth: 'bg-purple-100 text-purple-800',
      iap: 'bg-green-100 text-green-800',
      stripe: 'bg-blue-100 text-blue-800',
      api: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={config[type]} variant="outline">{type}</Badge>;
  };

  const filteredErrors = errors?.filter(error => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      error.function_name?.toLowerCase().includes(search) ||
      error.error_message?.toLowerCase().includes(search) ||
      error.user_email?.toLowerCase().includes(search)
    );
  });

  const unresolvedCount = errors?.filter(e => !e.resolved).length || 0;

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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Error Logs
              </div>
              {unresolvedCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unresolvedCount} Unresolved
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search errors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="iap">IAP</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : !filteredErrors || filteredErrors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No errors found</div>
            ) : (
              <div className="space-y-4">
                {filteredErrors.map((error) => (
                  <Card key={error.id} className={`border-2 ${error.resolved ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getSeverityIcon(error.severity)}
                            <span className="font-semibold">{error.function_name}</span>
                            {getSeverityBadge(error.severity)}
                            {getTypeBadge(error.error_type)}
                            {error.resolved && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-700 mb-2">
                            {error.error_message}
                          </div>

                          {error.user_email && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>User:</strong> {error.user_email}
                            </div>
                          )}

                          {error.context && Object.keys(error.context).length > 0 && (
                            <details className="text-xs text-gray-600 mb-2">
                              <summary className="cursor-pointer hover:text-gray-900">Context</summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                                {JSON.stringify(error.context, null, 2)}
                              </pre>
                            </details>
                          )}

                          {error.error_stack && (
                            <details className="text-xs text-gray-600 mb-2">
                              <summary className="cursor-pointer hover:text-gray-900">Stack Trace</summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto text-xs">
                                {error.error_stack}
                              </pre>
                            </details>
                          )}

                          {error.resolution_notes && (
                            <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-800 mt-2">
                              <strong>Resolution:</strong> {error.resolution_notes}
                            </div>
                          )}

                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(error.created_date).toLocaleString()}
                          </div>
                        </div>

                        {!error.resolved && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedError(error)}
                            className="ml-4"
                          >
                            Mark Resolved
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

        {/* Resolution Dialog */}
        <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Error as Resolved</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <strong>Error:</strong> {selectedError?.error_message}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Resolution Notes</label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this was resolved or why it can be ignored..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedError(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => markResolvedMutation.mutate({ 
                  errorId: selectedError.id, 
                  notes: resolutionNotes 
                })}
                disabled={markResolvedMutation.isPending}
              >
                {markResolvedMutation.isPending ? 'Saving...' : 'Mark Resolved'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}