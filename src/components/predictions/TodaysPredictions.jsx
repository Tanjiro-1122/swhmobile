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
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glow-card bg-white/5 rounded-2xl p-5 border border-white/10 h-full flex flex-col"
        >
            <div className="flex justify-between items-start">
                <div>
                    <Badge variant="secondary" className="mb-2 bg-white/10 text-indigo-300 border-indigo-300/20">{pick.sport}</Badge>
                    <h4 className="font-bold text-white text-lg">{pick.pick}</h4>
                    <p className="text-sm text-slate-300">{pick.match}</p>
                </div>
                <div className="text-right flex-shrink-0 pl-4">
                    <div className="text-2xl font-bold text-cyan-300">{pick.odds}</div>
                    <p className="text-xs text-slate-400">Odds</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex-grow flex flex-col">
                <p className="text-sm text-slate-300 leading-relaxed flex-grow">{pick.reasoning}</p>
                <div className="flex justify-between items-center mt-4">
                     <Badge className={`mt-2 ${pick.confidence === 'High' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                        {pick.confidence} Confidence
                    </Badge>
                </div>
            </div>
        </motion.div>
    );
};


export default function TodaysPredictions() {
    const { data: brief, isLoading, error } = useQuery({
        queryKey: ['todaysBrief'],
        queryFn: async () => {
            // Fetch the most recent brief
            const briefs = await base44.entities.BettingBrief.list('-brief_date', 1);
            return briefs[0] || null;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    const topPicks = brief?.top_picks?.slice(0, 3) || [];

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <AlertTriangle className="w-8 h-8 mb-2 text-red-400" />
                    <p>Could not load predictions.</p>
                </div>
            );
        }

        if (!brief || topPicks.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                     <Trophy className="w-8 h-8 mb-2" />
                    <p className="font-semibold">No top picks available for today yet.</p>
                    <p className="text-sm">Our AI is analyzing the games. Check back soon!</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {topPicks.map((pick, index) => (
                    <PickCard key={index} pick={pick} index={index} />
                ))}
            </div>
        );
    };

    return (
        <Card className="bg-transparent border-none shadow-none mb-6 sm:mb-8">
            <CardHeader className="flex flex-row items-center justify-between p-0 mb-4">
                <div className="flex items-center gap-3">
                    <Zap className="w-7 h-7 text-cyan-300" />
                    <CardTitle className="text-white text-2xl font-bold">Today's Top AI Picks</CardTitle>
                </div>
                <Link to={createPageUrl('DailyBriefs')}>
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                        View All Briefs <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}