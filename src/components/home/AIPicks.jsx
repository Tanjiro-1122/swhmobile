import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Zap, ShieldAlert, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const picks = [
    {
        sport: 'NBA',
        teams: 'Lakers vs Warriors',
        pick: 'Lakers',
        reason: 'AI detected 15% edge in Lakers defensive rotation against Curry.',
        probabilities: [
            { label: 'Dubs', value: 68 },
            { label: 'Lakers', value: 32 }
        ],
        confidence: 88
    },
    {
        sport: 'Champions League',
        teams: 'Man City vs Real Madrid',
        pick: 'Draw',
        reason: 'Midfield control metrics suggest high probability of stalemate.',
        probabilities: [
            { label: '35%', value: 35 },
            { label: '40%', value: 40 },
            { label: '25%', value: 25 }
        ],
        confidence: 65,
        tag: 'Upset Alert'
    },
    {
        sport: 'NFL',
        teams: 'Chiefs vs Bills',
        pick: 'Chiefs',
        reason: 'Mahomes historical performance in cold weather vs Bills secondary.',
        probabilities: [
            { label: '', value: 0 },
            { label: '', value: 0 }
        ],
        confidence: 72
    }
];

const AIPicks = () => {
    return (
        <div className="py-16 md:py-24 bg-slate-900/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12">
                    <div className="text-center md:text-left mb-6 md:mb-0">
                         <div className="inline-block bg-slate-800 border border-slate-700 rounded-full px-4 py-1 text-sm text-lime-300 font-medium mb-4">
                            ⚡️ Live AI Predictions
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Today's High-Confidence Picks</h2>
                    </div>
                    <Button variant="outline" className="border-lime-400/50 bg-lime-400/10 text-lime-300 hover:bg-lime-400/20 hover:text-lime-200 rounded-full" asChild>
                        <Link to={createPageUrl('Pricing')}>View All Predictions</Link>
                    </Button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {picks.map((p, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-slate-800/50 border border-lime-400/20 rounded-2xl p-6 flex flex-col glow-card hover:border-lime-400/40 transition-all"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <Badge className="bg-slate-700 text-slate-300 border-slate-600">{p.sport}</Badge>
                                {p.tag && <Badge className="bg-red-500/20 text-red-300 border border-red-500/30"><ShieldAlert className="w-3 h-3 mr-1.5"/>{p.tag}</Badge>}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">{p.teams}</h3>
                            
                            <div className="flex items-center justify-between bg-slate-900/70 p-3 rounded-lg mb-4">
                                <span className="text-sm text-slate-400">AI PICK</span>
                                <span className="text-lg font-bold text-lime-300 flex items-center gap-2">
                                    <Zap className="w-4 h-4"/>
                                    {p.pick}
                                </span>
                            </div>

                            <div className="w-full bg-slate-700/50 rounded-full h-2.5 mb-2">
                                <div className="bg-lime-400 h-2.5 rounded-full" style={{ width: `${p.confidence}%` }}></div>
                            </div>
                            <div className="text-right text-sm text-slate-400 mb-4">{p.confidence}% Confidence</div>
                            
                            <p className="text-slate-400 text-sm mb-4"><BarChart2 className="inline w-4 h-4 mr-2 text-lime-400/70"/>{p.reason}</p>
                            
                            <div className="grid grid-cols-2 gap-2 text-center text-xs text-slate-400 mt-auto">
                                {p.probabilities[0].label && <div className="bg-slate-900/70 p-2 rounded-md">{p.probabilities[0].label}</div>}
                                {p.probabilities[1].label && <div className="bg-slate-900/70 p-2 rounded-md">{p.probabilities[1].label}</div>}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIPicks;