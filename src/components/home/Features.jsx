import { motion } from 'framer-motion';
import { BrainCircuit, Search, Target } from 'lucide-react';

const featureList = [
    {
        icon: BrainCircuit,
        title: 'Predictive Modeling',
        description: 'Advanced machine learning algorithms that simulate games 10,000 times to find the true probability of outcomes.'
    },
    {
        icon: Search,
        title: 'Odds Value Finder',
        description: 'Identify discrepancies between bookmaker lines and actual probability to spot massive value opportunities.'
    },
    {
        icon: Target,
        title: 'Niche Market Edge',
        description: 'From player props to obscure leagues, our AI finds edges where human analysis often fails to look.'
    }
];

const Features = () => {
    return (
        <div className="py-16 md:py-24 bg-slate-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-block bg-slate-800 border border-slate-700 rounded-full px-4 py-1 text-sm text-lime-300 font-medium mb-4"
                    >
                        Analysis Engine
                    </motion.div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">Built for Serious Bettors</h2>
                    <p className="mt-4 text-lg text-slate-400">
                        Our proprietary AI models process millions of variables in real-time to give you the most accurate sports predictions on the planet.
                    </p>
                </div>
                <div className="mt-16 grid md:grid-cols-3 gap-8">
                    {featureList.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                             <div className="h-full bg-slate-800/50 border border-slate-700 rounded-2xl p-8 glow-card transition-all duration-300 hover:border-slate-600 hover:-translate-y-1">
                                <div className="p-3 bg-lime-400/10 rounded-lg border border-lime-400/20 inline-block mb-4">
                                    <feature.icon className="w-7 h-7 text-lime-300" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-slate-400">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;