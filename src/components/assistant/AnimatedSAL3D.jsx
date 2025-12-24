import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GraduationCap, Newspaper, Users, Zap } from 'lucide-react';

// Default animated owl video URL
const DEFAULT_OWL_VIDEO = 'https://i.imgur.com/U6Qr1lM.mp4';

// Default static owl image
const DEFAULT_OWL_IMAGE = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg';

export default function AnimatedSAL3D({ onPromptClick }) {
    const [mascotUrl, setMascotUrl] = useState(DEFAULT_OWL_VIDEO);

    useEffect(() => {
        const customUrl = localStorage.getItem('sal_mascot_url');
        if (customUrl) {
            setMascotUrl(customUrl);
        }
    }, []);

    const isVideo = mascotUrl.endsWith('.mp4') || mascotUrl.includes('video') || mascotUrl.includes('imgur.com');

    const quickActions = [
        { text: "What should I learn first?", icon: GraduationCap, color: "from-purple-500 to-indigo-500", link: "LearningCenter" },
        { text: "Read today's daily brief", icon: Newspaper, color: "from-amber-500 to-orange-500", link: "DailyBriefs" },
        { text: "Discuss it amongst your peers", icon: Users, color: "from-green-500 to-emerald-500", link: "CommunityHub" },
        { text: "Today's betting tips", icon: Zap, color: "from-cyan-500 to-blue-500", link: null },
    ];

    return (
        <div className="flex flex-col items-center justify-center py-6">
            {/* Animated Owl Video Container */}
            <motion.div
                className="relative w-64 h-64"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Ambient glow layers */}
                <motion.div 
                    className="absolute inset-0 rounded-full"
                    animate={{
                        boxShadow: [
                            '0 0 60px 20px rgba(168, 85, 247, 0.3), 0 0 100px 40px rgba(6, 182, 212, 0.2)',
                            '0 0 80px 30px rgba(168, 85, 247, 0.4), 0 0 120px 50px rgba(132, 204, 22, 0.2)',
                            '0 0 60px 20px rgba(168, 85, 247, 0.3), 0 0 100px 40px rgba(6, 182, 212, 0.2)',
                        ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                />

                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            background: i % 2 === 0 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(6, 182, 212, 0.6)',
                            left: `${15 + Math.random() * 70}%`,
                            top: `${15 + Math.random() * 70}%`,
                        }}
                        animate={{
                            y: [0, -15, 0],
                            opacity: [0.3, 0.7, 0.3],
                            scale: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 2 + i * 0.3,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                    />
                ))}

                {/* Video container with glow border */}
                <div className="relative w-full h-full flex items-center justify-center">
                    <motion.div
                        className="relative"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        {/* Gradient border glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-3xl blur-sm opacity-75" />
                        
                        {/* The animated owl video */}
                        <video 
                            src={ANIMATED_OWL_VIDEO}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="relative w-40 h-40 rounded-3xl object-cover shadow-2xl border-2 border-purple-400/50"
                        />
                    </motion.div>
                </div>
            </motion.div>

            {/* Speech bubble */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative mt-4 max-w-sm"
            >
                {/* Bubble pointer */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-l border-t border-purple-500/30 rotate-45" />
                
                <div className="relative bg-slate-800/90 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-4 shadow-xl">
                    <motion.p 
                        className="text-center text-white font-medium mb-3"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent">
                            What would you like to learn today?
                        </span>
                    </motion.p>
                    <p className="text-center text-slate-400 text-sm mb-4">
                        I can search my files and help with any questions!
                    </p>

                    {/* Quick action buttons */}
                    <div className="flex flex-col gap-2">
                        {quickActions.map((action, idx) => {
                            const IconComponent = action.icon;
                            
                            if (action.link) {
                                return (
                                    <Link key={idx} to={createPageUrl(action.link)}>
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + idx * 0.1 }}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-white/10 hover:border-white/30 hover:from-slate-700/80 hover:to-slate-600/80 transition-all text-left group"
                                        >
                                            <div className={`p-1.5 rounded-lg bg-gradient-to-r ${action.color}`}>
                                                <IconComponent className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-white/80 text-sm group-hover:text-white transition-colors">{action.text}</span>
                                        </motion.div>
                                    </Link>
                                );
                            }
                            
                            return (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                    onClick={() => onPromptClick(action.text)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-white/10 hover:border-white/30 hover:from-slate-700/80 hover:to-slate-600/80 transition-all text-left group"
                                >
                                    <div className={`p-1.5 rounded-lg bg-gradient-to-r ${action.color}`}>
                                        <IconComponent className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white/80 text-sm group-hover:text-white transition-colors">{action.text}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}