import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

const stats = [
    { value: '84.2%', label: 'Bot Accuracy' },
    { value: '+$42.5k', label: 'User Profit (24h)' },
    { value: '1,420', label: 'Live Insights' },
];

const Stats = () => {
    return (
        <div className="py-12 bg-slate-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 items-center gap-8">
                        {stats.map((stat, index) => (
                             <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="text-center border-r border-slate-700 last:border-r-0 md:last:border-r"
                             >
                                <p className="text-4xl font-black text-lime-300">{stat.value}</p>
                                <p className="text-slate-400 mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                         <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-1 flex justify-center"
                         >
                            <Button className="bg-lime-400 text-slate-900 font-bold hover:bg-lime-500 rounded-full text-base px-8 py-6" asChild>
                                <Link to={createPageUrl('Pricing')}>Get Full Access</Link>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stats;