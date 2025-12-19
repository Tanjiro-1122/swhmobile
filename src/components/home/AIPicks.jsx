import { ArrowUpRight, AlertTriangle } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const picks = [
    {
        sport: 'NBA',
        teams: 'Lakers VS Warriors',
        pick: 'Lakers',
        confidence: '85%',
        reason: 'AI detected 15% edge in Lakers defensive rotation against Curry.',
        homeProb: '65%',
        drawProb: '-',
        awayProb: '35%',
    },
    {
        sport: 'Champions League',
        teams: 'Man City VS Real Madrid',
        pick: 'Draw',
        confidence: '62%',
        reason: 'Midfield control metrics suggest high probability of stalemate.',
        homeProb: '30%',
        drawProb: '40',
        awayProb: '30%',
        alert: 'Upset Alert',
    },
    {
        sport: 'NFL',
        teams: 'Chiefs VS Bills',
        pick: 'Chiefs',
        confidence: '78%',
        reason: 'Mahomes historical performance in cold weather vs Bills secondary.',
        homeProb: '58%',
        drawProb: '-',
        awayProb: '42%',
    },
];

const AIPicks = () => {
    return (
        <div className="py-20 sm:py-32 bg-slate-900 relative">
             <div className="absolute inset-0 bg-grid-dark z-0 opacity-50"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
            <div className="container mx-auto px-4 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true, amount: 0.5 }}
                >
                    <p className="font-semibold text-cyan-400 mb-2 text-center text-lg">Live AI Predictions</p>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-center">
                        Today's High-Confidence Insights
                    </h2>
                    <p className="mt-4 text-lg text-slate-300 text-center max-w-2xl mx-auto">
                        Our AI has analyzed today's full slate. Here are the top-rated mathematical edges currently active in the market.
                    </p>
                </motion.div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {picks.map((pick, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                            viewport={{ once: true, amount: 0.5 }}
                            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <Badge variant="secondary" className="bg-slate-700 text-slate-300 border-slate-600">{pick.sport}</Badge>
                                {pick.alert && <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/50 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{pick.alert}</Badge>}
                            </div>
                            <p className="text-lg text-slate-400 font-medium">{pick.teams}</p>
                            
                            <div className="my-6 text-center">
                                <p className="text-sm text-cyan-400 font-semibold">AI Pick</p>
                                <p className="text-4xl font-bold text-white my-1">{pick.pick}</p>
                                <p className="text-lg font-bold text-cyan-400">{pick.confidence}</p>
                            </div>

                            <p className="text-slate-300 text-center text-sm mb-6 flex-grow">{pick.reason}</p>

                            <div className="grid grid-cols-3 text-center border-t border-slate-700 pt-4">
                                <div>
                                    <p className="text-xs text-slate-400">Home</p>
                                    <p className="text-lg font-bold text-white">{pick.homeProb}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Draw</p>
                                    <p className="text-lg font-bold text-white">{pick.drawProb}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Away</p>
                                    <p className="text-lg font-bold text-white">{pick.awayProb}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                 <div className="text-center mt-12">
                    <Button asChild variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800">
                        <Link to={createPageUrl('AnalysisHub')}>
                            View All Predictions <ArrowUpRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AIPicks;