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
    icon: '🏈',
    gradient: 'from-blue-600 to-blue-800',
    accent: 'bg-blue-600',
    border: 'border-blue-500',
    source: 'NFL.com & TeamRankings.com'
  },
  MLB: {
    icon: '⚾',
    gradient: 'from-red-600 to-red-800',
    accent: 'bg-red-600',
    border: 'border-red-500',
    source: 'MLB.com'
  },
  NBA: {
    icon: '🏀',
    gradient: 'from-orange-500 to-orange-700',
    accent: 'bg-orange-500',
    border: 'border-orange-500',
    source: 'NBA.com'
  },
  NHL: {
    icon: '🏒',
    gradient: 'from-teal-500 to-teal-700',
    accent: 'bg-teal-500',
    border: 'border-teal-500',
    source: 'NHL.com'
  },
  Soccer: {
    icon: '⚽',
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

  const fetchPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for the current top 10 best ${sport} players right now in 2024-2025. 
For each player provide: name, team, position, and a key stat.
Use the most recent data available from ${config.source}.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            players: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  team: { type: "string" },
                  position: { type: "string" },
                  stats: { type: "string" }
                }
              }
            }
          }
        }
      });
      setPlayers(result.players || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
    setLoadingPlayers(false);
  };

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for the current top 10 ${sport} team rankings for 2024-2025 season.
Include team name, current record (wins-losses), and conference/division.
Use the most recent standings from ${config.source} and TeamRankings.com.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            teams: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  record: { type: "string" },
                  conference: { type: "string" }
                }
              }
            }
          }
        }
      });
      setTeams(result.teams || []);
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <span className="text-7xl">{config.icon}</span>
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