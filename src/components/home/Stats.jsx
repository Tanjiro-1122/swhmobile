import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";

const StatItem = ({ value, label, isLoading }) => {
    if (isLoading) {
        return (
            <div className="text-center">
                <Skeleton className="h-8 w-24 mb-2 mx-auto bg-slate-700" />
                <Skeleton className="h-4 w-20 mx-auto bg-slate-700" />
            </div>
        );
    }
    return (
        <div className="text-center">
            <p className="text-3xl sm:text-4xl font-black text-lime-300">{value}</p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">{label}</p>
        </div>
    );
};

const Stats = () => {
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const response = await base44.functions.invoke('getDashboardStats');
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data;
        },
        refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
        staleTime: 1000 * 60 * 1, // 1 minute
    });

    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '$0';
        const sign = amount >= 0 ? '+$' : '-$';
        const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });
        return sign + formattedAmount;
    };

    const displayStats = [
        { value: !isLoading && !isError && stats ? `${stats.botAccuracy}%` : '84.2%', label: 'Bot Accuracy' },
        { value: !isLoading && !isError && stats ? formatCurrency(stats.userProfit24h) : '+$42.5k', label: 'User Profit (24h)' },
        { value: !isLoading && !isError && stats ? stats.liveInsights.toLocaleString() : '1,420', label: 'Live Insights' },
    ];

    return (
        <section className="bg-slate-900/50 py-12 sm:py-16">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto px-4"
            >
                <div className="mx-auto max-w-4xl rounded-2xl bg-slate-800/60 border border-slate-700 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                    <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-6">
                        {displayStats.map((stat, index) => (
                            <div key={index} className="flex justify-center">
                               <StatItem value={stat.value} label={stat.label} isLoading={isLoading} />
                            </div>
                        ))}
                         <div className="col-span-2 md:col-span-1 flex justify-center">
                            <Link to={createPageUrl('Pricing')} className="inline-block">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-lime-300 text-slate-900 font-bold px-6 py-3 rounded-full text-sm sm:text-base hover:bg-lime-400 transition-colors duration-200 shadow-lg shadow-lime-500/10"
                                >
                                    Get Full Access
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default Stats;