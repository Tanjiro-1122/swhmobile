import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const DashboardPromo = () => {
    return (
        <div className="py-16 md:py-24 bg-slate-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                         <div className="inline-block bg-slate-800 border border-slate-700 rounded-full px-4 py-1 text-sm text-lime-300 font-medium mb-4">
                            Live Engine
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-6">AI Analysis Dashboard</h2>
                        <ul className="space-y-4 text-slate-300 text-lg">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-6 h-6 text-lime-400 mt-1 flex-shrink-0" />
                                <span><span className="font-bold text-white">Real-time Odds Tracking:</span> Watch live movements from 50+ major sportsbooks.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-6 h-6 text-lime-400 mt-1 flex-shrink-0" />
                                <span><span className="font-bold text-white">Historical Trends:</span> Access deep data on team performance against the spread.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="w-6 h-6 text-lime-400 mt-1 flex-shrink-0" />
                                <span><span className="font-bold text-white">Custom Alerts:</span> Get notified when our AI detects a high-confidence play.</span>
                            </li>
                        </ul>
                         <Button variant="outline" className="mt-8 border-lime-400/50 bg-lime-400/10 text-lime-300 hover:bg-lime-400/20 hover:text-lime-200 rounded-full px-8 py-6 text-base" asChild>
                            <Link to={createPageUrl('Dashboard')}>Explore Dashboard</Link>
                        </Button>
                    </motion.div>
                     <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="p-2 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-2xl"
                    >
                        <img src="https://i.imgur.com/8V5Q0nS.png" alt="AI Dashboard" className="rounded-xl w-full" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPromo;