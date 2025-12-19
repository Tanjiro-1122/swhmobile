import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Zap, Activity } from 'lucide-react';

const AnimatedBotCard = () => {
    return (
        <motion.div
            className="relative w-full max-w-md h-80 lg:h-96 bg-slate-800/40 rounded-3xl border border-lime-400/20 shadow-2xl shadow-lime-500/10 overflow-hidden lime-glow"
            style={{ '--glow-color': 'hsl(var(--brand-accent))' }}
        >
            <div className="absolute inset-0 bg-grid-dark opacity-50"></div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-8">
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="p-6 bg-lime-400/10 rounded-full border border-lime-400/30 mb-6"
                >
                    <Bot className="w-20 h-20 text-lime-300" />
                </motion.div>

                <div className="bg-lime-400/10 border border-lime-400/30 rounded-full px-4 py-1.5 text-lime-300 text-sm font-semibold flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4" />
                    ACTIVE PROCESSING
                </div>
                <div className="bg-slate-800/70 border border-slate-700 rounded-full px-4 py-1.5 text-white text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-lime-400" />
                    94.2% HISTORICAL PRECISION
                </div>
            </div>
        </motion.div>
    );
};

export default AnimatedBotCard;