import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Shield, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import PlayerList from '@/components/topten/PlayerList';
import TeamRankings from '@/components/topten/TeamRankings';

const sportConfig = {
  NFL: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nfl.png',
    gradient: 'from-blue-600 to-blue-800',
    accent: 'bg-blue-600',
    border: 'border-blue-500',
    source: 'NFL.com & TeamRankings.com'
  },
  MLB: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/mlb.png',
    gradient: 'from-red-600 to-red-800',
    accent: 'bg-red-600',
    border: 'border-red-500',
    source: 'MLB.com'
  },
  NBA: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nba.png',
    gradient: 'from-orange-500 to-orange-700',
    accent: 'bg-orange-500',
    border: 'border-orange-500',
    source: 'NBA.com'
  },
  NHL: {
    logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nhl.png',
    gradient: 'from-teal-500 to-teal-700',
    accent: 'bg-teal-500',
    border: 'border-teal-500',
    source: 'NHL.com'
  },
  Soccer: {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/FIFA_logo_without_slogan.svg/500px-FIFA_logo_without_slogan.svg.png',
    gradient: 'from-green-600 to-green-800',
    accent: 'bg-green-600',
    border: 'border-green-500',
    source: 'FIFA & Premier League'
  }
};

export default function SportDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const sport = urlParams.get('sport') || 'NFL';
  const config = sportConfig[sport] || sportConfig.NFL;

  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const getPlayerSchema = (sport) => {
    const schemas = {
      NFL: {
        name: { type: "string" },
        team: { type: "string" },
        position: { type: "string" },
        yds: { type: "number" },
        td: { type: "number" },
        cmp_att: { type: "string" },
        cmp_pct: { type: "number" },
        qbr: { type: "number" },
        rush_yds: { type: "number" },
        rec: { type: "number" },
        rec_yds: { type: "number" },
        total_td: { type: "number" }
      },
      MLB: {
        name: { type: "string" },
        team: { type: "string" },
        position: { type: "string" },
        avg: { type: "number" },
        hr: { type: "number" },
        rbi: { type: "number" },
        obp: { type: "number" },
        slg: { type: "number" },
        era: { type: "number" },
        w: { type: "number" },
        k: { type: "number" },
        whip: { type: "number" }
      },
      NBA: {
        name: { type: "string" },
        team: { type: "string" },
        position: { type: "string" },
        gp: { type: "number" },
        min: { type: "number" },
        pts: { type: "number" },
        reb: { type: "number" },
        ast: { type: "number" },
        fg_pct: { type: "number" },
        three_pct: { type: "number" }
      },
      NHL: {
        name: { type: "string" },
        team: { type: "string" },
        position: { type: "string" },
        gp: { type: "number" },
        g: { type: "number" },
        a: { type: "number" },
        pts: { type: "number" },
        plus_minus: { type: "number" },
        pim: { type: "number" },
        sog: { type: "number" },
        s_pct: { type: "number" },
        toi: { type: "string" }
      },
      Soccer: {
        name: { type: "string" },
        team: { type: "string" },
        position: { type: "string" },
        gp: { type: "number" },
        g: { type: "number" },
        a: { type: "number" },
        sot: { type: "number" },
        pass_pct: { type: "number" },
        tck: { type: "number" },
        min: { type: "number" },
        yc: { type: "number" },
        rc: { type: "number" }
      }
    };
    return schemas[sport] || schemas.NBA;
  };

  const getPlayerPrompt = (sport) => {
    const prompts = {
      NFL: `Search for the current top 10 best NFL players right now in the 2024-2025 season. For each player provide their current season stats: name, team, position, passing/rushing/receiving yards (yds), touchdowns (td), completion/attempts (cmp_att as string like "250/380"), completion percentage (cmp_pct), QBR (qbr), rushing yards (rush_yds), receptions (rec), receiving yards (rec_yds), and total touchdowns (total_td).`,
      MLB: `Search for the current top 10 best MLB players right now in the 2024-2025 season. For each player provide their current season stats: name, team, position, batting average (avg), home runs (hr), RBIs (rbi), on-base percentage (obp), slugging percentage (slg), ERA (era), wins (w), strikeouts (k), and WHIP (whip).`,
      NBA: `Search for the current top 10 best NBA players right now in the 2024-2025 season. For each player provide their current season stats: name, team, position, games played (gp), minutes per game (min), points per game (pts), rebounds per game (reb), assists per game (ast), field goal percentage (fg_pct), and three-point percentage (three_pct).`,
      NHL: `Search for the current top 10 best NHL players right now in the 2024-2025 season. For each player provide their current season stats: name, team, position, games played (gp), goals (g), assists (a), points (pts), plus/minus (plus_minus), penalty minutes (pim), shots on goal (sog), shooting percentage (s_pct), and time on ice (toi as string like "20:45").`,
      Soccer: `Search for the current top 10 best Soccer players right now in the 2024-2025 season. For each player provide their current season stats: name, team, position, games played (gp), goals (g), assists (a), shots on target (sot), pass completion percentage (pass_pct), tackles (tck), minutes played (min), yellow cards (yc), and red cards (rc).`
    };
    return prompts[sport] || prompts.NBA;
  };

  const fetchPlayers = async (forceRefresh = false) => {
    setLoadingPlayers(true);
    try {
      const { data } = await base44.functions.invoke('getTopTenData', {
        sport,
        type: 'players',
        forceRefresh
      });
      console.log('Players response:', data);
      setPlayers(data.data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
    setLoadingPlayers(false);
  };

  const fetchTeams = async (forceRefresh = false) => {
    setLoadingTeams(true);
    try {
      const { data } = await base44.functions.invoke('getTopTenData', {
        sport,
        type: 'teams',
        forceRefresh
      });
      console.log('Teams response:', data);
      setTeams(data.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
    setLoadingTeams(false);
  };

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
  }, [sport]);

  const handleRefresh = () => {
    fetchPlayers(true);
    fetchTeams(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Header */}
      <div className={`bg-gradient-to-br ${config.gradient} py-6 px-4`}>
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <img src={config.logo} alt={sport} className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">{sport.toUpperCase()}</h1>
              <p className="text-white/70 text-sm mt-1">Top 10 Players & Team Rankings</p>
              <p className="text-white/50 text-xs mt-0.5">Source: {config.source}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <div className="flex justify-between items-center mb-4">
          <Link to={createPageUrl('TopTen')}>
            <Button variant="outline" className="bg-white shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sports
            </Button>
          </Link>
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