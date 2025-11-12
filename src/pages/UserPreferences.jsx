import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Bell, Heart, TrendingUp, Save, Sparkles, Trophy, Users, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import RequireAuth from "../components/auth/RequireAuth";

function UserPreferencesContent() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState("");

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    favorite_sports: [],
    favorite_leagues: [],
    favorite_teams: [],
    favorite_players: [],
    notification_preferences: {
      odds_changes: true,
      injury_reports: true,
      game_start_reminders: true,
      line_movements: false,
      personalized_picks: true,
      weekly_insights: true
    },
    betting_style: 'balanced'
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        favorite_sports: currentUser.favorite_sports || [],
        favorite_leagues: currentUser.favorite_leagues || [],
        favorite_teams: currentUser.favorite_teams || [],
        favorite_players: currentUser.favorite_players || [],
        notification_preferences: currentUser.notification_preferences || {
          odds_changes: true,
          injury_reports: true,
          game_start_reminders: true,
          line_movements: false,
          personalized_picks: true,
          weekly_insights: true
        },
        betting_style: currentUser.betting_style || 'balanced'
      });
    }
  }, [currentUser]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSuccessMessage("✅ Preferences saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
  });

  const handleSave = () => {
    updatePreferencesMutation.mutate(formData);
  };

  const availableSports = [
    "NBA", "NFL", "MLB", "NHL", "NCAA Basketball", "NCAA Football",
    "Premier League", "La Liga", "Serie A", "Bundesliga", "UEFA Champions League",
    "MLS", "Tennis", "Boxing", "UFC/MMA", "Golf"
  ];

  const availableLeagues = [
    "NBA", "NFL", "MLB", "NHL", "NCAA Basketball", "NCAA Football",
    "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1",
    "UEFA Champions League", "UEFA Europa League", "MLS",
    "ATP", "WTA", "PGA Tour", "LIV Golf"
  ];

  const toggleSport = (sport) => {
    setFormData(prev => ({
      ...prev,
      favorite_sports: prev.favorite_sports.includes(sport)
        ? prev.favorite_sports.filter(s => s !== sport)
        : [...prev.favorite_sports, sport]
    }));
  };

  const toggleLeague = (league) => {
    setFormData(prev => ({
      ...prev,
      favorite_leagues: prev.favorite_leagues.includes(league)
        ? prev.favorite_leagues.filter(l => l !== league)
        : [...prev.favorite_leagues, league]
    }));
  };

  const addTeam = (team) => {
    if (team && !formData.favorite_teams.includes(team)) {
      setFormData(prev => ({
        ...prev,
        favorite_teams: [...prev.favorite_teams, team]
      }));
    }
  };

  const removeTeam = (team) => {
    setFormData(prev => ({
      ...prev,
      favorite_teams: prev.favorite_teams.filter(t => t !== team)
    }));
  };

  const addPlayer = (player) => {
    if (player && !formData.favorite_players.includes(player)) {
      setFormData(prev => ({
        ...prev,
        favorite_players: [...prev.favorite_players, player]
      }));
    }
  };

  const removePlayer = (player) => {
    setFormData(prev => ({
      ...prev,
      favorite_players: prev.favorite_players.filter(p => p !== player)
    }));
  };

  const updateNotificationPref = (key, value) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">My Preferences</h1>
              <p className="text-gray-600">Customize your betting experience</p>
            </div>
          </div>
        </div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="bg-green-50 border-2 border-green-500">
              <AlertDescription className="text-green-900 font-semibold">
                {successMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Favorite Sports */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-600" />
                Favorite Sports
              </CardTitle>
              <p className="text-sm text-gray-600">Select sports you want personalized content for</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {availableSports.map(sport => (
                  <Badge
                    key={sport}
                    className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-all ${
                      formData.favorite_sports.includes(sport)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => toggleSport(sport)}
                  >
                    {sport}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Favorite Leagues */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Favorite Leagues
              </CardTitle>
              <p className="text-sm text-gray-600">Get updates and insights from specific leagues</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {availableLeagues.map(league => (
                  <Badge
                    key={league}
                    className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-all ${
                      formData.favorite_leagues.includes(league)
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => toggleLeague(league)}
                  >
                    {league}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Favorite Teams */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                Favorite Teams
              </CardTitle>
              <p className="text-sm text-gray-600">Track specific teams you care about</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add a team (e.g., Los Angeles Lakers)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTeam(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  onClick={(e) => {
                    const input = e.target.parentElement.querySelector('input');
                    addTeam(input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.favorite_teams.map(team => (
                  <Badge
                    key={team}
                    className="bg-orange-100 text-orange-800 px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-orange-200"
                    onClick={() => removeTeam(team)}
                  >
                    {team} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Favorite Players */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b-2 border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-green-600" />
                Favorite Players
              </CardTitle>
              <p className="text-sm text-gray-600">Follow specific players and get their updates</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add a player (e.g., LeBron James)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addPlayer(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  onClick={(e) => {
                    const input = e.target.parentElement.querySelector('input');
                    addPlayer(input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.favorite_players.map(player => (
                  <Badge
                    key={player}
                    className="bg-green-100 text-green-800 px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-green-200"
                    onClick={() => removePlayer(player)}
                  >
                    {player} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b-2 border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-600" />
                Notification Preferences
              </CardTitle>
              <p className="text-sm text-gray-600">Choose what updates you want to receive</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { key: 'odds_changes', label: 'Odds Changes', desc: 'Get notified when odds change significantly' },
                  { key: 'injury_reports', label: 'Injury Reports', desc: 'Updates about player injuries' },
                  { key: 'game_start_reminders', label: 'Game Start Reminders', desc: 'Reminders before games begin' },
                  { key: 'line_movements', label: 'Line Movements', desc: 'Betting line movement alerts' },
                  { key: 'personalized_picks', label: 'Personalized Picks', desc: 'AI-generated betting recommendations' },
                  { key: 'weekly_insights', label: 'Weekly Insights', desc: 'Weekly betting trends and analysis' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor={key} className="font-semibold text-gray-900">{label}</Label>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                    <Switch
                      id={key}
                      checked={formData.notification_preferences[key]}
                      onCheckedChange={(checked) => updateNotificationPref(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Betting Style */}
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-indigo-600" />
                Betting Style
              </CardTitle>
              <p className="text-sm text-gray-600">Help us tailor recommendations to your risk tolerance</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { value: 'conservative', label: 'Conservative', desc: 'Lower risk, safer bets', icon: '🛡️' },
                  { value: 'balanced', label: 'Balanced', desc: 'Mix of safe and risky bets', icon: '⚖️' },
                  { value: 'aggressive', label: 'Aggressive', desc: 'Higher risk, higher reward', icon: '🚀' }
                ].map(({ value, label, desc, icon }) => (
                  <div
                    key={value}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.betting_style === value
                        ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, betting_style: value }))}
                  >
                    <div className="text-4xl mb-2">{icon}</div>
                    <div className="font-bold text-gray-900">{label}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/Profile'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updatePreferencesMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-bold"
            >
              {updatePreferencesMutation.isPending ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserPreferences() {
  return (
    <RequireAuth pageName="User Preferences">
      <UserPreferencesContent />
    </RequireAuth>
  );
}