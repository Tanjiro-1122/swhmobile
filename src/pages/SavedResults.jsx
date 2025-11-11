import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, User, Users, Trash2, Calendar, Crown, Lock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MatchCard from "../components/sports/MatchCard";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import TeamStatsDisplay from "../components/team/TeamStatsDisplay";
import RequireAuth from "../components/auth/RequireAuth";

function SavedResultsContent() {
  const [activeTab, setActiveTab] = useState("matches");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const hasUnlimitedRetention = currentUser?.subscription_type === 'vip_annual' || currentUser?.subscription_type === 'legacy';
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch matches
  const { data: allMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ['savedMatches', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Match.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  // Fetch player stats
  const { data: allPlayerStats, isLoading: playersLoading } = useQuery({
    queryKey: ['savedPlayerStats', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const stats = await base44.entities.PlayerStats.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
      return stats || [];
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  // Fetch team stats
  const { data: allTeamStats, isLoading: teamsLoading } = useQuery({
    queryKey: ['savedTeamStats', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const stats = await base44.entities.TeamStats.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
      return stats || [];
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  // Filter by retention policy
  const matches = hasUnlimitedRetention 
    ? allMatches 
    : allMatches.filter(m => new Date(m.created_date) >= thirtyDaysAgo);

  const playerStats = hasUnlimitedRetention 
    ? allPlayerStats 
    : allPlayerStats.filter(p => new Date(p.created_date) >= thirtyDaysAgo);

  const teamStats = hasUnlimitedRetention 
    ? allTeamStats 
    : allTeamStats.filter(t => new Date(t.created_date) >= thirtyDaysAgo);

  // Delete mutations
  const deleteMatchMutation = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedMatches'] }),
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerStats.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedPlayerStats'] }),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamStats.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedTeamStats'] }),
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">Saved Results</h1>
              <p className="text-gray-600 text-lg">Your complete betting analysis history</p>
            </div>
            {hasUnlimitedRetention && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 text-sm font-bold">
                <Crown className="w-4 h-4 mr-2" />
                UNLIMITED RETENTION
              </Badge>
            )}
          </div>

          {/* Retention Policy Banner */}
          {!hasUnlimitedRetention && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    📅 30-Day History Limit
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Your saved results are automatically deleted after 30 days. 
                    <strong> Upgrade to VIP Annual</strong> for unlimited retention and access to your complete betting history forever!
                  </p>
                  <Button
                    onClick={() => window.location.href = '/Pricing'}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to VIP Annual
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white p-2 rounded-xl shadow-md">
            <TabsTrigger value="matches" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              Matches ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Players ({playerStats.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Teams ({teamStats.length})
            </TabsTrigger>
          </TabsList>

          {/* Matches Tab */}
          <TabsContent value="matches">
            {matchesLoading ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto text-emerald-500 animate-spin mb-4" />
                <p className="text-gray-600">Loading matches...</p>
              </div>
            ) : matches.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-6">
                {matches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onDelete={deleteMatchMutation.mutate}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No saved matches</h3>
                  <p className="text-gray-600 mb-4">
                    {hasUnlimitedRetention 
                      ? "Start analyzing matches from the Dashboard!"
                      : "You don't have any matches saved in the last 30 days."}
                  </p>
                  <Button onClick={() => window.location.href = '/Dashboard'}>
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players">
            {playersLoading ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600">Loading player stats...</p>
              </div>
            ) : playerStats.length > 0 ? (
              <div className="space-y-6">
                {playerStats.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PlayerStatsDisplay player={player} onDelete={deletePlayerMutation.mutate} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-12 text-center">
                  <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No saved player stats</h3>
                  <p className="text-gray-600 mb-4">
                    {hasUnlimitedRetention 
                      ? "Start analyzing players from the Player Stats page!"
                      : "You don't have any player stats saved in the last 30 days."}
                  </p>
                  <Button onClick={() => window.location.href = '/PlayerStats'}>
                    Go to Player Stats
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            {teamsLoading ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto text-orange-500 animate-spin mb-4" />
                <p className="text-gray-600">Loading team stats...</p>
              </div>
            ) : teamStats.length > 0 ? (
              <div className="space-y-6">
                {teamStats.map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TeamStatsDisplay team={team} onDelete={deleteTeamMutation.mutate} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No saved team stats</h3>
                  <p className="text-gray-600 mb-4">
                    {hasUnlimitedRetention 
                      ? "Start analyzing teams from the Team Stats page!"
                      : "You don't have any team stats saved in the last 30 days."}
                  </p>
                  <Button onClick={() => window.location.href = '/TeamStats'}>
                    Go to Team Stats
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SavedResults() {
  return (
    <RequireAuth pageName="Saved Results">
      <SavedResultsContent />
    </RequireAuth>
  );
}