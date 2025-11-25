import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, User, Users, Trash2, Calendar, Crown, Lock, Sparkles, Filter, X, SortAsc, SortDesc, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MatchCard from "../components/sports/MatchCard";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import TeamStatsDisplay from "../components/team/TeamStatsDisplay";
import RequireAuth from "../components/auth/RequireAuth";

const ITEMS_PER_PAGE = 20;

function SavedResultsContent() {
  const [activeTab, setActiveTab] = useState("matches");
  const queryClient = useQueryClient();

  // Pagination states
  const [matchesDisplayed, setMatchesDisplayed] = useState(ITEMS_PER_PAGE);
  const [playersDisplayed, setPlayersDisplayed] = useState(ITEMS_PER_PAGE);
  const [teamsDisplayed, setTeamsDisplayed] = useState(ITEMS_PER_PAGE);

  // Filter states
  const [sportFilter, setSportFilter] = useState("all");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all"); // all, week, month, 3months
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc, date_asc, name_asc, name_desc, probability_desc
  const [confidenceFilter, setConfidenceFilter] = useState("all"); // all, high, medium, low
  const [showFilters, setShowFilters] = useState(false);

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

  // Helper function to get date range filter
  const getDateRangeFilter = (createdDate) => {
    const date = new Date(createdDate);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    
    switch (dateRange) {
      case 'week':
        return diffDays <= 7;
      case 'month':
        return diffDays <= 30;
      case '3months':
        return diffDays <= 90;
      case 'all':
      default:
        return true;
    }
  };

  // Extract unique sports and leagues
  const uniqueSports = useMemo(() => {
    const sports = new Set();
    [...allMatches, ...allPlayerStats, ...allTeamStats].forEach(item => {
      if (item.sport) sports.add(item.sport);
    });
    return Array.from(sports).sort();
  }, [allMatches, allPlayerStats, allTeamStats]);

  const uniqueLeagues = useMemo(() => {
    const leagues = new Set();
    [...allMatches, ...allPlayerStats, ...allTeamStats].forEach(item => {
      if (item.league) leagues.add(item.league);
    });
    return Array.from(leagues).sort();
  }, [allMatches, allPlayerStats, allTeamStats]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    let filtered = hasUnlimitedRetention 
      ? allMatches 
      : allMatches.filter(m => new Date(m.created_date) >= thirtyDaysAgo);

    // Apply filters
    if (sportFilter !== 'all') {
      filtered = filtered.filter(m => m.sport === sportFilter);
    }
    if (leagueFilter !== 'all') {
      filtered = filtered.filter(m => m.league === leagueFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.home_team?.toLowerCase().includes(query) ||
        m.away_team?.toLowerCase().includes(query) ||
        m.sport?.toLowerCase().includes(query) ||
        m.league?.toLowerCase().includes(query)
      );
    }
    if (confidenceFilter !== 'all') {
      filtered = filtered.filter(m => 
        m.prediction?.confidence?.toLowerCase().includes(confidenceFilter)
      );
    }
    filtered = filtered.filter(m => getDateRangeFilter(m.created_date));

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'date_asc':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'name_asc':
          return (a.home_team || '').localeCompare(b.home_team || '');
        case 'name_desc':
          return (b.home_team || '').localeCompare(a.home_team || '');
        case 'probability_desc':
          return (b.home_win_probability || 0) - (a.home_win_probability || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allMatches, sportFilter, leagueFilter, searchQuery, confidenceFilter, dateRange, sortBy, hasUnlimitedRetention, thirtyDaysAgo]);

  // Filter and sort player stats
  const filteredPlayerStats = useMemo(() => {
    let filtered = hasUnlimitedRetention 
      ? allPlayerStats 
      : allPlayerStats.filter(p => new Date(p.created_date) >= thirtyDaysAgo);

    if (sportFilter !== 'all') {
      filtered = filtered.filter(p => p.sport === sportFilter);
    }
    if (leagueFilter !== 'all') {
      filtered = filtered.filter(p => p.league === leagueFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.player_name?.toLowerCase().includes(query) ||
        p.team?.toLowerCase().includes(query) ||
        p.sport?.toLowerCase().includes(query) ||
        p.position?.toLowerCase().includes(query)
      );
    }
    if (confidenceFilter !== 'all') {
      filtered = filtered.filter(p => 
        p.next_game?.confidence?.toLowerCase().includes(confidenceFilter)
      );
    }
    filtered = filtered.filter(p => getDateRangeFilter(p.created_date));

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'date_asc':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'name_asc':
          return (a.player_name || '').localeCompare(b.player_name || '');
        case 'name_desc':
          return (b.player_name || '').localeCompare(a.player_name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [allPlayerStats, sportFilter, leagueFilter, searchQuery, confidenceFilter, dateRange, sortBy, hasUnlimitedRetention, thirtyDaysAgo]);

  // Filter and sort team stats
  const filteredTeamStats = useMemo(() => {
    let filtered = hasUnlimitedRetention 
      ? allTeamStats 
      : allTeamStats.filter(t => new Date(t.created_date) >= thirtyDaysAgo);

    if (sportFilter !== 'all') {
      filtered = filtered.filter(t => t.sport === sportFilter);
    }
    if (leagueFilter !== 'all') {
      filtered = filtered.filter(t => t.league === leagueFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.team_name?.toLowerCase().includes(query) ||
        t.sport?.toLowerCase().includes(query) ||
        t.league?.toLowerCase().includes(query)
      );
    }
    if (confidenceFilter !== 'all') {
      filtered = filtered.filter(t => 
        t.next_game?.confidence?.toLowerCase().includes(confidenceFilter)
      );
    }
    filtered = filtered.filter(t => getDateRangeFilter(t.created_date));

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'date_asc':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'name_asc':
          return (a.team_name || '').localeCompare(b.team_name || '');
        case 'name_desc':
          return (b.team_name || '').localeCompare(a.team_name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [allTeamStats, sportFilter, leagueFilter, searchQuery, confidenceFilter, dateRange, sortBy, hasUnlimitedRetention, thirtyDaysAgo]);

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

  const clearFilters = () => {
    setSportFilter("all");
    setLeagueFilter("all");
    setSearchQuery("");
    setDateRange("all");
    setConfidenceFilter("all");
    setSortBy("date_desc");
    // Reset pagination when filters change
    setMatchesDisplayed(ITEMS_PER_PAGE);
    setPlayersDisplayed(ITEMS_PER_PAGE);
    setTeamsDisplayed(ITEMS_PER_PAGE);
  };

  const hasActiveFilters = sportFilter !== "all" || leagueFilter !== "all" || searchQuery !== "" || dateRange !== "all" || confidenceFilter !== "all" || sortBy !== "date_desc";

  // Paginated data
  const paginatedMatches = filteredMatches.slice(0, matchesDisplayed);
  const paginatedPlayerStats = filteredPlayerStats.slice(0, playersDisplayed);
  const paginatedTeamStats = filteredTeamStats.slice(0, teamsDisplayed);

  const hasMoreMatches = filteredMatches.length > matchesDisplayed;
  const hasMorePlayers = filteredPlayerStats.length > playersDisplayed;
  const hasMoreTeams = filteredTeamStats.length > teamsDisplayed;

  const loadMoreMatches = () => setMatchesDisplayed(prev => prev + ITEMS_PER_PAGE);
  const loadMorePlayers = () => setPlayersDisplayed(prev => prev + ITEMS_PER_PAGE);
  const loadMoreTeams = () => setTeamsDisplayed(prev => prev + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
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

        {/* Filters & Search Section */}
        <Card className="mb-8 border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-700" />
                <CardTitle className="text-lg">Filters & Search</CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {/* Search */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Team, player, league..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Sport Filter */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Sport</label>
                      <Select value={sportFilter} onValueChange={setSportFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Sports" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sports</SelectItem>
                          {uniqueSports.map(sport => (
                            <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* League Filter */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">League</label>
                      <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Leagues" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Leagues</SelectItem>
                          {uniqueLeagues.map(league => (
                            <SelectItem key={league} value={league}>{league}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Date Range</label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="week">Last 7 Days</SelectItem>
                          <SelectItem value="month">Last 30 Days</SelectItem>
                          <SelectItem value="3months">Last 3 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Confidence Filter */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Confidence</label>
                      <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Confidence" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Confidence</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Sort By</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date_desc">
                            <div className="flex items-center gap-2">
                              <SortDesc className="w-4 h-4" />
                              Newest First
                            </div>
                          </SelectItem>
                          <SelectItem value="date_asc">
                            <div className="flex items-center gap-2">
                              <SortAsc className="w-4 h-4" />
                              Oldest First
                            </div>
                          </SelectItem>
                          <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                          <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                          {activeTab === 'matches' && (
                            <SelectItem value="probability_desc">Win % (High to Low)</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">Active Filters:</span>
                      {sportFilter !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          Sport: {sportFilter}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setSportFilter('all')} />
                        </Badge>
                      )}
                      {leagueFilter !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          League: {leagueFilter}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setLeagueFilter('all')} />
                        </Badge>
                      )}
                      {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                          Search: "{searchQuery}"
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                        </Badge>
                      )}
                      {dateRange !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {dateRange === 'week' ? 'Last 7 Days' : dateRange === 'month' ? 'Last 30 Days' : 'Last 3 Months'}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setDateRange('all')} />
                        </Badge>
                      )}
                      {confidenceFilter !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {confidenceFilter.charAt(0).toUpperCase() + confidenceFilter.slice(1)} Confidence
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setConfidenceFilter('all')} />
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white p-2 rounded-xl shadow-md">
            <TabsTrigger value="matches" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              Matches ({filteredMatches.length})
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Players ({filteredPlayerStats.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Teams ({filteredTeamStats.length})
            </TabsTrigger>
          </TabsList>

          {/* Matches Tab */}
          <TabsContent value="matches">
            {matchesLoading ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto text-emerald-500 animate-spin mb-4" />
                <p className="text-gray-600">Loading matches...</p>
              </div>
            ) : filteredMatches.length > 0 ? (
              <>
                <div className="grid lg:grid-cols-2 gap-6">
                  {paginatedMatches.map((match, index) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onDelete={deleteMatchMutation.mutate}
                      index={index}
                    />
                  ))}
                </div>
                {hasMoreMatches && (
                  <div className="text-center mt-8">
                    <p className="text-sm text-gray-500 mb-3">
                      Showing {paginatedMatches.length} of {filteredMatches.length} matches
                    </p>
                    <Button
                      onClick={loadMoreMatches}
                      variant="outline"
                      className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    >
                      Load More Matches
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {hasActiveFilters ? 'No matches found' : 'No saved matches'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {hasActiveFilters 
                      ? "Try adjusting your filters to see more results."
                      : hasUnlimitedRetention 
                        ? "Start analyzing matches from the Dashboard!"
                        : "You don't have any matches saved in the last 30 days."}
                  </p>
                  {hasActiveFilters ? (
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  ) : (
                    <Button onClick={() => window.location.href = '/Dashboard'}>
                      Go to Dashboard
                    </Button>
                  )}
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
            ) : filteredPlayerStats.length > 0 ? (
              <>
                <div className="space-y-6">
                  {paginatedPlayerStats.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    >
                      <PlayerStatsDisplay player={player} onDelete={deletePlayerMutation.mutate} />
                    </motion.div>
                  ))}
                </div>
                {hasMorePlayers && (
                  <div className="text-center mt-8">
                    <p className="text-sm text-gray-500 mb-3">
                      Showing {paginatedPlayerStats.length} of {filteredPlayerStats.length} players
                    </p>
                    <Button
                      onClick={loadMorePlayers}
                      variant="outline"
                      className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      Load More Players
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-12 text-center">
                  <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {hasActiveFilters ? 'No players found' : 'No saved player stats'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {hasActiveFilters 
                      ? "Try adjusting your filters to see more results."
                      : hasUnlimitedRetention 
                        ? "Start analyzing players from the Player Stats page!"
                        : "You don't have any player stats saved in the last 30 days."}
                  </p>
                  {hasActiveFilters ? (
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  ) : (
                    <Button onClick={() => window.location.href = '/PlayerStats'}>
                      Go to Player Stats
                    </Button>
                  )}
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
            ) : filteredTeamStats.length > 0 ? (
              <>
                <div className="space-y-6">
                  {paginatedTeamStats.map((team, index) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    >
                      <TeamStatsDisplay team={team} onDelete={deleteTeamMutation.mutate} />
                    </motion.div>
                  ))}
                </div>
                {hasMoreTeams && (
                  <div className="text-center mt-8">
                    <p className="text-sm text-gray-500 mb-3">
                      Showing {paginatedTeamStats.length} of {filteredTeamStats.length} teams
                    </p>
                    <Button
                      onClick={loadMoreTeams}
                      variant="outline"
                      className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      Load More Teams
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {hasActiveFilters ? 'No teams found' : 'No saved team stats'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {hasActiveFilters 
                      ? "Try adjusting your filters to see more results."
                      : hasUnlimitedRetention 
                        ? "Start analyzing teams from the Team Stats page!"
                        : "You don't have any team stats saved in the last 30 days."}
                  </p>
                  {hasActiveFilters ? (
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  ) : (
                    <Button onClick={() => window.location.href = '/TeamStats'}>
                      Go to Team Stats
                    </Button>
                  )}
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