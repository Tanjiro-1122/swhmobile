import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { PlayCircle, Star } from 'lucide-react';

const AnimatedBotCard = () => {
  // Placeholder for the old AnimatedBotCard, can be rebuilt if needed
  return <div className="w-64 h-64 bg-slate-800 rounded-lg"></div>;
}

const HomePage = () => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-900 text-white">
            <div className="absolute inset-0 bg-grid-dark" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between min-h-screen pt-32 pb-16 lg:pt-20 lg:pb-0">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:w-1/2 text-center lg:text-left mb-12 lg:mb-0"
                    >
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
                            Bet Smarter,
                            <br />
                            Not Harder.
                        </h1>
                        <p className="max-w-md mx-auto lg:mx-0 mt-6 text-lg text-white/60">
                            Leverage our advanced AI to get data-driven betting insights, predictions, and analytics. Stop guessing, start winning.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-[hsl(var(--brand-accent))] text-black font-bold hover:bg-[hsl(var(--brand-accent)/0.9)] text-lg px-8 py-6"
                                asChild
                            >
                                <Link to={createPageUrl('Pricing')}>Get Started</Link>
                            </Button>
                            <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white/80 hover:bg-white/10 hover:text-white text-lg px-8 py-6">
                                <PlayCircle className="w-5 h-5 mr-2" />
                                Watch Demo
                            </Button>
                        </div>
                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-sm text-white/60">
                                Loved by <span className="font-bold text-white">10,000+</span> users worldwide.
                            </p>
                        </div>
                    </motion.div>

                    <div className="lg:w-1/2 flex items-center justify-center mt-8 lg:mt-0">
                        <AnimatedBotCard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;