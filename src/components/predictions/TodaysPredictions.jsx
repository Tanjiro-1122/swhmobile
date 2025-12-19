import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, Trophy, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const PickCard = ({ pick, index }) => {
    const confidenceStyles = {
        High: 'bg-green-500/10 text-green-400 border-green-500/30',
        Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        Low: 'bg-red-500/10 text-red-400 border-red-500/30',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 h-full flex flex-col justify-between group transition-all hover:border-slate-600"
        >
            <div>
                <div className="flex justify-between items-start mb-3">
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300 border-slate-600">{pick.sport}</Badge>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">{pick.odds}</p>
                        <p className="text-xs text-slate-400 -mt-1">Odds</p>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{pick.pick}</h3>
                <p className="text-sm text-slate-400 mb-4">{pick.match}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{pick.reasoning}</p>
            </div>
            <Badge className={`mt-4 self-start border ${confidenceStyles[pick.confidence] || 'bg-slate-700 text-slate-200'}`}>
                {pick.confidence} Confidence
            </Badge>
        </motion.div>
    );
};


export default function TodaysPredictions() {
    const { data: brief, isLoading, error } = useQuery({
        queryKey: ['todaysBrief'],
        queryFn: async () => {
            const briefs = await base44.entities.BettingBrief.list('-brief_date', 1);
            return briefs[0] || null;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    const topPicks = brief?.top_picks?.slice(0, 2) || [];

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 h-48 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                        </div>
                    ))}
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-5 h-48 flex flex-col items-center justify-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 mb-2 text-red-400" />
                    <p>Could not load predictions.</p>
                </div>
            );
        }

        if (!brief || topPicks.length === 0) {
            return (
                 <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 h-48 flex flex-col items-center justify-center text-center text-slate-400">
                     <Trophy className="w-8 h-8 mb-2" />
                    <p className="font-semibold">No top picks available for today yet.</p>
                    <p className="text-sm">Our AI is analyzing the games. Check back soon!</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topPicks.map((pick, index) => (
                    <PickCard key={index} pick={pick} index={index} />
                ))}
            </div>
        );
    };

    return (
        <div className="w-full mb-12">
            <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-2xl font-bold text-white">Today's Top AI Picks</h2>
                </div>
                <Link to={createPageUrl('DailyBriefs')}>
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 rounded-lg">
                        View All Briefs <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
            </div>
            {renderContent()}
        </div>
    );
}