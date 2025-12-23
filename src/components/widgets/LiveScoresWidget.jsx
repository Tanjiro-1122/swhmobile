import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Activity, 
  Trophy, 
  Clock, 
  Radio,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const sportIcons = {
  'NFL': '🏈',
  'NCAAF': '🏈',
  'NBA': '🏀',
  'NCAAB': '🏀',
  'NHL': '🏒',
  'MLB': '⚾',
};

const sportColors = {
  'NFL': { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', text: 'text-green-400', glow: 'shadow-green-500/20' },
  'NCAAF': { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', text: 'text-green-400', glow: 'shadow-green-500/20' },
  'NBA': { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  'NCAAB': { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  'NHL': { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
  'MLB': { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-red-500/20' },
};

const LivePulse = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
  </span>
);

const GameCard = ({ game }) => {
  const isLive = game.status === 'Live';
  const colors = sportColors[game.sport_title] || sportColors['NFL'];
  const icon = sportIcons[game.sport_title] || '🏆';
  
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl 
        bg-gradient-to-br ${colors.bg}
        border ${colors.border}
        backdrop-blur-xl
        ${isLive ? `shadow-lg ${colors.glow}` : ''}
        min-w-[280px] md:min-w-[320px] flex-shrink-0
      `}
    >
      {/* Animated background glow for live games */}
      {isLive && (
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br ${colors.bg} rounded-full blur-3xl animate-pulse opacity-50`} />
        </div>
      )}
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <Badge variant="outline" className={`${colors.text} ${colors.border} text-xs font-medium`}>
              {game.sport_title}
            </Badge>
          </div>
          {isLive ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
              <LivePulse />
              <span className="text-red-400 text-xs font-bold uppercase tracking-wide">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Clock className="w-3 h-3" />
              <span>{game.score}</span>
            </div>
          )}
        </div>
        
        {/* Teams */}
        <div className="space-y-2">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg font-bold text-white/80">
                {game.away_team.charAt(0)}
              </div>
              <span className="text-white font-medium text-sm truncate max-w-[140px]">
                {game.away_team}
              </span>
            </div>
            {isLive && (
              <span className="text-2xl font-bold text-white tabular-nums">
                {game.score.split(' - ')[0]}
              </span>
            )}
          </div>
          
          {/* Divider with VS */}
          <div className="flex items-center gap-2 px-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-[10px] text-slate-500 font-medium">VS</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg font-bold text-white/80">
                {game.home_team.charAt(0)}
              </div>
              <span className="text-white font-medium text-sm truncate max-w-[140px]">
                {game.home_team}
              </span>
            </div>
            {isLive && (
              <span className="text-2xl font-bold text-white tabular-nums">
                {game.score.split(' - ')[1]}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SportFilter = ({ sports, activeSport, onSelect }) => (
  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
    <Button
      variant={activeSport === 'all' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onSelect('all')}
      className={`
        rounded-full text-xs whitespace-nowrap
        ${activeSport === 'all' 
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-white' 
          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}
      `}
    >
      <Trophy className="w-3 h-3 mr-1" />
      All Sports
    </Button>
    {sports.map(sport => (
      <Button
        key={sport}
        variant={activeSport === sport ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect(sport)}
        className={`
          rounded-full text-xs whitespace-nowrap
          ${activeSport === sport 
            ? `bg-gradient-to-r ${sportColors[sport]?.bg || 'from-slate-500/20 to-slate-600/10'} border ${sportColors[sport]?.border || 'border-slate-500/30'} ${sportColors[sport]?.text || 'text-slate-400'}` 
            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}
        `}
      >
        <span className="mr-1">{sportIcons[sport] || '🏆'}</span>
        {sport}
      </Button>
    ))}
  </div>
);

export default function LiveScoresWidget() {
  const [activeSport, setActiveSport] = useState('all');
  const [isPaused, setIsPaused] = useState(false);

  const { data: scores = [], isLoading, error } = useQuery({
    queryKey: ['liveScores'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getLiveScores');
      return response.data || [];
    },
    refetchInterval: 30000,
  });

  const sports = [...new Set(scores.map(g => g.sport_title))];
  const filteredScores = activeSport === 'all' 
    ? scores 
    : scores.filter(g => g.sport_title === activeSport);
  
  const liveCount = scores.filter(g => g.status === 'Live').length;

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-6 w-32 bg-white/10 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[280px] h-[180px] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-red-500/20 p-6">
        <p className="text-red-400 text-center">Unable to load scores</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              {liveCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{liveCount}</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Live Scores
                {liveCount > 0 && (
                  <span className="flex items-center gap-1 text-xs font-normal text-red-400">
                    <Radio className="w-3 h-3 animate-pulse" />
                    {liveCount} live
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">{scores.length} games today</p>
            </div>
          </div>
        </div>
        
        {/* Sport Filters */}
        <SportFilter 
          sports={sports} 
          activeSport={activeSport} 
          onSelect={setActiveSport}
        />
      </div>
      
      {/* Games Carousel */}
      <div className="p-4 md:p-6">
        {filteredScores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">No games scheduled right now</p>
            <p className="text-slate-500 text-xs mt-1">Check back later for live updates</p>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            onScroll={(e) => setScrollPosition(e.target.scrollLeft)}
            onMouseEnter={handleUserInteraction}
            onTouchStart={handleUserInteraction}
          >
            <AnimatePresence mode="popLayout">
              {filteredScores.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Footer Stats */}
      <div className="px-4 md:px-6 pb-4 md:pb-6">
        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-white/5">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Auto-updates every 30s
          </span>
          <span>Powered by ESPN</span>
        </div>
      </div>
    </div>
  );
}