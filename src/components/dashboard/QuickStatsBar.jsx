import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Target, Flame, Trophy, TrendingUp, Calendar, Zap } from 'lucide-react';

export default function QuickStatsBar() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['quickStats'],
        queryFn: async () => {
            const [outcomes, briefs, bets] = await Promise.all([
                base44.entities.PredictionOutcome.list('-outcome_recorded_date', 50),
                base44.entities.BettingBrief.list('-brief_date', 1),
                base44.entities.TrackedBet.filter({ result: 'pending' }, '-bet_date', 10)
            ]);
            
            // Calculate accuracy
            const wins = outcomes.filter(o => o.was_correct).length;
            const accuracy = outcomes.length > 0 ? Math.round((wins / outcomes.length) * 100) : 0;
            
            // Calculate streak
            let streak = 0;
            for (const outcome of outcomes) {
                if (outcome.was_correct) streak++;
                else break;
            }
            
            // Today's picks count
            const todaysPicks = briefs[0]?.top_picks?.length || 0;
            
            // Pending bets count
            const pendingBets = bets.length;
            
            return { accuracy, streak, todaysPicks, pendingBets, totalPredictions: outcomes.length };
        },
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    const { accuracy = 0, streak = 0, todaysPicks = 0, pendingBets = 0 } = stats || {};

    const statCards = [
        {
            icon: Target,
            label: 'AI Accuracy',
            value: `${accuracy}%`,
            color: 'from-purple-500 to-indigo-600',
            iconBg: 'bg-purple-500/20',
            iconColor: 'text-purple-400'
        },
        {
            icon: streak >= 3 ? Flame : TrendingUp,
            label: streak >= 3 ? 'Hot Streak!' : 'Current Streak',
            value: streak,
            color: streak >= 3 ? 'from-orange-500 to-red-600' : 'from-cyan-500 to-blue-600',
            iconBg: streak >= 3 ? 'bg-orange-500/20' : 'bg-cyan-500/20',
            iconColor: streak >= 3 ? 'text-orange-400' : 'text-cyan-400'
        },
        {
            icon: Zap,
            label: "Today's Picks",
            value: todaysPicks,
            color: 'from-lime-500 to-emerald-600',
            iconBg: 'bg-lime-500/20',
            iconColor: 'text-lime-400'
        },
        {
            icon: Calendar,
            label: 'Pending Bets',
            value: pendingBets,
            color: 'from-pink-500 to-rose-600',
            iconBg: 'bg-pink-500/20',
            iconColor: 'text-pink-400'
        }
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {statCards.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                >
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity`} />
                    <div className="relative bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 ${stat.iconBg} rounded-lg`}>
                                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-xs text-slate-400">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}