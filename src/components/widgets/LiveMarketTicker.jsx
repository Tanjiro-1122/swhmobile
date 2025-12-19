import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const LIVE_ODDS = [
  { id: 1, match: 'LAL vs GSW', market: 'Moneyline', odds: { home: -120, away: +105 }, trend: 'up' },
  { id: 2, match: 'MCY vs MAD', market: 'Total Goals', odds: { over: 2.5, under: 2.5 }, trend: 'down' },
  { id: 3, match: 'KC vs BUF', market: 'Spread', odds: { home: -3.5, away: +3.5 }, trend: 'up' },
  { id: 4, match: 'NYY vs LAD', market: 'Run Line', odds: { home: -1.5, away: +1.5 }, trend: 'stable' },
  { id: 5, match: 'BOS vs TBL', market: 'Puck Line', odds: { home: -1.5, away: +1.5 }, trend: 'up' },
  { id: 6, match: 'LIV vs ARS', market: 'BTTS', odds: { home: -150, away: +120 }, trend: 'down' },
];

const TickerContent = () => (
  <div className="flex items-center shrink-0">
    <Badge variant="outline" className="border-purple-400/30 text-purple-300 bg-purple-900/20 flex items-center gap-2 shrink-0 ml-6">
        <Globe className="w-3 h-3" />
        Global Markets
    </Badge>
    {LIVE_ODDS.map((odd) => (
        <div key={odd.id} className="flex items-center gap-4 px-6 border-l border-white/10 shrink-0">
            <span className="font-bold text-sm tracking-tight text-slate-100">{odd.match}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{odd.market}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white">{odd.odds.home || odd.odds.over}</span>
                {odd.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                ) : odd.trend === 'down' ? (
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                ) : null}
            </div>
        </div>
    ))}
  </div>
);

export const LiveMarketTicker = () => {
  return (
    <div className="bg-black/20 backdrop-blur-sm border-y border-white/10 py-3 overflow-hidden whitespace-nowrap relative flex items-center">
      <motion.div
        className="flex"
        animate={{
          x: ['0%', '-100%'],
        }}
        transition={{
          ease: 'linear',
          duration: 40,
          repeat: Infinity,
        }}
      >
        <TickerContent />
        <TickerContent />
      </motion.div>
    </div>
  );
};