import React from 'react';
import { Bot, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const AnimatedBotCard = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="animate-float relative"
        >
            <div className="relative w-[320px] h-[400px] sm:w-[380px] sm:h-[480px] rounded-3xl overflow-hidden glass-dark border border-white/10 lime-glow">
                <div className="absolute inset-0 bg-grid-dark" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                    >
                        <Bot className="w-32 h-32 sm:w-40 sm:h-40 text-[hsl(var(--brand-accent))]" strokeWidth={1.5} />
                    </motion.div>
                    <div className="absolute bottom-8 left-8 right-8 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-white/80 text-sm">AI Model Accuracy</p>
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[hsl(var(--brand-accent))]" />
                                <p className="text-white font-bold">Live</p>
                            </div>
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-white mt-1">97.3%</p>
                        <div className="w-full bg-white/10 h-1.5 rounded-full mt-3">
                            <div
                                className="bg-[hsl(var(--brand-accent))] h-1.5 rounded-full"
                                style={{ width: '97.3%' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AnimatedBotCard;