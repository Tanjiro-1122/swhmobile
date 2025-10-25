import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Trophy, User, Shield, Trash2, Filter, SortAsc } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import MatchCard from "../components/sports/MatchCard";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import TeamStatsDisplay from "../components/team/TeamStatsDisplay";

export default function SavedResults() {
  const [sportFilter, setSportFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
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

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches', currentUser?.email],
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

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.PlayerStats.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.TeamStats.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const deleteMatchMutation = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerStats.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamStats.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });

  const filterAndSortData = (data) => {
    if (!data) return [];
    
    let filtered = data;
    if (sportFilter !== "all") {
      filtered = data.filter(item => 
        item.sport?.toLowerCase().includes(sportFilter.toLowerCase())
      );
    }

    let sorted = [...filtered];
    switch (sortBy) {
      case "recent":
        sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        break;
      case "az":
        sorted.sort((a, b) => {
          const nameA = a.home_team || a.player_name || a.team_name || "";
          const nameB = b.home_team || b.player_name || b.team_name || "";
          return nameA.localeCompare(nameB);
        });
        break;
      case "za":
        sorted.sort((a, b) => {
          const nameA = a.home_team || a.player_name || a.team_name || "";
          const nameB = b.home_team || b.player_name || b.team_name || "";
          return nameB.localeCompare(nameA);
        });
        break;
    }

    return sorted;
  };

  const filteredMatches = filterAndSortData(matches);
  const filteredPlayers = filterAndSortData(players);
  const filteredTeams = filterAndSortData(teams);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Bookmark className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black">Saved Results</h1>
                <p className="text-purple-100">Your analyzed matches, players, and teams</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="baseball">Baseball</SelectItem>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="soccer">Soccer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-slate-400" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="az">A to Z</SelectItem>
                  <SelectItem value="za">Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-slate-300 border-slate-600">
              <Trophy className="w-3 h-3 mr-1" />
              {filteredMatches.length} Matches
            </Badge>
            <Badge variant="outline" className="text-slate-300 border-slate-600">
              <User className="w-3 h-3 mr-1" />
              {filteredPlayers.length} Players
            </Badge>
            <Badge variant="outline" className="text-slate-300 border-slate-600">
              <Shield className="w-3 h-3 mr-1" />
              {filteredTeams.length} Teams
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="matches" className="data-[state=active]:bg-indigo-600">
              <Trophy className="w-4 h-4 mr-2" />
              Matches ({filteredMatches.length})
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-purple-600">
              <User className="w-4 h-4 mr-2" />
              Players ({filteredPlayers.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-pink-600">
              <Shield className="w-4 h-4 mr-2" />
              Teams ({filteredTeams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            {matchesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto" />
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-6">
                {filteredMatches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onDelete={deleteMatchMutation.mutate}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 text-lg">No saved matches yet</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Start analyzing matches to see them here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="players">
            {playersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
              </div>
            ) : filteredPlayers.length > 0 ? (
              <div className="space-y-6">
                {filteredPlayers.map((player, index) => (
                  <PlayerStatsDisplay
                    key={player.id}
                    player={player}
                    onDelete={deletePlayerMutation.mutate}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-12 text-center">
                  <User className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 text-lg">No saved players yet</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Start analyzing players to see them here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="teams">
            {teamsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
              </div>
            ) : filteredTeams.length > 0 ? (
              <div className="space-y-6">
                {filteredTeams.map((team, index) => (
                  <TeamStatsDisplay
                    key={team.id}
                    team={team}
                    onDelete={deleteTeamMutation.mutate}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-12 text-center">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 text-lg">No saved teams yet</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Start analyzing teams to see them here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}