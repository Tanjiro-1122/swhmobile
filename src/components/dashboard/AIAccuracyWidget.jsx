import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Flame, Award, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIAccuracyWidget() {
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['aiAccuracyStats'],
        queryFn: async () => {
            // Get recent prediction outcomes - simpler query, more reliable
            const outcomes = await base44.entities.PredictionOutcome.list('-outcome_recorded_date', 50);
            
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
        retry: 2,
    });

    // Don't render anything on error to avoid broken UI
    if (isError) {
        return null;
    }

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

    const { accuracy = 0, total = 0, wins = 0, streak = 0, highConfidenceAccuracy = 0 } = stats || {};

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 overflow-hidden relative group hover:border-purple-500/50 transition-colors">
                <CardContent className="p-4 relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-400" />
                            <span className="font-bold text-white text-sm">AI Performance</span>
                        </div>
                        {streak >= 3 && (
                            <div className="flex items-center gap-1 bg-orange-500/20 rounded-full px-2 py-0.5">
                                <Flame className="w-3 h-3 text-orange-400" />
                                <span className="text-orange-400 text-xs font-bold">{streak}🔥</span>
                            </div>
                        )}
                    </div>

                    {/* Compact Stats Row */}
                    <div className="flex items-center gap-4 mb-3">
                        {/* Smaller Accuracy Circle */}
                        <div className="relative flex-shrink-0">
                            <svg className="w-14 h-14 -rotate-90">
                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-700" />
                                <circle cx="28" cy="28" r="24" stroke="url(#gradientCompact)" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray={`${accuracy * 1.5} 150`} className="transition-all duration-1000" />
                                <defs>
                                    <linearGradient id="gradientCompact" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-black text-white">{accuracy}%</span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 flex-1">
                            <div className="text-center">
                                <p className="text-lg font-bold text-green-400">{wins}</p>
                                <p className="text-xs text-slate-500">Wins</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-slate-300">{total}</p>
                                <p className="text-xs text-slate-500">Total</p>
                            </div>
                        </div>
                    </div>

                    {/* Low Risk - Compact */}
                    <div className="flex items-center justify-between p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-2">
                        <div className="flex items-center gap-1">
                            <Award className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-slate-300">Low Risk Picks</span>
                        </div>
                        <span className="text-sm font-bold text-yellow-400">{highConfidenceAccuracy}%</span>
                    </div>

                    {/* View More Link */}
                    <Link 
                        to={createPageUrl('AnalysisHub') + '?tab=performance'} 
                        className="flex items-center justify-center gap-1 text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors"
                    >
                        View Full Stats <ChevronRight className="w-3 h-3" />
                    </Link>
                </CardContent>
            </Card>
        </motion.div>
    );
}