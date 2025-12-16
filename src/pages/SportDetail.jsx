import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      const apiKey = window.SECRETS?.ODDS_API_KEY;
      
      // Sport-specific stat definitions
      const statPrompts = {
        NFL: 'passing yards (YDS), touchdowns (TD), completions/attempts (CMP/ATT), completion percentage (CMP%), quarterback rating (QBR), rushing yards (RUSH YDS), receptions (REC), receiving yards (REC YDS), total touchdowns (TOTAL TD)',
        MLB: 'batting average (AVG), home runs (HR), runs batted in (RBI), on-base percentage (OBP), slugging percentage (SLG), earned run average (ERA), wins (W), strikeouts (K), WHIP',
        NBA: 'games played (GP), minutes per game (MIN), points per game (PTS), rebounds per game (REB), assists per game (AST), field goal percentage (FG%), three-point percentage (3P%)',
        NHL: 'games played (GP), goals (G), assists (A), points (PTS), plus/minus (+/-), penalty minutes (PIM), shots on goal (SOG), shooting percentage (S%), ice time (TOI)',
        Soccer: 'games played (GP), goals (G), assists (A), shots on target (SOT), pass accuracy (PASS%), tackles (TCK), minutes played (MIN), yellow cards (YC), red cards (RC)'
      };

      const statSchema = {
        NFL: {
          position: { type: "string" },
          yds: { type: "string" },
          td: { type: "string" },
          cmp_att: { type: "string" },
          cmp_pct: { type: "string" },
          qbr: { type: "string" },
          rush_yds: { type: "string" },
          rec: { type: "string" },
          rec_yds: { type: "string" },
          total_td: { type: "string" }
        },
        MLB: {
          position: { type: "string" },
          avg: { type: "string" },
          hr: { type: "string" },
          rbi: { type: "string" },
          obp: { type: "string" },
          slg: { type: "string" },
          era: { type: "string" },
          w: { type: "string" },
          k: { type: "string" },
          whip: { type: "string" }
        },
        NBA: {
          position: { type: "string" },
          gp: { type: "number" },
          min: { type: "string" },
          pts: { type: "string" },
          reb: { type: "string" },
          ast: { type: "string" },
          fg_pct: { type: "string" },
          three_pct: { type: "string" }
        },
        NHL: {
          position: { type: "string" },
          gp: { type: "number" },
          g: { type: "string" },
          a: { type: "string" },
          pts: { type: "string" },
          plus_minus: { type: "string" },
          pim: { type: "string" },
          sog: { type: "string" },
          s_pct: { type: "string" },
          toi: { type: "string" }
        },
        Soccer: {
          position: { type: "string" },
          gp: { type: "number" },
          g: { type: "string" },
          a: { type: "string" },
          sot: { type: "string" },
          pass_pct: { type: "string" },
          tck: { type: "string" },
          min: { type: "string" },
          yc: { type: "string" },
          rc: { type: "string" }
        }
      };
      
      if (!apiKey) {
        const playerPrompts = {
          Soccer: `Search for the current top 10 best soccer/football players in Europe (Premier League, La Liga, Serie A, Bundesliga) for the 2024-2025 season. 
                   For each player provide: name, club team, and these stats: ${statPrompts[sport]}.
                   Focus on attackers and midfielders with highest goals and assists. Use the most recent real statistics from Premier League, La Liga, UEFA. Provide actual current season numbers, not zeros.`,
          default: `Search for the current top 10 best ${sport} players for 2024-2025 season. 
                   For each player provide: name, team, and these stats: ${statPrompts[sport]}.
                   Use the most recent real statistics from ${config.source}. Provide actual numbers, not zeros.`
        };
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: playerPrompts[sport] || playerPrompts.default,
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
                    ...statSchema[sport]
                  }
                }
              }
            }
          }
        });
        setPlayers(result.players || []);
      } else {
        const oddsResponse = await fetch(
          `https://api.the-odds-api.com/v4/sports/${config.oddsApiKey}/scores/?apiKey=${apiKey}&daysFrom=3`
        );
        const oddsData = await oddsResponse.json();
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Based on this recent ${sport} game data: ${JSON.stringify(oddsData.slice(0, 10))}, 
                   provide the current top 10 best ${sport} players for 2024-2025 season. 
                   For each player provide: name, team, and these stats: ${statPrompts[sport]}.
                   Use real current statistics from ${config.source}. Provide actual numbers, not zeros.`,
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
                    ...statSchema[sport]
                  }
                }
              }
            }
          }
        });
        setPlayers(result.players || []);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
    setLoadingPlayers(false);
  };

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const apiKey = window.SECRETS?.ODDS_API_KEY;
      
      if (!apiKey) {
        console.warn('Odds API key not configured, using LLM fallback');
        
        const teamPrompts = {
          Soccer: `Search for the current top 10 soccer/football club teams in Europe (Premier League, La Liga, Serie A, Bundesliga) for the 2024-2025 season.
                   For each club team provide: team name, wins (W), losses (L), win percentage (WIN%), 
                   points difference from leader (GB), league position (CONF like "EPL 2nd"), 
                   goals scored/conceded (DIV like "45-12"), home record (HOME like "8-1-1"), 
                   away record (ROAD like "6-2-2"), last 10 matches (LAST10 like "7-2-1"), 
                   and current streak (STREAK like "W 4" or "D 1" for draw or "L 2").
                   Use the most recent standings from Premier League, La Liga, and UEFA rankings. Provide real current season data with actual numbers.`,
          default: `Search for the current top 10 ${sport} team rankings for 2024-2025 season.
                   For each team provide: team name, wins (W), losses (L), win percentage (WIN%), 
                   games behind leader (GB), conference record (CONF like "14-7"), 
                   division record (DIV like "5-1"), home record (HOME like "11-2"), 
                   road record (ROAD like "9-3"), last 10 games record (LAST10 like "7-3"), 
                   and current streak (STREAK like "W 4" for 4 game win streak or "L 2" for 2 game losing streak).
                   Use the most recent standings from ${config.source} and TeamRankings.com. Provide real numbers, not zeros.`
        };
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: teamPrompts[sport] || teamPrompts.default,
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
                    w: { type: "number" },
                    l: { type: "number" },
                    win_pct: { type: "string" },
                    gb: { type: "string" },
                    conf: { type: "string" },
                    div: { type: "string" },
                    home: { type: "string" },
                    road: { type: "string" },
                    last10: { type: "string" },
                    streak: { type: "string" }
                  }
                }
              }
            }
          }
        });
        setTeams(result.teams || []);
      } else {
        // Fetch live scores and standings from Odds API
        const oddsResponse = await fetch(
          `https://api.the-odds-api.com/v4/sports/${config.oddsApiKey}/scores/?apiKey=${apiKey}&daysFrom=30`
        );
        const oddsData = await oddsResponse.json();
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Based on this ${sport} game data: ${JSON.stringify(oddsData.slice(0, 30))}, 
                   calculate and provide the current top 10 team rankings for 2024-2025 season.
                   For each team provide: team name, wins (W), losses (L), win percentage (WIN%), 
                   games behind leader (GB), conference record (CONF like "14-7"), 
                   division record (DIV like "5-1"), home record (HOME like "11-2"), 
                   road record (ROAD like "9-3"), last 10 games record (LAST10 like "7-3"), 
                   and current streak (STREAK like "W 4" for 4 game win streak or "L 2" for 2 game losing streak).
                   Use real standings data from ${config.source}.`,
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
                    w: { type: "number" },
                    l: { type: "number" },
                    win_pct: { type: "string" },
                    gb: { type: "string" },
                    conf: { type: "string" },
                    div: { type: "string" },
                    home: { type: "string" },
                    road: { type: "string" },
                    last10: { type: "string" },
                    streak: { type: "string" }
                  }
                }
              }
            }
          }
        });
        setTeams(result.teams || []);
      }
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
          <Link to={createPageUrl('Home')}>
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