import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Check, X, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SPORTS = ["NBA", "NFL", "MLB", "NHL", "Soccer", "NCAAF", "NCAAB", "UFC/MMA", "Tennis", "Golf"];
const LEAGUES = ["NBA", "NFL", "MLB", "NHL", "Premier League", "La Liga", "Serie A", "Bundesliga", "MLS", "NCAA"];

export default function PreferencesContent() {
  const [favoriteSports, setFavoriteSports] = useState([]);
  const [favoriteLeagues, setFavoriteLeagues] = useState([]);
  const [favoriteTeams, setFavoriteTeams] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (currentUser) {
      setFavoriteSports(currentUser.favorite_sports || []);
      setFavoriteLeagues(currentUser.favorite_leagues || []);
      setFavoriteTeams((currentUser.favorite_teams || []).join(", "));
    }
  }, [currentUser]);

  const toggleSport = (sport) => {
    setFavoriteSports(prev => 
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  const toggleLeague = (league) => {
    setFavoriteLeagues(prev => 
      prev.includes(league) ? prev.filter(l => l !== league) : [...prev, league]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const teams = favoriteTeams.split(",").map(t => t.trim()).filter(Boolean);
      await base44.auth.updateMe({
        favorite_sports: favoriteSports,
        favorite_leagues: favoriteLeagues,
        favorite_teams: teams
      });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Preferences saved successfully!");
    } catch (error) {
      toast.error("Failed to save preferences");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6 flex items-center gap-4">
          <Sparkles className="w-10 h-10 text-purple-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900">Personalize Your Experience</h3>
            <p className="text-sm text-gray-600">
              Set your favorite sports, leagues, and teams to get tailored recommendations and insights.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Favorite Sports */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Favorite Sports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((sport) => (
              <Badge
                key={sport}
                variant="outline"
                className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                  favoriteSports.includes(sport)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => toggleSport(sport)}
              >
                {favoriteSports.includes(sport) && <Check className="w-3 h-3 mr-1" />}
                {sport}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorite Leagues */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Favorite Leagues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LEAGUES.map((league) => (
              <Badge
                key={league}
                variant="outline"
                className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                  favoriteLeagues.includes(league)
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => toggleLeague(league)}
              >
                {favoriteLeagues.includes(league) && <Check className="w-3 h-3 mr-1" />}
                {league}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorite Teams */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Favorite Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            placeholder="Enter teams separated by commas (e.g., Lakers, Patriots, Yankees)"
            value={favoriteTeams}
            onChange={(e) => setFavoriteTeams(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          {favoriteTeams && (
            <div className="flex flex-wrap gap-2 mt-3">
              {favoriteTeams.split(",").map((team, idx) => (
                team.trim() && (
                  <Badge key={idx} className="bg-green-100 text-green-800">
                    {team.trim()}
                  </Badge>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6 text-lg"
      >
        {isSaving ? (
          <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" /> Saving...</>
        ) : (
          <><Save className="w-5 h-5 mr-2" /> Save Preferences</>
        )}
      </Button>
    </div>
  );
}