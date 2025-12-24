import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GraduationCap, Newspaper, Users, Zap } from 'lucide-react';

export default function AnimatedSAL3D({ onPromptClick }) {
    const [isHovered, setIsHovered] = useState(false);
    const [eyeBlink, setEyeBlink] = useState(false);
    const [bookGlow, setBookGlow] = useState(0);

    // Blink effect
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setEyeBlink(true);
            setTimeout(() => setEyeBlink(false), 150);
        }, 3000 + Math.random() * 2000);
        return () => clearInterval(blinkInterval);
    }, []);

    // Book glow pulse
    useEffect(() => {
        const glowInterval = setInterval(() => {
            setBookGlow(prev => (prev + 1) % 3);
        }, 800);
        return () => clearInterval(glowInterval);
    }, []);

    const quickActions = [
        { text: "What should I learn first?", icon: GraduationCap, color: "from-purple-500 to-indigo-500", link: null, tab: "learn" },
        { text: "Read today's daily brief", icon: Newspaper, color: "from-amber-500 to-orange-500", link: null, tab: "briefs" },
        { text: "Discuss it amongst your peers", icon: Users, color: "from-green-500 to-emerald-500", link: null, tab: "community" },
        { text: "Today's betting tips", icon: Zap, color: "from-cyan-500 to-blue-500", link: null, tab: null },
    ];

    return (
        <div className="flex flex-col items-center justify-center py-6">
            {/* 3D Scene Container */}
            <motion.div
                className="relative w-64 h-64 perspective-1000"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                animate={{
                    rotateY: isHovered ? 5 : 0,
                    rotateX: isHovered ? -5 : 0,
                }}
                transition={{ type: "spring", stiffness: 100 }}
                style={{ transformStyle: 'preserve-3d' }}
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
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            background: i % 2 === 0 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(6, 182, 212, 0.6)',
                            left: `${20 + Math.random() * 60}%`,
                            top: `${20 + Math.random() * 60}%`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            x: [0, (i % 2 === 0 ? 10 : -10), 0],
                            opacity: [0.3, 0.8, 0.3],
                            scale: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 2 + i * 0.3,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                    />
                ))}

                {/* Main S.A.L. Container - 3D effect */}
                <motion.div
                    className="relative w-full h-full flex items-center justify-center"
                    animate={{ 
                        y: [0, -8, 0],
                        rotateZ: isHovered ? [0, -2, 2, 0] : 0,
                    }}
                    transition={{ 
                        y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        rotateZ: { duration: 0.5 }
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Back shadow layer */}
                    <div 
                        className="absolute w-40 h-40 rounded-3xl bg-black/30 blur-xl"
                        style={{ transform: 'translateZ(-30px) translateY(20px)' }}
                    />

                    {/* Middle glow layer */}
                    <motion.div 
                        className="absolute w-36 h-36 rounded-3xl"
                        style={{ 
                            transform: 'translateZ(-15px)',
                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(6, 182, 212, 0.5))',
                            filter: 'blur(15px)',
                        }}
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Main owl image */}
                    <motion.div
                        className="relative"
                        style={{ transform: 'translateZ(20px)' }}
                        whileHover={{ scale: 1.05 }}
                    >
                        {/* Glasses glint effect */}
                        <motion.div
                            className="absolute top-8 left-8 w-6 h-2 bg-white/60 rounded-full blur-sm z-20"
                            animate={{
                                opacity: [0, 0.8, 0],
                                x: [0, 20, 40],
                            }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        />

                        {/* The owl image with 3D border */}
                        <div className="relative">
                            <div 
                                className="absolute inset-0 rounded-3xl"
                                style={{
                                    background: 'linear-gradient(135deg, #a855f7, #06b6d4, #84cc16)',
                                    transform: 'translateZ(-5px)',
                                    padding: '3px',
                                }}
                            />
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                                alt="S.A.L. the Owl"
                                className="relative w-32 h-32 rounded-3xl object-cover shadow-2xl border-2 border-purple-400/50"
                                style={{ transform: 'translateZ(5px)' }}
                            />

                            {/* Eye blink overlay */}
                            {eyeBlink && (
                                <div className="absolute top-6 left-6 right-6 h-4 bg-slate-800/80 rounded-full" 
                                    style={{ transform: 'translateZ(10px)' }} 
                                />
                            )}
                        </div>

                        {/* Glowing book effect */}
                        <motion.div
                            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-lg"
                            style={{ transform: 'translateZ(30px)' }}
                            animate={{
                                boxShadow: bookGlow === 0 
                                    ? '0 0 20px 5px rgba(132, 204, 22, 0.6)' 
                                    : bookGlow === 1 
                                    ? '0 0 30px 10px rgba(132, 204, 22, 0.8)' 
                                    : '0 0 20px 5px rgba(168, 85, 247, 0.6)',
                            }}
                        />

                        {/* Floating lightbulb */}
                        <motion.div
                            className="absolute -top-4 -right-2 text-2xl"
                            style={{ transform: 'translateZ(40px)' }}
                            animate={{
                                y: [0, -5, 0],
                                rotate: [0, 10, -10, 0],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            💡
                        </motion.div>
                    </motion.div>
                </motion.div>
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
                        {quickActions.map((action, idx) => (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                                onClick={() => onPromptClick(action.text)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 hover:border-purple-400/60 hover:from-purple-500/30 hover:to-cyan-500/30 transition-all text-left group"
                            >
                                <span className="text-lg">{action.icon}</span>
                                <span className="text-white/80 text-sm group-hover:text-white transition-colors">{action.text}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}