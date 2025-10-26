import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

export default function Alerts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alert_type: "odds_change",
    match_description: "",
    trigger_condition: ""
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Alert.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const createAlertMutation = useMutation({
    mutationFn: (alertData) => base44.entities.Alert.create(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setDialogOpen(false);
      setNewAlert({
        alert_type: "odds_change",
        match_description: "",
        trigger_condition: ""
      });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.Alert.update(id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const handleCreateAlert = () => {
    createAlertMutation.mutate(newAlert);
  };

  const getAlertTypeIcon = (type) => {
    switch(type) {
      case 'odds_change': return '💰';
      case 'injury_report': return '🏥';
      case 'line_movement': return '📈';
      case 'game_start': return '🕐';
      default: return '🔔';
    }
  };

  const getAlertTypeColor = (type) => {
    switch(type) {
      case 'odds_change': return 'bg-green-100 text-green-800 border-green-300';
      case 'injury_report': return 'bg-red-100 text-red-800 border-red-300';
      case 'line_movement': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'game_start': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Sign in to set up custom alerts for your bets
            </p>
            <Button
              onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Bet Alerts</h1>
                <p className="text-gray-600">Get notified when conditions are met</p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Create New Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Alert Type
                    </label>
                    <Select value={newAlert.alert_type} onValueChange={(value) => setNewAlert({...newAlert, alert_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="odds_change">💰 Odds Change</SelectItem>
                        <SelectItem value="injury_report">🏥 Injury Report</SelectItem>
                        <SelectItem value="line_movement">📈 Line Movement</SelectItem>
                        <SelectItem value="game_start">🕐 Game Starting Soon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Match or Player
                    </label>
                    <Input
                      placeholder="e.g., Lakers vs Celtics, LeBron James"
                      value={newAlert.match_description}
                      onChange={(e) => setNewAlert({...newAlert, match_description: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trigger Condition
                    </label>
                    <Textarea
                      placeholder="e.g., 'Notify when Lakers spread moves to -4.5 or better', 'Alert if LeBron is listed as questionable'"
                      value={newAlert.trigger_condition}
                      onChange={(e) => setNewAlert({...newAlert, trigger_condition: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <p className="text-sm text-indigo-800">
                      💡 <strong>Tip:</strong> Be specific with your conditions. For example: "Alert when moneyline odds reach +150 or better" or "Notify 1 hour before game starts"
                    </p>
                  </div>

                  <Button
                    onClick={handleCreateAlert}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
                    disabled={!newAlert.match_description || !newAlert.trigger_condition}
                  >
                    Create Alert
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
              <p className="text-gray-600 mt-4">Loading your alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Alerts Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create alerts to get notified about odds changes, injuries, and more
                </p>
                <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  Create Your First Alert
                </Button>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-2 ${alert.is_active ? 'border-indigo-200' : 'border-gray-200 opacity-60'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{getAlertTypeIcon(alert.alert_type)}</span>
                          <div>
                            <Badge className={getAlertTypeColor(alert.alert_type)}>
                              {alert.alert_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {alert.match_description}
                        </h3>
                        
                        <p className="text-gray-700 mb-4">
                          {alert.trigger_condition}
                        </p>

                        {alert.triggered_count > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Triggered {alert.triggered_count} time{alert.triggered_count !== 1 ? 's' : ''}</span>
                            {alert.last_triggered && (
                              <span>• Last: {new Date(alert.last_triggered).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alert.is_active}
                            onCheckedChange={(checked) => toggleAlertMutation.mutate({ id: alert.id, isActive: checked })}
                          />
                          <span className="text-sm text-gray-600">
                            {alert.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAlertMutation.mutate(alert.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Info Card */}
        <Card className="mt-8 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-3">📬 How Alerts Work</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• <strong>Odds Change:</strong> Get notified when betting odds reach your target</li>
              <li>• <strong>Injury Report:</strong> Instant alerts when key players are injured</li>
              <li>• <strong>Line Movement:</strong> Track significant line movements (sharp money indicators)</li>
              <li>• <strong>Game Starting Soon:</strong> Reminders before games start</li>
            </ul>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                ⚠️ Note: Alerts are checked periodically. For real-time updates, upgrade to Premium.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}