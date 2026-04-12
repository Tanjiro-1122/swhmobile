import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const FinalCTA = () => {
    return (
        <div className="py-16 md:py-24 bg-slate-900/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight"
                >
                    Ready to Win?
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.7 }}
                    className="max-w-xl mx-auto mt-4 text-lg text-slate-400"
                >
                    Join thousands of smart bettors using AI to outperform the house every single day.
                </motion.p>
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.7 }}
                    className="mt-8"
                 >
                    <Button
                        size="lg"
                        className="bg-lime-400 text-slate-900 font-bold hover:bg-lime-500 text-lg px-10 py-7 rounded-full shadow-lg shadow-lime-500/20"
                        asChild
                    >
                        <Link to={createPageUrl('Pricing')}>Get Started</Link>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

export default FinalCTA;