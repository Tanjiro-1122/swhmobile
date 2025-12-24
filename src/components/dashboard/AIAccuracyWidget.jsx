import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, Flame, Award, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIAccuracyWidget() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['aiAccuracyStats'],
        queryFn: async () => {
            // Get prediction outcomes from the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const outcomes = await base44.entities.PredictionOutcome.filter({
                outcome_recorded_date: { $gte: thirtyDaysAgo.toISOString() }
            }, '-outcome_recorded_date', 100);
            
            if (!outcomes || outcomes.length === 0) {
                return { 
                    accuracy: 0, 
                    total: 0, 
                    wins: 0, 
                    streak: 0,
                    highConfidenceAccuracy: 0,
                    recentResults: []
                };
            }
            
            const wins = outcomes.filter(o => o.was_correct).length;
            const accuracy = Math.round((wins / outcomes.length) * 100);
            
            // Calculate high confidence accuracy
            const highConfidence = outcomes.filter(o => o.predicted_confidence === 'High');
            const highConfidenceWins = highConfidence.filter(o => o.was_correct).length;
            const highConfidenceAccuracy = highConfidence.length > 0 
                ? Math.round((highConfidenceWins / highConfidence.length) * 100) 
                : 0;
            
            // Calculate current streak
            let streak = 0;
            const sorted = [...outcomes].sort((a, b) => 
                new Date(b.outcome_recorded_date) - new Date(a.outcome_recorded_date)
            );
            for (const outcome of sorted) {
                if (outcome.was_correct) {
                    streak++;
                } else {
                    break;
                }
            }
            
            // Get last 10 results for the visual indicator
            const recentResults = sorted.slice(0, 10).map(o => o.was_correct);
            
            return { 
                accuracy, 
                total: outcomes.length, 
                wins, 
                streak,
                highConfidenceAccuracy,
                recentResults
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isLoading) {
        return (
            <Card className="bg-slate-800/50 border-slate-700 h-full">
                <CardContent className="p-6 flex items-center justify-center h-full">
                    <div className="animate-pulse flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-700 rounded-full" />
                        <div className="w-24 h-4 bg-slate-700 rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { accuracy = 0, total = 0, wins = 0, streak = 0, highConfidenceAccuracy = 0, recentResults = [] } = stats || {};

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
        >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 h-full overflow-hidden relative group hover:border-purple-500/50 transition-colors">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <CardContent className="p-5 relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Target className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="font-bold text-white">AI Performance</span>
                        </div>
                        {streak >= 3 && (
                            <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-full px-2 py-1">
                                <Flame className="w-3 h-3 text-orange-400" />
                                <span className="text-orange-400 text-xs font-bold">{streak} Streak!</span>
                            </div>
                        )}
                    </div>

                    {/* Main Stats */}
                    <div className="flex items-center gap-6 mb-4">
                        {/* Accuracy Circle */}
                        <div className="relative">
                            <svg className="w-20 h-20 -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="35"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="none"
                                    className="text-slate-700"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="35"
                                    stroke="url(#gradient)"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${accuracy * 2.2} 220`}
                                    className="transition-all duration-1000"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-black text-white">{accuracy}%</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="flex-1 grid grid-cols-2 gap-3">
                            <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                <p className="text-xl font-bold text-green-400">{wins}</p>
                                <p className="text-xs text-slate-400">Wins</p>
                            </div>
                            <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                <p className="text-xl font-bold text-slate-300">{total}</p>
                                <p className="text-xs text-slate-400">Total</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Results Strip */}
                    {recentResults.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-slate-500 mb-2">Last 10 predictions</p>
                            <div className="flex gap-1">
                                {recentResults.map((won, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                            won 
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}
                                    >
                                        {won ? 'W' : 'L'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* High Confidence Stat */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-slate-300">High Confidence Picks</span>
                        </div>
                        <span className="text-lg font-bold text-yellow-400">{highConfidenceAccuracy}%</span>
                    </div>

                    {/* View More Link */}
                    <Link 
                        to={createPageUrl('AnalysisHub') + '?tab=performance'} 
                        className="mt-4 flex items-center justify-center gap-1 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                    >
                        View Full Stats <ChevronRight className="w-4 h-4" />
                    </Link>
                </CardContent>
            </Card>
        </motion.div>
    );
}