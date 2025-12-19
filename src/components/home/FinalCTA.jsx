import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const FinalCTA = () => {
    return (
        <div className="relative py-20 sm:py-32 bg-slate-800/50">
            <div className="container mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true, amount: 0.5 }}
                >
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tighter">
                        Ready to Win?
                    </h2>
                    <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
                        Join thousands of smart bettors using AI to outperform the house every single day.
                    </p>
                    <Button asChild size="lg" className="mt-10 bg-cyan-400 text-slate-900 font-bold hover:bg-cyan-300 px-10 py-7 rounded-full text-lg shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105">
                        <Link to={createPageUrl('Pricing')}>Join Now — 7 Days Free</Link>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

export default FinalCTA;