import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, User, Users, Trash2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MatchCard from "../sports/MatchCard";
import PlayerStatsDisplay from "../player/PlayerStatsDisplay";
import TeamStatsDisplay from "../team/TeamStatsDisplay";

const ITEMS_PER_PAGE = 10;

export default function SavedResultsContent() {
  const [activeTab, setActiveTab] = useState("matches");
  const [matchesDisplayed, setMatchesDisplayed] = useState(ITEMS_PER_PAGE);
  const [playersDisplayed, setPlayersDisplayed] = useState(ITEMS_PER_PAGE);
  const [teamsDisplayed, setTeamsDisplayed] = useState(ITEMS_PER_PAGE);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const hasUnlimitedRetention = currentUser?.subscription_type === 'vip_annual' || currentUser?.subscription_type === 'legacy';
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: allMatches = [], isLoading: matchesLoading, error: matchesError } = useQuery({
    queryKey: ['savedMatches', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      try {
        return await base44.entities.Match.filter({ created_by: currentUser.email }, '-created_date');
      } catch (err) {
        console.error('Error fetching matches:', err);
        return [];
      }
    },
    enabled: !!currentUser?.email,
    refetchOnWindowFocus: true,
  });

  const { data: allPlayerStats = [], isLoading: playersLoading, error: playersError } = useQuery({
    queryKey: ['savedPlayerStats', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      try {
        return await base44.entities.PlayerStats.filter({ created_by: currentUser.email }, '-created_date');
      } catch (err) {
        console.error('Error fetching player stats:', err);
        return [];
      }
    },
    enabled: !!currentUser?.email,
    refetchOnWindowFocus: true,
  });

  const { data: allTeamStats = [], isLoading: teamsLoading, error: teamsError } = useQuery({
    queryKey: ['savedTeamStats', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      try {
        return await base44.entities.TeamStats.filter({ created_by: currentUser.email }, '-created_date');
      } catch (err) {
        console.error('Error fetching team stats:', err);
        return [];
      }
    },
    enabled: !!currentUser?.email,
    refetchOnWindowFocus: true,
  });

  const filteredMatches = hasUnlimitedRetention ? allMatches : allMatches.filter(m => new Date(m.created_date) >= thirtyDaysAgo);
  const filteredPlayerStats = hasUnlimitedRetention ? allPlayerStats : allPlayerStats.filter(p => new Date(p.created_date) >= thirtyDaysAgo);
  const filteredTeamStats = hasUnlimitedRetention ? allTeamStats : allTeamStats.filter(t => new Date(t.created_date) >= thirtyDaysAgo);

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

  return (
    <div className="space-y-6">
      {!hasUnlimitedRetention && (
        <Card className="border border-orange-500/30 bg-orange-500/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-sm text-orange-200">
              📅 <strong className="text-orange-100">30-Day History Limit:</strong> Upgrade to VIP Annual for unlimited retention.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm p-2 rounded-xl border border-white/20">
          <TabsTrigger value="matches" className="text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
            <Trophy className="w-4 h-4 mr-2" />
            Matches ({filteredMatches.length})
          </TabsTrigger>
          <TabsTrigger value="players" className="text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            Players ({filteredPlayerStats.length})
          </TabsTrigger>
          <TabsTrigger value="teams" className="text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Teams ({filteredTeamStats.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          {matchesLoading ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-emerald-500 animate-spin mb-4" />
            </div>
          ) : filteredMatches.length > 0 ? (
            <>
              <div className="grid lg:grid-cols-2 gap-6">
                {filteredMatches.slice(0, matchesDisplayed).map((match, index) => (
                  <MatchCard key={match.id} match={match} onDelete={deleteMatchMutation.mutate} index={index} />
                ))}
              </div>
              {filteredMatches.length > matchesDisplayed && (
                <div className="text-center mt-6">
                  <Button variant="outline" onClick={() => setMatchesDisplayed(prev => prev + ITEMS_PER_PAGE)}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                  alt="S.A.L. the Owl"
                  className="w-20 h-20 mx-auto rounded-2xl mb-4 opacity-70"
                />
                <h3 className="text-xl font-bold text-white mb-2">No saved matches yet</h3>
                <p className="text-slate-400 text-sm mb-4">Ask S.A.L. about any matchup to get started!</p>
                <Button onClick={() => window.location.href = '/Dashboard'}>Go to Dashboard</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="players">
          {playersLoading ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
            </div>
          ) : filteredPlayerStats.length > 0 ? (
            <>
              <div className="space-y-6">
                {filteredPlayerStats.slice(0, playersDisplayed).map((player, index) => (
                  <motion.div key={player.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.5) }}>
                    <PlayerStatsDisplay player={player} onDelete={deletePlayerMutation.mutate} />
                  </motion.div>
                ))}
              </div>
              {filteredPlayerStats.length > playersDisplayed && (
                <div className="text-center mt-6">
                  <Button variant="outline" onClick={() => setPlayersDisplayed(prev => prev + ITEMS_PER_PAGE)}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                  alt="S.A.L. the Owl"
                  className="w-20 h-20 mx-auto rounded-2xl mb-4 opacity-70"
                />
                <h3 className="text-xl font-bold text-white mb-2">No saved player stats</h3>
                <p className="text-slate-400 text-sm">Search for any player and S.A.L. will analyze their performance!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="teams">
          {teamsLoading ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-orange-500 animate-spin mb-4" />
            </div>
          ) : filteredTeamStats.length > 0 ? (
            <>
              <div className="space-y-6">
                {filteredTeamStats.slice(0, teamsDisplayed).map((team, index) => (
                  <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.5) }}>
                    <TeamStatsDisplay team={team} onDelete={deleteTeamMutation.mutate} />
                  </motion.div>
                ))}
              </div>
              {filteredTeamStats.length > teamsDisplayed && (
                <div className="text-center mt-6">
                  <Button variant="outline" onClick={() => setTeamsDisplayed(prev => prev + ITEMS_PER_PAGE)}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                  alt="S.A.L. the Owl"
                  className="w-20 h-20 mx-auto rounded-2xl mb-4 opacity-70"
                />
                <h3 className="text-xl font-bold text-white mb-2">No saved team stats</h3>
                <p className="text-slate-400 text-sm">Look up any team and let S.A.L. break down the numbers!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}