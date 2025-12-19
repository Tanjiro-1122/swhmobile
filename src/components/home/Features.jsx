import { Zap, Search, BrainCircuit } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';

const features = [
    {
        icon: BrainCircuit,
        title: 'Predictive Modeling',
        description: 'Advanced machine learning algorithms that simulate games 10,000 times to find the true probability of outcomes.',
    },
    {
        icon: Search,
        title: 'Odds Value Finder',
        description: 'Identify discrepancies between bookmaker lines and actual probability to spot massive value opportunities.',
    },
    {
        icon: Zap,
        title: 'Niche Market Edge',
        description: 'From player props to obscure leagues, our AI finds edges where human analysis often fails to look.',
    },
];

const Features = () => {
    return (
        <div className="py-20 sm:py-32">
            <div className="container mx-auto px-4">
                <motion.div 
                    initial={{ opacity: 0, y:20 }}
                    whileInView={{ opacity: 1, y: 0}}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true, amount: 0.5}}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tighter">
                        Built for Serious Bettors
                    </h2>
                    <p className="mt-6 text-lg sm:text-xl text-slate-300">
                        Our proprietary AI models process millions of variables in real-time to give you the most accurate sports predictions on the planet.
                    </p>
                </motion.div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                         <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                             viewport={{ once: true, amount: 0.5 }}
                            className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 text-center"
                        >
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-cyan-400/50">
                                <feature.icon className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h3 className="mt-6 text-xl font-bold text-white">{feature.title}</h3>
                            <p className="mt-2 text-slate-400">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;