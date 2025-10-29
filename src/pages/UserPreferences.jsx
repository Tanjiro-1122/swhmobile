import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Heart, 
  Bell, 
  Eye, 
  Save, 
  CheckCircle2,
  Sparkles,
  Trophy,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

const SPORTS_OPTIONS = [
  { id: "nba", name: "NBA Basketball", icon: "🏀" },
  { id: "nfl", name: "NFL Football", icon: "🏈" },
  { id: "mlb", name: "MLB Baseball", icon: "⚾" },
  { id: "nhl", name: "NHL Hockey", icon: "🏒" },
  { id: "soccer", name: "Soccer/Football", icon: "⚽" },
  { id: "ncaab", name: "College Basketball", icon: "🎓🏀" },
  { id: "ncaaf", name: "College Football", icon: "🎓🏈" },
  { id: "mma", name: "MMA/UFC", icon: "🥊" },
  { id: "tennis", name: "Tennis", icon: "🎾" },
  { id: "golf", name: "Golf", icon: "⛳" }
];

const LEAGUES_OPTIONS = [
  { id: "premier_league", name: "Premier League", sport: "soccer" },
  { id: "la_liga", name: "La Liga", sport: "soccer" },
  { id: "bundesliga", name: "Bundesliga", sport: "soccer" },
  { id: "serie_a", name: "Serie A", sport: "soccer" },
  { id: "ligue_1", name: "Ligue 1", sport: "soccer" },
  { id: "champions_league", name: "Champions League", sport: "soccer" },
  { id: "europa_league", name: "Europa League", sport: "soccer" },
  { id: "mls", name: "MLS", sport: "soccer" }
];

export default function UserPreferences() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const queryClient = useQueryClient();

  // Local state for preferences
  const [favoriteSports, setFavoriteSports] = useState([]);
  const [favoriteLeagues, setFavoriteLeagues] = useState([]);
  const [notificationPrefs, setNotificationPrefs] = useState({
    game_alerts: true,
    odds_changes: true,
    injury_updates: true,
    betting_insights: true,
    sharp_money_alerts: false
  });
  const [displayPrefs, setDisplayPrefs] = useState({
    odds_format: "american",
    stat_order: "default",
    show_advanced_stats: false,
    compact_view: false
  });

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      
      // Initialize state from user data
      if (user) {
        setFavoriteSports(user.favorite_sports || []);
        setFavoriteLeagues(user.favorite_leagues || []);
        setNotificationPrefs(user.notification_preferences || {
          game_alerts: true,
          odds_changes: true,
          injury_updates: true,
          betting_insights: true,
          sharp_money_alerts: false
        });
        setDisplayPrefs(user.display_preferences || {
          odds_format: "american",
          stat_order: "default",
          show_advanced_stats: false,
          compact_view: false
        });
      }
      
      return user;
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences) => {
      return await base44.auth.updateMe(preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSaveSuccess(true);
      setSaveError(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (error) => {
      setSaveError(error.message || "Failed to save preferences");
      setSaveSuccess(false);
    }
  });

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate({
      favorite_sports: favoriteSports,
      favorite_leagues: favoriteLeagues,
      notification_preferences: notificationPrefs,
      display_preferences: displayPrefs
    });
  };

  const toggleSport = (sportId) => {
    if (favoriteSports.includes(sportId)) {
      setFavoriteSports(favoriteSports.filter(s => s !== sportId));
    } else {
      setFavoriteSports([...favoriteSports, sportId]);
    }
  };

  const toggleLeague = (leagueId) => {
    if (favoriteLeagues.includes(leagueId)) {
      setFavoriteLeagues(favoriteLeagues.filter(l => l !== leagueId));
    } else {
      setFavoriteLeagues([...favoriteLeagues, leagueId]);
    }
  };

  const toggleNotification = (key) => {
    setNotificationPrefs({
      ...notificationPrefs,
      [key]: !notificationPrefs[key]
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">User Preferences</h1>
              <p className="text-gray-600">Customize your Sports Wager Helper experience</p>
            </div>
          </div>

          {currentUser && (
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2">
                {currentUser.full_name || currentUser.email}
              </Badge>
              {currentUser.subscription_type !== 'free' && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2">
                  {currentUser.subscription_type === 'legacy' ? '👑 LEGACY' :
                   currentUser.subscription_type === 'vip_annual' ? '💎 VIP' : '⭐ PREMIUM'}
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Preferences saved successfully!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {saveError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {/* Favorite Sports Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">Favorite Sports</CardTitle>
                  <CardDescription>
                    Select sports you want to prioritize in your feeds and recommendations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {SPORTS_OPTIONS.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => toggleSport(sport.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      favoriteSports.includes(sport.id)
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{sport.icon}</div>
                    <div className={`text-sm font-semibold ${
                      favoriteSports.includes(sport.id) ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {sport.name}
                    </div>
                    {favoriteSports.includes(sport.id) && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mx-auto mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Favorite Soccer Leagues Section */}
        {favoriteSports.includes('soccer') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-6 border-2 border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-green-600" />
                  <div>
                    <CardTitle className="text-2xl">Favorite Soccer Leagues</CardTitle>
                    <CardDescription>
                      Select leagues you want to follow closely
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {LEAGUES_OPTIONS.map((league) => (
                    <button
                      key={league.id}
                      onClick={() => toggleLeague(league.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        favoriteLeagues.includes(league.id)
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-sm font-semibold ${
                        favoriteLeagues.includes(league.id) ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        {league.name}
                      </div>
                      {favoriteLeagues.includes(league.id) && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Notification Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6 border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-purple-600" />
                <div>
                  <CardTitle className="text-2xl">Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what alerts and updates you want to receive
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Game Start Alerts</div>
                      <div className="text-sm text-gray-600">Get notified when your tracked games are starting</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotification('game_alerts')}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      notificationPrefs.game_alerts ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      notificationPrefs.game_alerts ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Odds Changes</div>
                      <div className="text-sm text-gray-600">Alerts for significant line movements</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotification('odds_changes')}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      notificationPrefs.odds_changes ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      notificationPrefs.odds_changes ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Injury Updates</div>
                      <div className="text-sm text-gray-600">Get notified about key player injuries</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotification('injury_updates')}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      notificationPrefs.injury_updates ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      notificationPrefs.injury_updates ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Daily Betting Insights</div>
                      <div className="text-sm text-gray-600">Receive AI-powered picks and analysis</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotification('betting_insights')}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      notificationPrefs.betting_insights ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      notificationPrefs.betting_insights ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Sharp Money Alerts</div>
                      <div className="text-sm text-gray-600">Track where professional bettors are placing money</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotification('sharp_money_alerts')}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      notificationPrefs.sharp_money_alerts ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      notificationPrefs.sharp_money_alerts ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Display Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="mb-6 border-2 border-indigo-200">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-indigo-600" />
                <div>
                  <CardTitle className="text-2xl">Display Preferences</CardTitle>
                  <CardDescription>
                    Customize how data is displayed in the app
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Odds Format */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Odds Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setDisplayPrefs({...displayPrefs, odds_format: 'american'})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        displayPrefs.odds_format === 'american'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">American</div>
                      <div className="text-xs text-gray-600 mt-1">-110, +150</div>
                    </button>
                    <button
                      onClick={() => setDisplayPrefs({...displayPrefs, odds_format: 'decimal'})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        displayPrefs.odds_format === 'decimal'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">Decimal</div>
                      <div className="text-xs text-gray-600 mt-1">1.91, 2.50</div>
                    </button>
                    <button
                      onClick={() => setDisplayPrefs({...displayPrefs, odds_format: 'fractional'})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        displayPrefs.odds_format === 'fractional'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">Fractional</div>
                      <div className="text-xs text-gray-600 mt-1">10/11, 3/2</div>
                    </button>
                  </div>
                </div>

                {/* Stat Display Order */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Statistics Display Order
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setDisplayPrefs({...displayPrefs, stat_order: 'default'})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        displayPrefs.stat_order === 'default'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">Default</div>
                      <div className="text-xs text-gray-600 mt-1">Standard order</div>
                    </button>
                    <button
                      onClick={() => setDisplayPrefs({...displayPrefs, stat_order: 'alphabetical'})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        displayPrefs.stat_order === 'alphabetical'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">Alphabetical</div>
                      <div className="text-xs text-gray-600 mt-1">A to Z</div>
                    </button>
                    <button
                      onClick={() => setDisplayPrefs({...displayPrefs, stat_order: 'importance'})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        displayPrefs.stat_order === 'importance'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">Importance</div>
                      <div className="text-xs text-gray-600 mt-1">Key stats first</div>
                    </button>
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900">Show Advanced Statistics</div>
                      <div className="text-sm text-gray-600">Display advanced analytics by default</div>
                    </div>
                    <button
                      onClick={() => setDisplayPrefs({...displayPrefs, show_advanced_stats: !displayPrefs.show_advanced_stats})}
                      className={`w-14 h-8 rounded-full transition-colors ${
                        displayPrefs.show_advanced_stats ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                        displayPrefs.show_advanced_stats ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900">Compact View</div>
                      <div className="text-sm text-gray-600">Use smaller, more condensed card layouts</div>
                    </div>
                    <button
                      onClick={() => setDisplayPrefs({...displayPrefs, compact_view: !displayPrefs.compact_view})}
                      className={`w-14 h-8 rounded-full transition-colors ${
                        displayPrefs.compact_view ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                        displayPrefs.compact_view ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="sticky bottom-6"
        >
          <Button
            onClick={handleSavePreferences}
            disabled={savePreferencesMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6 font-bold shadow-lg"
          >
            {savePreferencesMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-3" />
                Save All Preferences
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}