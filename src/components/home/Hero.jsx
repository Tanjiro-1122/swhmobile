import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { PlayCircle, Star } from 'lucide-react';
import AnimatedBotCard from './AnimatedBotCard';

const Hero = () => {
    return (
        <div className="relative w-full pt-28 pb-16 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-center lg:text-left"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-block bg-slate-800/80 border border-slate-700 rounded-full px-4 py-1.5 text-sm text-lime-300 font-medium mb-4"
                        >
                            ⚡️ The Evolution in Sports Betting Analysis
                        </motion.div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-tight text-white">
                            The Future
                            <br />
                            of <span className="text-[hsl(var(--brand-accent))]">Winning</span>
                        </h1>
                        <p className="max-w-lg mx-auto lg:mx-0 mt-6 text-lg text-slate-400">
                            Powered by advanced neural networks, SportWagerHelper transforms chaotic data into precise betting opportunities.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-[hsl(var(--brand-accent))] text-slate-900 font-bold hover:bg-[hsl(var(--brand-accent)/0.9)] text-lg px-8 py-6 rounded-full"
                                asChild
                            >
                                <Link to={createPageUrl('Pricing')}>Deploy AI Assistant</Link>
                            </Button>
                            <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white/80 hover:bg-white/10 hover:text-white text-lg px-8 py-6 rounded-full" asChild>
                                <Link to={createPageUrl('AnalysisHub')}>
                                    <PlayCircle className="w-5 h-5 mr-2" />
                                    See Predictions
                                </Link>
                            </Button>
                        </div>
                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4">
                            <div className="flex -space-x-2">
                                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900" src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" />
                                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900" src="https://randomuser.me/api/portraits/women/62.jpg" alt="User" />
                                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900" src="https://randomuser.me/api/portraits/men/8.jpg" alt="User" />
                                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900" src="https://randomuser.me/api/portraits/women/12.jpg" alt="User" />
                            </div>
                            <p className="text-sm text-slate-400">
                                Join <span className="font-bold text-white">15,000+</span> Smart Money Bettors
                            </p>
                        </div>
                    </motion.div>

                    <div className="lg:w-full flex items-center justify-center">
                        <AnimatedBotCard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;