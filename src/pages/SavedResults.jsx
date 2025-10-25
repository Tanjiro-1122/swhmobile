
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Trophy, User, Shield, Trash2, Filter, SortAsc } from "lucide-react"; // Removed non-existent icons
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
  const [activeTab, setActiveTab] = useState("matches");
  const [filterSport, setFilterSport] = useState("all");
  const [sortOrder, setSortOrder] = useState("-created_date"); // Default to most recent
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch user's saved matches
  const { data: rawMatches, isLoading: matchesLoading } = useQuery({
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

  // Fetch user's saved players
  const { data: rawPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ['savedPlayers', currentUser?.email],
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

  // Fetch user's saved teams
  const { data: rawTeams, isLoading: teamsLoading } = useQuery({
    queryKey: ['savedTeams', currentUser?.email],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedMatches'] });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerStats.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPlayers'] });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamStats.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedTeams'] });
    },
  });

  const clearAllMatches = async () => {
    if (window.confirm('Are you sure you want to delete all saved matches?')) {
      for (const match of rawMatches) {
        await deleteMatchMutation.mutateAsync(match.id);
      }
    }
  };

  const clearAllPlayers = async () => {
    if (window.confirm('Are you sure you want to delete all saved players?')) {
      for (const player of rawPlayers) {
        await deletePlayerMutation.mutateAsync(player.id);
      }
    }
  };

  const clearAllTeams = async () => {
    if (window.confirm('Are you sure you want to delete all saved teams?')) {
      for (const team of rawTeams) {
        await deleteTeamMutation.mutateAsync(team.id);
      }
    }
  };

  // Filtering and Sorting Logic
  const getFilteredAndSortedData = (data, nameKey = 'team_name', sportKey = 'sport') => {
    let filteredData = data;

    if (filterSport !== "all") {
      filteredData = filteredData.filter(item => item[sportKey]?.toLowerCase() === filterSport);
    }

    // Sort order: -created_date (newest), created_date (oldest), name_asc (A-Z), name_desc (Z-A)
    return [...filteredData].sort((a, b) => {
      if (sortOrder === "-created_date") {
        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      } else if (sortOrder === "created_date") {
        return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
      } else if (sortOrder === "name_asc") {
        return (a[nameKey] || '').localeCompare(b[nameKey] || '');
      } else if (sortOrder === "name_desc") {
        return (b[nameKey] || '').localeCompare(a[nameKey] || '');
      }
      return 0;
    });
  };

  const matches = getFilteredAndSortedData(rawMatches, 'home_team', 'sport'); // Match uses home_team for name and sport for sportKey
  const players = getFilteredAndSortedData(rawPlayers, 'player_name', 'sport');
  const teams = getFilteredAndSortedData(rawTeams, 'team_name', 'sport');

  const totalSaved = (matches?.length || 0) + (players?.length || 0) + (teams?.length || 0);

  // Extract unique sports for filters
  const uniqueSports = [
    ...new Set([
      ...(rawMatches || []).map(m => m.sport?.toLowerCase()),
      ...(rawPlayers || []).map(p => p.sport?.toLowerCase()),
      ...(rawTeams || []).map(t => t.sport?.toLowerCase()),
    ].filter(Boolean))
  ].sort();


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Bookmark className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold">My Saved Results</h1>
          </div>
          <p className="text-indigo-100 text-lg max-w-2xl">
            All your analyzed matches, players, and teams in one place. Only you can see these results.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Badge className="bg-white/20 text-white border-white/30 text-base px-4 py-2">
              {totalSaved} Total Saved
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 text-base px-4 py-2">
              {matches?.length || 0} Matches
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 text-base px-4 py-2">
              {players?.length || 0} Players
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 text-base px-4 py-2">
              {teams?.length || 0} Teams
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="matches" className="flex items-center gap-2 py-3">
              <Trophy className="w-4 h-4" />
              <div>
                <div className="font-semibold">Matches</div>
                <div className="text-xs text-gray-500">{matches?.length || 0} saved</div>
              </div>
            </TabsTrigger>
            <TabsTrigger value="players" className="flex items-center gap-2 py-3">
              <User className="w-4 h-4" />
              <div>
                <div className="font-semibold">Players</div>
                <div className="text-xs text-gray-500">{players?.length || 0} saved</div>
              </div>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2 py-3">
              <Shield className="w-4 h-4" />
              <div>
                <div className="font-semibold">Teams</div>
                <div className="text-xs text-gray-500">{teams?.length || 0} saved</div>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Filters and Sorting */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filter by Sport:</span>
              <Select value={filterSport} onValueChange={setFilterSport}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {uniqueSports.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport.charAt(0).toUpperCase() + sport.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <SortAsc className="w-4 h-4" />
              <span className="font-medium">Sort by:</span>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Most Recent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_date">Most Recent</SelectItem>
                  <SelectItem value="created_date">Oldest</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-6">
            {matches && matches.length > 0 && (
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Saved Matches ({matches.length})
                </h2>
                <Button
                  variant="outline"
                  onClick={clearAllMatches}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}

            {matchesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
                <p className="text-gray-600 mt-4">Loading your saved matches...</p>
              </div>
            ) : matches && matches.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Saved Matches</h3>
                <p className="text-gray-600">
                  Search for matches on the Match Analysis page to save them here
                </p>
              </motion.div>
            )}
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-6">
            {players && players.length > 0 && (
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Saved Players ({players.length})
                </h2>
                <Button
                  variant="outline"
                  onClick={clearAllPlayers}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}

            {playersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
                <p className="text-gray-600 mt-4">Loading your saved players...</p>
              </div>
            ) : players && players.length > 0 ? (
              <div className="space-y-6">
                {players.map((player, index) => (
                  <PlayerStatsDisplay
                    key={player.id}
                    player={player}
                    onDelete={deletePlayerMutation.mutate}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Saved Players</h3>
                <p className="text-gray-600">
                  Search for players on the Player Stats page to save them here
                </p>
              </motion.div>
            )}
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            {teams && teams.length > 0 && (
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Saved Teams ({teams.length})
                </h2>
                <Button
                  variant="outline"
                  onClick={clearAllTeams}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}

            {teamsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
                <p className="text-gray-600 mt-4">Loading your saved teams...</p>
              </div>
            ) : teams && teams.length > 0 ? (
              <div className="space-y-6">
                {teams.map((team, index) => (
                  <TeamStatsDisplay
                    key={team.id}
                    team={team}
                    onDelete={deleteTeamMutation.mutate}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Saved Teams</h3>
                <p className="text-gray-600">
                  Search for teams on the Team Stats page to save them here
                </p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
