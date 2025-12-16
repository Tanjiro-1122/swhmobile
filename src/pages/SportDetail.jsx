import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Shield, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import PlayerList from '@/components/PlayerList';
import TeamRankings from '@/components/TeamRankings';

const sportConfig = {
  NFL: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nfl.png',
    gradient: 'from-blue-600 to-blue-800',
    accent: 'bg-blue-600',
    border: 'border-blue-500',
    source: 'NFL.com & TeamRankings.com',
    oddsApiKey: 'americanfootball_nfl'
  },
  MLB: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/mlb.png',
    gradient: 'from-red-600 to-red-800',
    accent: 'bg-red-600',
    border: 'border-red-500',
    source: 'MLB.com',
    oddsApiKey: 'baseball_mlb'
  },
  NBA: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nba.png',
    gradient: 'from-orange-500 to-orange-700',
    accent: 'bg-orange-500',
    border: 'border-orange-500',
    source: 'NBA.com',
    oddsApiKey: 'basketball_nba'
  },
  NHL: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nhl.png',
    gradient: 'from-teal-500 to-teal-700',
    accent: 'bg-teal-500',
    border: 'border-teal-500',
    source: 'NHL.com',
    oddsApiKey: 'icehockey_nhl'
  },
  Soccer: {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/FIFA_logo_without_slogan.svg/500px-FIFA_logo_without_slogan.svg.png',
    gradient: 'from-green-600 to-green-800',
    accent: 'bg-green-600',
    border: 'border-green-500',
    source: 'FIFA & Premier League',
    oddsApiKey: 'soccer_epl'
  }
};

export default function SportDetail() {
  const location = useLocation();
  const [sport, setSport] = useState(() => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('sport') || 'NFL';
  });
  
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Update sport when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const newSport = urlParams.get('sport') || 'NFL';
    setSport(newSport);
  }, [location.search]);

  const config = sportConfig[sport] || sportConfig.NFL;

  const fetchPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const response = await base44.functions.invoke('getTopTenData', {
        sport,
        type: 'players'
      });
      
      setPlayers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      setPlayers([]);
    }
    setLoadingPlayers(false);
  };

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const response = await base44.functions.invoke('getTopTenData', {
        sport,
        type: 'teams'
      });
      
      setTeams(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    }
    setLoadingTeams(false);
  };

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
  }, [sport]);

  const handleRefresh = () => {
    fetchPlayers();
    fetchTeams();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Header */}
      <div className={`bg-gradient-to-br ${config.gradient} pt-8 pb-16 px-4`}>
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('TopTen')}>
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sports
            </Button>
          </Link>
          
          <motion.div 
            key={sport}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <div className="w-20 h-20 flex items-center justify-center bg-white rounded-xl p-2">
              <img src={config.logo} alt={sport} className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">{sport}</h1>
              <p className="text-white/70 mt-2">Top 10 Players & Team Rankings</p>
              <p className="text-white/50 text-sm mt-1">Source: {config.source}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="flex justify-end mb-4">
          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="bg-white shadow-sm"
            disabled={loadingPlayers || loadingTeams}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(loadingPlayers || loadingTeams) ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        <Tabs defaultValue="players" className="w-full">
          <TabsList className="w-full bg-white shadow-sm rounded-xl p-1 mb-6">
            <TabsTrigger value="players" className="flex-1 rounded-lg data-[state=active]:shadow-sm">
              <Users className="w-4 h-4 mr-2" />
              Top 10 Players
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex-1 rounded-lg data-[state=active]:shadow-sm">
              <Shield className="w-4 h-4 mr-2" />
              Team Rankings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <motion.div
              key={`players-${sport}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <PlayerList 
                players={players} 
                isLoading={loadingPlayers}
                accentColor={config.border}
                sport={sport}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="teams">
            <motion.div
              key={`teams-${sport}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <TeamRankings 
                teams={teams} 
                isLoading={loadingTeams}
                accentColor={config.accent}
              />
            </motion.div>
          </TabsContent>
        </Tabs>

        <p className="text-center text-slate-400 text-sm mt-8 pb-8">
          Data fetched from {config.source}
        </p>
      </div>
    </div>
  );
}